"""Per-frame Gaussian Splatting optimisation for one capture sequence (SEQ environment variable).

For every mesh frame f: gaussians are initialised as surfels on the textured 4DViews mesh, then
optimised photometrically against the 32 calibrated (undistorted) camera images of video frame f-1,
with a chroma-key alpha loss so only the performer is represented. Output: one standard 3DGS PLY
per frame (SH degree 0).

usage: python train_frames.py --start 1 --end 3594 --out <dir> [--iters 400 --points 200000 --scale 0.5]
"""
import argparse
import json
import os
import queue
import sys
import threading
import time

import av
import cv2
import numpy as np
import torch
import torch.nn.functional as F
from gsplat import rasterization

sys.path.insert(0, os.path.dirname(__file__))
from common import BAR_Y, DATA, IMG_H, IMG_W, NUM_FRAMES, chroma_mask, load_mesh, load_tex, normals_to_quats, \
    sample_surface, video_offsets, video_path  # noqa: E402

SH_C0 = 0.28209479177387814


# ---------------------------------------------------------------- cameras / video
def load_cameras(scale):
    cams = json.load(open(os.path.join(DATA, "calib", "cameras.json")))
    out = []
    w, h = int(round(IMG_W * scale)), int(round(IMG_H * scale))
    for name in sorted(cams):
        c = cams[name]
        K, dist = np.array(c["K"]), np.array(c["dist"])
        # undistort to a pinhole camera with the same K, then rescale
        m1, m2 = cv2.initUndistortRectifyMap(K, dist, None, K, (IMG_W, IMG_H), cv2.CV_16SC2)
        Ks = K.copy()
        Ks[:2] *= scale
        out.append(dict(name=name, K=Ks, w2c=np.array(c["w2c"]), maps=(m1, m2), w=w, h=h))
    return out


class FrameReader:
    """Decodes all 32 videos in lock-step in a background thread; yields (idx, [32 x (rgb, mask)])."""

    def __init__(self, cams, start_idx, end_idx, scale, prefetch=3):
        self.cams, self.scale = cams, scale
        self.start, self.end = start_idx, end_idx
        self.q = queue.Queue(maxsize=prefetch)
        threading.Thread(target=self._run, daemon=True).start()

    def _prep(self, cam, arr):
        und = cv2.remap(arr, cam["maps"][0], cam["maps"][1], cv2.INTER_LINEAR)
        m = chroma_mask(und)
        valid = np.ones(und.shape[:2], np.uint8)
        valid[BAR_Y:] = 0
        valid = cv2.remap(valid, cam["maps"][0], cam["maps"][1], cv2.INTER_NEAREST)
        valid[BAR_Y - 8:] = 0
        if self.scale != 1:
            sz = (cam["w"], cam["h"])
            und = cv2.resize(und, sz, interpolation=cv2.INTER_AREA)
            m = cv2.resize(m.astype(np.float32), sz, interpolation=cv2.INTER_AREA)
            valid = cv2.resize(valid, sz, interpolation=cv2.INTER_NEAREST)
        return und, m.astype(np.float32), valid.astype(bool)

    def _run(self):
        conts = []
        offs = video_offsets()
        for cam in self.cams:
            start = self.start + offs.get(cam["name"], 0)  # this camera's video index for the first frame
            c = av.open(video_path(cam["name"]))
            s = c.streams.video[0]
            s.thread_type = "AUTO"
            fps = float(s.average_rate)
            to_idx = lambda fr, s=s, fps=fps: int(round(float(fr.pts * s.time_base) * fps))
            if start > 0:
                c.seek(int(start / fps / s.time_base), stream=s, backward=True, any_frame=False)
            gen = c.decode(s)
            while True:  # skip to the start frame
                fr = next(gen)
                if to_idx(fr) >= start:
                    break
            assert to_idx(fr) == start, (cam["name"], to_idx(fr))
            conts.append((fr, gen))
        idx = self.start - 1
        from concurrent.futures import ThreadPoolExecutor
        pool = ThreadPoolExecutor(8)
        while idx < self.end:
            if idx == self.start - 1:
                frames = [fr for fr, _ in conts]
            else:
                try:
                    frames = [next(g) for _, g in conts]
                except StopIteration:  # some camera's video ended
                    break
            idx += 1
            arrs = [f.to_ndarray(format="rgb24") for f in frames]
            data = list(pool.map(self._prep, self.cams, arrs))
            self.q.put((idx, data))
        self.q.put(None)

    def __iter__(self):
        while True:
            item = self.q.get()
            if item is None:
                return
            yield item


