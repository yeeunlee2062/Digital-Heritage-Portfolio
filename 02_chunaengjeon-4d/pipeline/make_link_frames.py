"""Encode .gsq frames losslessly into PNG pixels (3 bytes per pixel) for publishing as a web link, and
write the manifest the player page reads.
usage: python make_link_frames.py <dir with gsq/ and index.html> <fps> <note>"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image

root, fps, note = sys.argv[1], int(sys.argv[2]), sys.argv[3]
os.makedirs(os.path.join(root, "p"), exist_ok=True)
names, total = [], 0
for f in sorted(glob.glob(os.path.join(root, "gsq", "*.gsq"))):
    b = np.frombuffer(open(f, "rb").read(), np.uint8)
    w = 1024
    h = -(-(-(-len(b) // 3)) // w)
    a = np.zeros(w * h * 3, np.uint8)
    a[:len(b)] = b
    name = os.path.basename(f).replace(".gsq", ".png")
    out = os.path.join(root, "p", name)
    Image.fromarray(a.reshape(h, w, 3), "RGB").save(out, optimize=True)
    assert (np.asarray(Image.open(out)).ravel()[:len(b)] == b).all(), out
    names.append("p/" + name)
    total += os.path.getsize(out)
m = json.load(open(os.path.join(root, "gsq", "manifest.json")))
m.update(frames=names, fps=fps, note=note)
json.dump(m, open(os.path.join(root, "manifest.json"), "w"))
print(len(names), "frames,", round(total / 2 ** 20, 1), "MB")
