"""Check whether a camera set fits this sequence (silhouette IoU of the mesh vs chroma key) and find the
per-camera video offset (video idx = mesh frame - 1 + offset).

usage: SEQ=<name> python check_calib.py --cameras <cameras.json> [--frames 1,500,..] [--offsets -3:3]
       [--write-sync]   store the best per-camera offsets in <DATA>/sync.json
"""
import argparse
import json
import os
import sys

import av
import cv2
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(__file__))
from common import BAR_Y, DATA, IMG_H, IMG_W, Splats, chroma_mask, mesh_frames, render, video_path  # noqa: E402

S = 0.25
w, h = int(IMG_W * S), int(IMG_H * S)
lim = int(BAR_Y * S) - 2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cameras", required=True)
    ap.add_argument("--frames", default="")
    ap.add_argument("--offsets", default="-3:3")
    ap.add_argument("--write-sync", nargs="?", const="per-camera", default=None,
                    help="store offsets in sync.json: 'per-camera' (default) or 'global'")
    ap.add_argument("--cams", default="", help="only these cameras, e.g. 003,004")
    args = ap.parse_args()
    cams = json.load(open(args.cameras))
    if args.cams:
        cams = {k: v for k, v in cams.items() if k in args.cams.split(",")}
    have = mesh_frames()
    frames = [int(f) for f in args.frames.split(",")] if args.frames else \
        sorted({have[int(round(i * (len(have) - 1) / 3))] for i in range(4)})
    o0, o1 = (int(x) for x in args.offsets.split(":"))
    offsets = list(range(o0, o1 + 1))
    torch.set_grad_enabled(False)

    # rendered silhouettes per (frame, cam)
    sil = {}
    for f in frames:
        sp = Splats.from_mesh(f, n_points=400_000)
        sp.colors = torch.full_like(sp.colors, 0.5)
        for name, c in cams.items():
            K = np.array(c["K"])
            Ks = K.copy()
            Ks[:2] *= S
            _, _, al = render(sp, np.array(c["w2c"]), Ks, w, h)
            sil[f, name] = al.cpu().numpy()[:lim] > 0.5

    result = {}
    for name, c in sorted(cams.items()):
        K, dist = np.array(c["K"]), np.array(c["dist"])
        want = {f - 1 + o: (f, o) for f in frames for o in offsets if f - 1 + o >= 0}
        need = sorted(want)
        ious = {o: [] for o in offsets}
        with av.open(video_path(name)) as cont:
            s = cont.streams.video[0]
            s.thread_type = "AUTO"
            fps = float(s.average_rate)
            to_idx = lambda fr: int(round(float(fr.pts * s.time_base) * fps))  # noqa: E731
            groups, cur = [], [need[0]]
            for i in need[1:]:  # decode contiguous windows, seeking between them
                if i - cur[-1] > 60:
                    groups.append(cur)
                    cur = [i]
                else:
                    cur.append(i)
            groups.append(cur)
            for g in groups:
                cont.seek(int(max(g[0] - 1, 0) / fps / s.time_base), stream=s, backward=True)
                for fr in cont.decode(s):
                    i = to_idx(fr)
                    if i > g[-1]:
                        break
                    if i in want:
                        f, o = want[i]
                        img = cv2.undistort(fr.to_ndarray(format="rgb24"), K, dist)
                        m = cv2.resize(chroma_mask(img).astype(np.uint8), (w, h)) > 0
                        r = sil[f, name]
                        m = m[:lim]
                        ious[o].append((r & m).sum() / max((r | m).sum(), 1))
        mean = {o: float(np.mean(v)) if v else 0.0 for o, v in ious.items()}
        best = max(mean, key=mean.get)
        result[name] = dict(best_offset=best, iou=round(mean[best], 4), iou_at_0=round(mean.get(0, 0), 4),
                            per_offset=mean)
        print(name, {k: v for k, v in result[name].items() if k != "per_offset"}, flush=True)
    ious = [r["iou"] for r in result.values()]
    print(f"mean IoU (best offsets) {np.mean(ious):.4f}  min {min(ious):.4f}")
    print("offsets", {k: v["best_offset"] for k, v in result.items()})
    # one offset shared by all cameras (robust when the performer barely moves)
    glob_mean = {o: float(np.mean([r["per_offset"][o] for r in result.values() if r["per_offset"][o] > 0]))
                 for o in offsets if any(r["per_offset"][o] > 0 for r in result.values())}
    g = max(glob_mean, key=glob_mean.get)
    print(f"global best offset {g}: mean IoU {glob_mean[g]:.4f} (offset 0: {glob_mean.get(0, 0):.4f})")
    if args.write_sync:
        sync = {k: (g if args.write_sync == "global" else v["best_offset"]) for k, v in result.items()}
        json.dump(sync, open(os.path.join(DATA, "sync.json"), "w"))
        print("wrote sync.json", sync)


if __name__ == "__main__":
    main()
