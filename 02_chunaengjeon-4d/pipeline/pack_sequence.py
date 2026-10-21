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
from player import read_ply  # noqa: E402


def pack(ply, out):
    d = read_ply(ply)
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
    hdr = b"GSQ1" + struct.pack("<I6f2f", len(p), *pmin, *pmax, smin, smax)
    with open(out + ".tmp", "wb") as fh:
        for a in (hdr, qp, qs, qr, qc):
            fh.write(a.tobytes() if isinstance(a, np.ndarray) else a)
    os.replace(out + ".tmp", out)
    return len(p), p.mean(0)


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
