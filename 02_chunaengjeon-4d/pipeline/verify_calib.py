"""Check registration: silhouette IoU (mesh render vs chroma key) per camera, overlay sheet,
and mesh<->video time-offset check.
usage: python verify_calib.py <video_idx> [--offsets]"""
import json
import os
import sys

import cv2
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from common import BAR_Y, DATA, IMG_H, IMG_W, Splats, chroma_mask, render  # noqa: E402

torch.set_grad_enabled(False)
idx = int(sys.argv[1])
cams = json.load(open(os.path.join(DATA, "calib", "cameras.json")))
S = 0.5
w, h = int(IMG_W * S), int(IMG_H * S)


def iou_for(sp, name, c, img):
    K, dist = np.array(c["K"]), np.array(c["dist"])
    und = cv2.undistort(img, K, dist)
    m = chroma_mask(und)
    m = cv2.resize(m.astype(np.uint8), (w, h)) > 0
    Ks = K.copy()
    Ks[:2] *= S
    rgb, _, al = render(sp, np.array(c["w2c"]), Ks, w, h)
    r = al.cpu().numpy() > 0.5
    lim = int(BAR_Y * S) - 4
    inter, uni = (r & m)[:lim].sum(), (r | m)[:lim].sum()
    return inter / max(uni, 1), und, r, m, rgb


if "--offsets" in sys.argv:
    # which mesh frame best explains video frame idx?
    imgs = {n: np.asarray(Image.open(os.path.join(DATA, "frames", f"cam{n}_f{idx:05d}.png")).convert("RGB"))
            for n in list(cams)[::4]}
    for off in range(-3, 4):
        sp = Splats.from_mesh(idx + 1 + off, n_points=600_000)
        ious = [iou_for(sp, n, cams[n], imgs[n])[0] for n in imgs]
        print(f"mesh frame {idx + 1 + off} (offset {off:+d}): mean IoU {np.mean(ious):.4f}")
    sys.exit()

sp = Splats.from_mesh(idx + 1, n_points=1_500_000)
tiles, ious = [], {}
for n, c in sorted(cams.items()):
    img = np.asarray(Image.open(os.path.join(DATA, "frames", f"cam{n}_f{idx:05d}.png")).convert("RGB"))
    iou, und, r, m, rgb = iou_for(sp, n, c, img)
    ious[n] = round(float(iou), 4)
    base = cv2.resize(und, (w, h)).astype(np.float32)
    # overlay: rendered mesh edges in magenta, chroma-key edges in cyan
    er = cv2.morphologyEx(r.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    em = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    base[em] = [0, 255, 255]
    base[er] = [255, 0, 255]
    tile = cv2.resize(base.astype(np.uint8), (306, 256))
    cv2.putText(tile, f"{n} IoU {iou:.3f}", (5, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
    tiles.append(tile)
sheet = np.concatenate([np.concatenate(tiles[i:i + 8], 1) for i in range(0, 32, 8)], 0)
Image.fromarray(sheet).save(os.path.join(DATA, "calib", f"verify_f{idx:05d}.jpg"), quality=88)
print(json.dumps(ious))
print("mean IoU", np.mean(list(ious.values())), "min", min(ious.values()))
