"""Pack per-frame 3DGS PLYs into a compact streaming format for the web player.

.gsq frame layout (little endian):
  char[4] 'GSQ1' | uint32 n | float32 pmin[3] | float32 pmax[3] | float32 smin | float32 smax   (40 bytes)
  uint16 pos[n*3]   position quantised in [pmin, pmax]
  uint8  scl[n*3]   log-scale quantised in [smin, smax]
  int8   rot[n*4]   unit quaternion (w,x,y,z) * 127, w >= 0
  uint8  rgba[n*4]  colour + opacity
usage: python pack_sequence.py <ply_dir> <out_dir>
"""
import glob
import json
import os
import struct
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from ply_io import read_ply  # noqa: E402


HEADER = struct.Struct("<4sI6f2f")  # 40 bytes
BYTES_PER_SPLAT = 6 + 3 + 4 + 4


def encode(d):
    """Quantise one frame (a read_ply dict) into .gsq bytes."""
    p = d["means"].astype(np.float32)
    pmin, pmax = p.min(0), p.max(0)
    qp = np.round((p - pmin) / np.maximum(pmax - pmin, 1e-9) * 65535).astype(np.uint16)
    ls = np.log(np.maximum(d["scales"], 1e-12))
    smin, smax = float(ls.min()), float(ls.max())
    qs = np.round((ls - smin) / max(smax - smin, 1e-9) * 255).astype(np.uint8)
    q = d["quats"] / np.linalg.norm(d["quats"], axis=1, keepdims=True)
    q *= np.where(q[:, :1] < 0, -1, 1)
    qr = np.round(q * 127).astype(np.int8)
    rgba = np.concatenate([d["colors"], d["opac"][:, None]], 1)
    qc = np.round(np.clip(rgba, 0, 1) * 255).astype(np.uint8)
    hdr = HEADER.pack(b"GSQ1", len(p), *pmin, *pmax, smin, smax)
    return b"".join([hdr] + [a.astype(a.dtype.newbyteorder("<")).tobytes() for a in (qp, qs, qr, qc)])


def decode(buf):
    """Reference decoder for .gsq bytes (mirrors the browser decoder in platform/js/splat-player.js).

    Trailing bytes (PNG padding) are ignored. Returns the same keys as read_ply."""
    magic, n, *rest = HEADER.unpack_from(buf, 0)
    if magic != b"GSQ1":
        raise ValueError("not a GSQ1 frame")
    if len(buf) < HEADER.size + BYTES_PER_SPLAT * n:
        raise ValueError("truncated GSQ1 frame")
    pmin, pmax, (smin, smax) = np.array(rest[:3]), np.array(rest[3:6]), rest[6:]
    o = HEADER.size
    qp = np.frombuffer(buf, "<u2", n * 3, o).reshape(n, 3)
    o += n * 6
    qs = np.frombuffer(buf, np.uint8, n * 3, o).reshape(n, 3)
    o += n * 3
    qr = np.frombuffer(buf, np.int8, n * 4, o).reshape(n, 4)
    o += n * 4
    qc = np.frombuffer(buf, np.uint8, n * 4, o).reshape(n, 4)
    means = pmin + qp / 65535.0 * (pmax - pmin)
    scales = np.exp(smin + qs / 255.0 * (smax - smin))
    rgba = qc / 255.0
    return dict(means=means, scales=scales, quats=qr / 127.0, colors=rgba[:, :3], opac=rgba[:, 3])


def pack(ply, out):
    d = read_ply(ply)
    with open(out + ".tmp", "wb") as fh:
        fh.write(encode(d))
    os.replace(out + ".tmp", out)
    return len(d["means"]), d["means"].astype(np.float32).mean(0)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    files = sorted(glob.glob(os.path.join(src, "frame_*.ply")))
    centers, names = [], []
    for i, f in enumerate(files):
        name = os.path.basename(f).replace(".ply", ".gsq")
        out = os.path.join(dst, name)
        if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(f):
            n, c = pack(f, out)
            centers.append(c.tolist())
        names.append(name)
        if i % 200 == 0:
            print(i, len(files), flush=True)
    if not centers and files:
        centers.append(read_ply(files[0])["means"].mean(0))
    c = np.mean(centers, 0).tolist() if centers else [0, -0.9, 0]
    json.dump(dict(fps=30, frames=names, center=c, up=[0, -1, 0]), open(os.path.join(dst, "manifest.json"), "w"))


if __name__ == "__main__":
    main()
