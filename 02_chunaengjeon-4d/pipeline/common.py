"""Shared helpers: mesh/texture loading, mesh -> gaussian sampling, gsplat rendering, chroma key."""
import glob
import io
import json
import os
import re
import zipfile

import numpy as np
import torch
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPTURE_ROOT = r"D:\세종대학교"
# Which capture to work on: set the SEQ environment variable (default H_fast, whose work dir is data/).
SEQ = os.environ.get("SEQ", "H_fast")
DATA = os.path.join(ROOT, "data") if SEQ == "H_fast" else os.path.join(ROOT, "seq", SEQ)
SEQ_DIR = os.path.join(CAPTURE_ROOT, SEQ)
IMG_W, IMG_H = 2448, 2048
BAR_Y = 1986  # burned-in frame-counter bar; rows >= BAR_Y are invalid
Image.MAX_IMAGE_PIXELS = None


def mesh_frames():
    """Frame numbers that have an extracted mesh (damaged Alembic samples are absent)."""
    d = os.path.join(DATA, "mesh")
    if not os.path.isdir(d):
        return []
    return sorted(int(f[5:10]) for f in os.listdir(d) if f.startswith("mesh.") and f.endswith(".npz"))


NUM_FRAMES = max(mesh_frames(), default=3594)  # last mesh frame; frame f (1-based) <-> video f-1 (+ offset)


def video_path(cam):
    """cam: '001'..'032'. Local extracted copies (seq/<name>/videos) win over the capture drive."""
    for d in (os.path.join(DATA, "videos"), os.path.join(SEQ_DIR, "mp4"), os.path.join(SEQ_DIR, "mp4_1")):
        hits = glob.glob(os.path.join(d, f"*cam-{cam}.mp4"))
        if hits:
            return hits[0]
    raise FileNotFoundError(f"{SEQ}: no video for cam-{cam}")


def video_offsets():
    """Per-camera video index offset (video idx = mesh frame - 1 + offset); data/sync.json, default 0."""
    p = os.path.join(DATA, "sync.json")
    return json.load(open(p)) if os.path.exists(p) else {}


def load_mesh(frame):
    d = np.load(os.path.join(DATA, "mesh", f"mesh.{frame:05d}.npz"))
    return d["verts"], d["faces"], d["uvs"]


_TEX_INDEX = None


def tex_index():
    """frame -> extracted png path, loose png on the capture drive, or (zip, member). Cached in DATA."""
    global _TEX_INDEX
    if _TEX_INDEX is not None:
        return _TEX_INDEX
    cache = os.path.join(DATA, "tex_index.json")
    if os.path.exists(cache):
        _TEX_INDEX = {int(k): v for k, v in json.load(open(cache, encoding="utf-8")).items()}
        return _TEX_INDEX
    idx = {}
    for td in glob.glob(os.path.join(SEQ_DIR, "alembic", "*TEXTURE*")):
        for z in sorted(glob.glob(os.path.join(td, "*.zip"))):
            with zipfile.ZipFile(z) as zf:
                for n in zf.namelist():
                    m = re.search(r"tex\.(\d+)\.png$", n)
                    if m:
                        idx[int(m.group(1))] = [z, n]
        for f in glob.glob(os.path.join(td, "tex.*.png")):
            idx[int(re.search(r"tex\.(\d+)\.png$", f).group(1))] = f
    local = os.path.join(DATA, "tex")
    if os.path.isdir(local):
        for f in glob.glob(os.path.join(local, "tex.*.png")):
            idx[int(re.search(r"tex\.(\d+)\.png$", f).group(1))] = f
    os.makedirs(DATA, exist_ok=True)
    json.dump(idx, open(cache, "w", encoding="utf-8"), ensure_ascii=False)
    _TEX_INDEX = idx
    return idx


def has_tex(frame):
    return frame in tex_index()


def load_tex(frame):
    """Texture atlas of this frame, or None when the export is missing it (UVs differ per frame, so a
    neighbouring frame's atlas would give wrong colours)."""
    src = tex_index().get(frame)
    if src is None:
        return None
    if isinstance(src, str):
        return np.asarray(Image.open(src).convert("RGB"))
    with zipfile.ZipFile(src[0]) as zf:
        return np.asarray(Image.open(io.BytesIO(zf.read(src[1]))).convert("RGB"))


def sample_texture(tex, uv):
    """Bilinear lookup; uv in Blender convention (origin bottom-left). Returns float32 0..1."""
    h, w = tex.shape[:2]
    x = np.clip(uv[:, 0] * w - 0.5, 0, w - 1.001)
    y = np.clip((1.0 - uv[:, 1]) * h - 0.5, 0, h - 1.001)
    x0, y0 = x.astype(np.int64), y.astype(np.int64)
    fx, fy = (x - x0)[:, None], (y - y0)[:, None]
    t = tex.astype(np.float32) / 255.0
    c = (t[y0, x0] * (1 - fx) * (1 - fy) + t[y0, x0 + 1] * fx * (1 - fy)
         + t[y0 + 1, x0] * (1 - fx) * fy + t[y0 + 1, x0 + 1] * fx * fy)
    return c


