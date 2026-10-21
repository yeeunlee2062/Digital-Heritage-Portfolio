"""Register the 32 video cameras to the Alembic mesh coordinate system.

Stage A (coarse): render the textured mesh (frame 1) from a ring of virtual views, SIFT-match each real
image against them, lift matched render pixels to 3D with the rendered depth, and solve PnP over a
focal-length sweep.
Stage B (refine): for several timestamps, re-render from the current estimate, match again, pool all
2D-3D pairs of one camera (static camera => one view) and run cv2.calibrateCamera with distortion.

usage: python calibrate.py [--cams 1,2,...]
writes data/calib/cameras.json
"""
import argparse
import json
import os
import subprocess
import sys

import cv2
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from common import DATA, IMG_H, IMG_W, NUM_FRAMES, Splats, chroma_mask, has_tex, look_at, render  # noqa: E402

CAL_FRAMES = []  # mesh frames (1-based); default: 8 evenly spaced frames that have a texture
OUT = os.path.join(DATA, "calib")
UP = np.array([0, -1.0, 0])  # mesh is Y-down
sift = cv2.SIFT_create(nfeatures=12000, contrastThreshold=0.02)
matcher = cv2.BFMatcher(cv2.NORM_L2)


def to_u8(t):
    return (t.clamp(0, 1).cpu().numpy() * 255).astype(np.uint8)


def real_image(cam, frame):
    img = np.asarray(Image.open(os.path.join(DATA, "frames", f"cam{cam:03d}_m{frame:05d}.png")).convert("RGB"))
    m = chroma_mask(img)
    return img * m[..., None], m


def detect(img, mask=None):
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    kp, des = sift.detectAndCompute(g, None if mask is None else mask.astype(np.uint8) * 255)
    return np.float32([k.pt for k in kp]).reshape(-1, 2), des


def match(d1, d2, ratio=0.8):
    if d1 is None or d2 is None or len(d1) < 2 or len(d2) < 2:
        return np.zeros((0, 2), int)
    ms = matcher.knnMatch(d1, d2, k=2)
    return np.array([(m.queryIdx, m.trainIdx) for m, n in (p for p in ms if len(p) == 2)
                     if m.distance < ratio * n.distance], int).reshape(-1, 2)


def lift(px, depth, alpha, viewmat, K):
    """Render pixels -> world points using expected depth; drop unreliable (edge/translucent) pixels."""
    d = depth.cpu().numpy()
    a = alpha.cpu().numpy()
    h, w = d.shape
    u = np.clip(np.round(px[:, 0]).astype(int), 2, w - 3)
    v = np.clip(np.round(px[:, 1]).astype(int), 2, h - 3)
    ok = a[v, u] > 0.995
    # local depth discontinuity check
    win = np.stack([d[v + dy, u + dx] for dy in (-2, 0, 2) for dx in (-2, 0, 2)], 1)
    ok &= (win.max(1) - win.min(1)) < 0.02
    z = d[v, u]
    cam = np.stack([(px[:, 0] - K[0, 2]) / K[0, 0] * z, (px[:, 1] - K[1, 2]) / K[1, 1] * z, z], 1)
    R, t = viewmat[:3, :3], viewmat[:3, 3]
    world = (cam - t) @ R
    return world.astype(np.float32), ok