# ---------------------------------------------------------------- losses
def _gauss_win(size=11, sigma=1.5, device="cuda"):
    g = torch.exp(-(torch.arange(size, device=device) - size // 2) ** 2 / (2 * sigma ** 2))
    g = g / g.sum()
    return (g[:, None] * g[None, :]).expand(3, 1, size, size).contiguous()


WIN = None


def ssim(a, b):
    """a, b: (1,3,H,W)."""
    global WIN
    if WIN is None:
        WIN = _gauss_win()
    mu_a = F.conv2d(a, WIN, padding=5, groups=3)
    mu_b = F.conv2d(b, WIN, padding=5, groups=3)
    s_a = F.conv2d(a * a, WIN, padding=5, groups=3) - mu_a ** 2
    s_b = F.conv2d(b * b, WIN, padding=5, groups=3) - mu_b ** 2
    s_ab = F.conv2d(a * b, WIN, padding=5, groups=3) - mu_a * mu_b
    c1, c2 = 0.01 ** 2, 0.03 ** 2
    return ((2 * mu_a * mu_b + c1) * (2 * s_ab + c2)) / ((mu_a ** 2 + mu_b ** 2 + c1) * (s_a + s_b + c2))


# ---------------------------------------------------------------- per-frame optimisation
def init_params(frame, n_points):
    v, f, uv = load_mesh(frame)
    tex = load_tex(frame)
    p, col, nrm, _, sp = sample_surface(v, f, uv, tex, n_points, seed=frame)
    sc = np.log(np.tile(np.array([[sp, sp, sp * 0.15]], np.float32), (len(p), 1)) * 0.75)
    col = np.clip(col, 0.02, 0.98)
    t = lambda x: torch.nn.Parameter(torch.as_tensor(np.asarray(x, np.float32), device="cuda"))
    return dict(means=t(p), quats=t(normals_to_quats(nrm)), scales=t(sc),
                opac=t(np.full(len(p), 3.0)), colors=t(np.log(col / (1 - col)))), sp


def train_frame(frame, views, cams_t, args):
    params, spacing = init_params(frame, args.points)
    lrs = dict(means=spacing * 0.02, quats=1e-3, scales=5e-3, opac=2e-2, colors=1e-2)
    opt = torch.optim.Adam([dict(params=[params[k]], lr=lrs[k], name=k) for k in params], eps=1e-15)
    n = len(views)
    order = torch.randperm(n * ((args.iters + n - 1) // n)) % n
    loss = torch.zeros(())
    # The chroma key keeps anything non-green, e.g. a light panel touching the performer's silhouette.
    # Restrict each mask to a dilated silhouette of the mesh itself (the mesh came from these silhouettes).
    with torch.no_grad():
        clean = []
        for (img, msk, valid), (vm, K, w, h) in zip(views, cams_t):
            _, a0, _ = rasterization(params["means"], F.normalize(params["quats"], dim=-1),
                                     torch.exp(params["scales"]), torch.sigmoid(params["opac"]),
                                     torch.sigmoid(params["colors"]), vm[None], K[None], w, h)
            near = F.max_pool2d((a0[0, ..., 0] > 0.5).float()[None, None], 25, stride=1, padding=12)[0, 0]
            clean.append((img, msk * near, valid))
        views = clean
    for it in range(args.iters):
        ci = int(order[it])
        img, msk, valid = views[ci]
        vm, K, w, h = cams_t[ci]
        rgb, alpha, _ = rasterization(params["means"], F.normalize(params["quats"], dim=-1),
                                      torch.exp(params["scales"]), torch.sigmoid(params["opac"]),
                                      torch.sigmoid(params["colors"]), vm[None], K[None], w, h)
        rgb, alpha = rgb[0], alpha[0, ..., 0]
        target = img * msk[..., None]  # performer over black
        vm_ = valid[..., None]
        l1 = ((rgb - target).abs() * vm_).mean()
        ss = 1 - (ssim(rgb.permute(2, 0, 1)[None], target.permute(2, 0, 1)[None])[0].permute(1, 2, 0) * vm_).mean()
        la = ((alpha - msk).abs() * valid).mean()
        loss = 0.8 * l1 + 0.2 * ss + 0.3 * la
        loss.backward()
        opt.step()
        opt.zero_grad(set_to_none=True)
    with torch.no_grad():
        keep = torch.sigmoid(params["opac"]) > 0.03
        out = {k: v.detach()[keep] for k, v in params.items()}
    return out, 0.0, float(loss)


@torch.no_grad()
def evaluate(g, views, cams_t, jpg_path, show=(0, 8, 16, 24)):
    """Mean masked PSNR over all views; saves GT | render | mesh-free diff for a few cameras."""
    psnrs, rows = [], []
    for ci, ((img, msk, valid), (vm, K, w, h)) in enumerate(zip(views, cams_t)):
        rgb, _, _ = rasterization(g["means"], F.normalize(g["quats"], dim=-1), torch.exp(g["scales"]),
                                  torch.sigmoid(g["opac"]), torch.sigmoid(g["colors"]), vm[None], K[None], w, h)
        target = img * msk[..., None]
        mse = (((rgb[0] - target) ** 2) * valid[..., None]).sum() / (valid.sum() * 3)
        psnrs.append(float(-10 * torch.log10(mse)))
        if ci in show:
            rows.append(torch.cat([target, rgb[0].clamp(0, 1)], 1))
    im = (torch.cat(rows, 0).cpu().numpy() * 255).astype(np.uint8)
    im = cv2.resize(im, (im.shape[1] // 2, im.shape[0] // 2), interpolation=cv2.INTER_AREA)
    cv2.imwrite(jpg_path, im[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 90])
    return float(np.mean(psnrs))


def save_ply(path, g):
    """Standard 3DGS PLY (INRIA layout, SH degree 0) with values in activation-inverse form."""
    xyz = g["means"].cpu().numpy()
    n = len(xyz)
    rgb = torch.sigmoid(g["colors"]).cpu().numpy()
    f_dc = (rgb - 0.5) / SH_C0
    q = F.normalize(g["quats"], dim=-1).cpu().numpy()
    fields = [xyz, np.zeros((n, 3), np.float32), f_dc, g["opac"].cpu().numpy()[:, None],
              g["scales"].cpu().numpy(), q]
    names = ["x", "y", "z", "nx", "ny", "nz", "f_dc_0", "f_dc_1", "f_dc_2", "opacity",
             "scale_0", "scale_1", "scale_2", "rot_0", "rot_1", "rot_2", "rot_3"]
    data = np.concatenate(fields, 1).astype(np.float32)
    header = "ply\nformat binary_little_endian 1.0\nelement vertex %d\n" % n + "".join(
        f"property float {k}\n" for k in names) + "end_header\n"
    with open(path + ".tmp", "wb") as fh:
        fh.write(header.encode())
        fh.write(data.tobytes())
    os.replace(path + ".tmp", path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int, default=NUM_FRAMES)
    ap.add_argument("--out", default=os.path.join(DATA, "gs"))
    ap.add_argument("--step", type=int, default=1, help="train every n-th frame (lower frame rate)")
    ap.add_argument("--iters", type=int, default=400)
    ap.add_argument("--points", type=int, default=200_000)
    ap.add_argument("--scale", type=float, default=0.5)
    ap.add_argument("--preview", action="store_true", help="also save a render-vs-GT jpg per frame")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    cams = load_cameras(args.scale)
    cams_t = [(torch.tensor(c["w2c"], dtype=torch.float32, device="cuda"),
               torch.tensor(c["K"], dtype=torch.float32, device="cuda"), c["w"], c["h"]) for c in cams]
    todo = [f for f in range(args.start, args.end + 1, args.step)
            if not os.path.exists(os.path.join(args.out, f"frame_{f:05d}.ply"))
            and os.path.exists(os.path.join(DATA, "mesh", f"mesh.{f:05d}.npz"))]  # damaged mesh samples are skipped
    if not todo:
        return
    reader = FrameReader(cams, todo[0] - 1, todo[-1] - 1, args.scale)
    log = open(os.path.join(args.out, "train_log.txt"), "a")
    for idx, data in reader:
        frame = idx + 1
        if frame not in todo:
            continue
        t0 = time.time()
        if len(load_mesh(frame)[1]) < 100:  # damaged Alembic sample: nothing to train
            msg = f"frame {frame} skipped: empty mesh"
            print(msg, flush=True)
            log.write(msg + "\n")
            continue
        views = [(torch.from_numpy(i).cuda().float() / 255, torch.from_numpy(m).cuda(),
                  torch.from_numpy(v).cuda()) for i, m, v in data]
        g, psnr, loss = train_frame(frame, views, cams_t, args)
        save_ply(os.path.join(args.out, f"frame_{frame:05d}.ply"), g)
        if args.preview:
            psnr = evaluate(g, views, cams_t, os.path.join(args.out, f"preview_{frame:05d}.jpg"))
        msg = f"frame {frame} gauss {len(g['means'])} psnr {psnr:.2f} loss {loss:.4f} {time.time() - t0:.1f}s"
        print(msg, flush=True)
        log.write(msg + "\n")
        log.flush()


if __name__ == "__main__":
    main()