def sample_surface(verts, faces, uvs, tex, n_points, seed=0):
    """Area-weighted surface sampling. Returns points, colors, normals, face ids, spacing."""
    rng = np.random.default_rng(seed)
    a, b, c = verts[faces[:, 0]], verts[faces[:, 1]], verts[faces[:, 2]]
    cr = np.cross(b - a, c - a)
    area = 0.5 * np.linalg.norm(cr, axis=1)
    nrm = cr / np.maximum(2 * area[:, None], 1e-12)
    fid = rng.choice(len(faces), size=n_points, p=area / area.sum())
    r1, r2 = rng.random(n_points), rng.random(n_points)
    s = np.sqrt(r1)
    w0, w1, w2 = 1 - s, s * (1 - r2), s * r2
    pts = a[fid] * w0[:, None] + b[fid] * w1[:, None] + c[fid] * w2[:, None]
    uv = uvs[fid, 0] * w0[:, None] + uvs[fid, 1] * w1[:, None] + uvs[fid, 2] * w2[:, None]
    col = sample_texture(tex, uv) if tex is not None else np.full((n_points, 3), 0.5, np.float32)
    spacing = np.sqrt(area.sum() / n_points)
    return pts.astype(np.float32), col, nrm[fid].astype(np.float32), fid, spacing


def normals_to_quats(n):
    """Quaternion (wxyz) rotating +z onto n."""
    z = np.array([0, 0, 1.0], np.float32)
    axis = np.cross(np.broadcast_to(z, n.shape), n)
    s = np.linalg.norm(axis, axis=1, keepdims=True)
    cos = n[:, 2:3]
    ang = np.arctan2(s, cos)
    axis = np.where(s > 1e-8, axis / np.maximum(s, 1e-8), np.array([1.0, 0, 0], np.float32))
    q = np.concatenate([np.cos(ang / 2), axis * np.sin(ang / 2)], 1)
    return q.astype(np.float32)


class Splats:
    """Gaussian cloud on GPU built from a textured mesh (surfels)."""

    def __init__(self, means, quats, scales, opacities, colors, device="cuda"):
        t = lambda x: torch.as_tensor(np.asarray(x), dtype=torch.float32, device=device)
        self.means, self.quats, self.scales = t(means), t(quats), t(scales)
        self.opacities, self.colors = t(opacities), t(colors)

    @classmethod
    def from_mesh(cls, frame, n_points=1_000_000, flat=0.15, seed=0):
        v, f, uv = load_mesh(frame)
        tex = load_tex(frame)
        p, col, nrm, _, sp = sample_surface(v, f, uv, tex, n_points, seed)
        sc = np.tile(np.array([[sp, sp, sp * flat]], np.float32), (len(p), 1)) * 0.75
        return cls(p, normals_to_quats(nrm), sc, np.ones(len(p), np.float32), col)


def render(splats, viewmat, K, w, h, bg=0.0, viewmat_grad=False):
    """viewmat: (4,4) world->cam OpenCV; K: (3,3). Returns rgb (h,w,3), depth (h,w), alpha (h,w)."""
    from gsplat import rasterization
    vm = viewmat if torch.is_tensor(viewmat) else torch.as_tensor(viewmat, dtype=torch.float32, device="cuda")
    Kt = K if torch.is_tensor(K) else torch.as_tensor(K, dtype=torch.float32, device="cuda")
    out, alpha, _ = rasterization(splats.means, splats.quats, splats.scales, splats.opacities, splats.colors,
                                  vm[None], Kt[None], w, h, render_mode="RGB+ED")
    a = alpha[0, ..., 0]
    return out[0, ..., :3] + (1 - a[..., None]) * bg, out[0, ..., 3], a


def chroma_mask(img):
    """img uint8 HxWx3 -> bool foreground mask (non-green). Bottom bar is background."""
    import cv2
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    green = (h >= 35) & (h <= 90) & (s >= 60) & (v >= 40)
    fg = ~green
    fg[BAR_Y:] = False
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    if n > 1:  # keep big blobs (the performer); drop the white light panels
        keep = np.zeros(n, bool)
        big = stats[1:, cv2.CC_STAT_AREA]
        white = ((s < 50) & (v > 200)).astype(np.float32)
        white_frac = np.bincount(lab.ravel(), weights=white.ravel(), minlength=n) / np.maximum(
            np.bincount(lab.ravel(), minlength=n), 1)
        keep[1:] = (big >= max(big.max() * 0.05, 2000)) & (white_frac[1:] < 0.6)
        fg = keep[lab]
    return fg.astype(bool)


def look_at(eye, target, up):
    """World->cam (OpenCV) 4x4 for camera at eye looking at target; up = world up direction."""
    eye, target, up = map(lambda x: np.asarray(x, np.float64), (eye, target, up))
    z = target - eye
    z /= np.linalg.norm(z)
    x = np.cross(z, up)  # OpenCV basis: x right, y down, z forward
    x /= np.linalg.norm(x)
    y = np.cross(z, x)
    R = np.stack([x, y, z])
    m = np.eye(4)
    m[:3, :3] = R
    m[:3, 3] = -R @ eye
    return m