def coarse(cam, splats, center):
    img, m = real_image(cam, CAL_FRAMES[0])
    small = cv2.resize(img, (IMG_W // 2, IMG_H // 2), interpolation=cv2.INTER_AREA)
    msk = cv2.resize(m.astype(np.uint8), (IMG_W // 2, IMG_H // 2)) > 0
    pr, dr = detect(small, msk)
    Kv = np.array([[1400.0, 0, 612], [0, 1400.0, 512], [0, 0, 1]])
    cands = []
    for el in (0, 25, 50):
        for az in range(0, 360, 15):
            a, e = np.radians(az), np.radians(el)
            eye = center + 3.5 * np.array([np.sin(a) * np.cos(e), -np.sin(e), np.cos(a) * np.cos(e)])
            V = look_at(eye, center, UP)
            rgb, dep, al = render(splats, V, Kv, 1224, 1024)
            pv, dv = detect(to_u8(rgb))
            mm = match(dr, dv)
            if len(mm) < 12:
                continue
            _, inl = cv2.findFundamentalMat(pr[mm[:, 0]], pv[mm[:, 1]], cv2.FM_RANSAC, 3.0, 0.999)
            if inl is None:
                continue
            inl = inl.ravel().astype(bool)
            cands.append((inl.sum(), az, el, V, dep, al, mm[inl], pv))
    cands.sort(key=lambda c: -c[0])
    p2d, p3d = [], []
    for n, az, el, V, dep, al, mm, pv in cands[:3]:
        w3, ok = lift(pv[mm[:, 1]], dep, al, V, Kv)
        p2d.append(pr[mm[ok, 0]] * 2.0)  # back to full resolution
        p3d.append(w3[ok])
    p2d, p3d = np.concatenate(p2d), np.concatenate(p3d)
    best = None
    for f in np.geomspace(1500, 12000, 40):
        K = np.array([[f, 0, IMG_W / 2], [0, f, IMG_H / 2], [0, 0, 1]])
        ok, rv, tv, inl = cv2.solvePnPRansac(p3d, p2d, K, None, reprojectionError=12.0, iterationsCount=2000,
                                             flags=cv2.SOLVEPNP_EPNP)
        if ok and inl is not None and (best is None or len(inl) > best[0]):
            best = (len(inl), f, rv, tv)
    print(f"cam{cam:03d} coarse: best views {[(c[1], c[2], int(c[0])) for c in cands[:3]]}, "
          f"f={best[1]:.0f}, inliers {best[0]}/{len(p2d)}", flush=True)
    K = np.array([[best[1], 0, IMG_W / 2], [0, best[1], IMG_H / 2], [0, 0, 1]])
    return K, np.zeros(5), best[2], best[3]


def viewmat_of(rv, tv):
    V = np.eye(4)
    V[:3, :3] = cv2.Rodrigues(rv)[0]
    V[:3, 3] = tv.ravel()
    return V


def collect(cam, K, rv, tv, splats_by_idx, scale=0.5):
    """Render each calibration timestamp from the current estimate and gather 2D-3D pairs."""
    V = viewmat_of(rv, tv)
    w, h = int(IMG_W * scale), int(IMG_H * scale)
    Ks = K.copy()
    Ks[:2] *= scale
    p2d, p3d = [], []
    for idx, sp in splats_by_idx.items():
        img, m = real_image(cam, idx)
        img = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)
        m = cv2.resize(m.astype(np.uint8), (w, h)) > 0
        pr, dr = detect(img, m)
        rgb, dep, al = render(sp, V, Ks, w, h)
        pv, dv = detect(to_u8(rgb))
        mm = match(dr, dv, 0.85)
        if len(mm) < 8:
            continue
        # pose is close: matched points must be near each other
        near = np.linalg.norm(pr[mm[:, 0]] - pv[mm[:, 1]], axis=1) < 60 * scale / 0.5
        mm = mm[near]
        w3, ok = lift(pv[mm[:, 1]], dep, al, V, Ks)
        p2d.append(pr[mm[ok, 0]] / scale)
        p3d.append(w3[ok])
    return np.concatenate(p2d).astype(np.float32), np.concatenate(p3d).astype(np.float32)


def refine(p2d, p3d, K, dist, rv, tv, use_dist):
    flags = cv2.CALIB_USE_INTRINSIC_GUESS | cv2.CALIB_FIX_K3 | cv2.CALIB_FIX_ASPECT_RATIO
    if not use_dist:
        flags |= cv2.CALIB_FIX_K1 | cv2.CALIB_FIX_K2 | cv2.CALIB_ZERO_TANGENT_DIST | cv2.CALIB_FIX_PRINCIPAL_POINT
    else:  # subject covers only the image centre: k2 / tangential are not observable
        flags |= cv2.CALIB_ZERO_TANGENT_DIST | cv2.CALIB_FIX_K2
    keep = np.ones(len(p2d), bool)
    for thr in (20.0, 8.0, 4.0, 3.0):
        _, K, dist, rvs, tvs = cv2.calibrateCamera([p3d[keep]], [p2d[keep]], (IMG_W, IMG_H), K.copy(),
                                                   dist.copy(), flags=flags)
        rv, tv = rvs[0], tvs[0]
        proj = cv2.projectPoints(p3d, rv, tv, K, dist)[0].reshape(-1, 2)
        err = np.linalg.norm(proj - p2d, axis=1)
        keep = err < thr
    return K, dist.ravel(), rv, tv, err[keep].mean(), keep.sum(), len(p2d)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cams", default=",".join(str(i) for i in range(1, 33)))
    ap.add_argument("--frames", default="", help="mesh frames (1-based); default: 8 evenly spaced with texture")
    args = ap.parse_args()
    cams = [int(c) for c in args.cams.split(",")]
    if args.frames:
        CAL_FRAMES[:] = [int(i) for i in args.frames.split(",")]
    else:
        textured = [f for f in range(1, NUM_FRAMES + 1) if has_tex(f)]
        k = min(8, len(textured))
        CAL_FRAMES[:] = [textured[int(round(i * (len(textured) - 1) / max(k - 1, 1)))] for i in range(k)]
    print("calibration frames", CAL_FRAMES, flush=True)
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "grab_frames.py")]
                   + [str(f) for f in CAL_FRAMES], check=True, stdout=subprocess.DEVNULL)
    os.makedirs(OUT, exist_ok=True)
    out_json = os.path.join(OUT, "cameras.json")
    result = json.load(open(out_json)) if os.path.exists(out_json) else {}

    torch.set_grad_enabled(False)
    splats_by_idx = {f: Splats.from_mesh(f, n_points=1_500_000) for f in CAL_FRAMES}
    first = splats_by_idx[CAL_FRAMES[0]]
    center = first.means.mean(0).cpu().numpy()

    for cam in cams:
        K, dist, rv, tv = coarse(cam, first, center)
        for it, (scale, use_dist) in enumerate([(0.5, False), (0.5, True), (1.0, True)]):
            p2d, p3d = collect(cam, K, rv, tv, splats_by_idx, scale)
            K, dist, rv, tv, err, nin, ntot = refine(p2d, p3d, K, dist, rv, tv, use_dist)
            print(f"cam{cam:03d} iter{it}: f={K[0, 0]:.1f} c=({K[0, 2]:.1f},{K[1, 2]:.1f}) "
                  f"k={dist[:2].round(4)} reproj {err:.2f}px ({nin}/{ntot})", flush=True)
        V = viewmat_of(rv, tv)
        result[f"{cam:03d}"] = dict(K=K.tolist(), dist=dist.tolist(), w2c=V.tolist(), width=IMG_W,
                                    height=IMG_H, reproj_px=float(err), n_inliers=int(nin))
        json.dump(result, open(out_json, "w"), indent=1)


if __name__ == "__main__":
    main()
