"""Export movement-level 4D excerpts for the platform from a full web sequence (.gsq frames).

For every annotated movement (MVM) of one sequence, takes a short excerpt centred on the middle of its
segment, stores each .gsq frame losslessly in PNG pixels (as scripts/make_link_frames.py does) and
registers the excerpt in media/clips.json, so the platform offers 'Play in 4D' for that movement.

usage (on the machine that holds the 4DGS output):
  python tools/export_movement_clips.py --seq h_slow_high --web "D:/세종대학교/h_slow_high/4DGS_output/web"
  python tools/export_movement_clips.py --seq b_slow --web "D:/세종대학교/b_slow/4DGS_output/web" --seconds 2 --fps 10

--seconds 0 exports one key frame per movement (about 1.2 MB each, 70 frames for both sequences).
Run from the platform folder; frame numbers follow the 4DGS index (1-based, 30 fps) used by the annotations.
"""
import argparse
import json
import os

import numpy as np
from PIL import Image


def gsq_to_png(src, dst):
    b = np.frombuffer(open(src, "rb").read(), np.uint8)
    w = 1024
    h = -(-(-(-len(b) // 3)) // w)
    a = np.zeros(w * h * 3, np.uint8)
    a[:len(b)] = b
    Image.fromarray(a.reshape(h, w, 3), "RGB").save(dst, optimize=True)
    assert (np.asarray(Image.open(dst)).ravel()[:len(b)] == b).all(), dst


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seq", required=True, choices=["h_slow_high", "b_slow"])
    ap.add_argument("--web", required=True, help="folder with frame_XXXXX.gsq (and manifest.json) of the full sequence")
    ap.add_argument("--seconds", type=float, default=2.0, help="excerpt length; 0 = one key frame")
    ap.add_argument("--fps", type=int, default=10, help="playback rate of the excerpt (source is 30 fps)")
    ap.add_argument("--only", nargs="*", help="movement IDs to export (default: all 35)")
    a = ap.parse_args()

    db = json.load(open("data/db.json", encoding="utf-8"))
    seq = next(s for s in db["sequences"] if s["id"] == a.seq)
    src_man = os.path.join(a.web, "manifest.json")
    center = json.load(open(src_man)).get("center") if os.path.exists(src_man) else None
    step = max(1, round(30 / a.fps))
    reg_path = os.path.join("media", "clips.json")
    reg = json.load(open(reg_path)) if os.path.exists(reg_path) else {}
    total = 0
    for g in seq["segments"]:
        if a.only and g["movement"] not in a.only:
            continue
        mid = (g["start"] + g["end"]) // 2
        half = int(a.seconds * 30 / 2)
        lo, hi = max(g["start"], mid - half), min(g["end"], mid + half)
        nums = [mid] if a.seconds == 0 else list(range(lo, hi + 1, step))
        out = os.path.join("media", "clips", a.seq, g["movement"])
        os.makedirs(os.path.join(out, "p"), exist_ok=True)
        names = []
        for n in nums:
            src = os.path.join(a.web, f"frame_{n:05d}.gsq")
            if not os.path.exists(src):
                print("missing", src)
                continue
            name = f"p/frame_{n:05d}.png"
            gsq_to_png(src, os.path.join(out, name))
            total += os.path.getsize(os.path.join(out, name))
            names.append(name)
        if not names:
            continue
        man = {"fps": a.fps if len(names) > 1 else 1, "frames": names, "source_range": [g["start"], g["end"]]}
        if center:
            man["center"] = center
        json.dump(man, open(os.path.join(out, "manifest.json"), "w"))
        reg.setdefault(a.seq, {})[g["movement"]] = f"media/clips/{a.seq}/{g['movement']}/manifest.json"
        print(g["movement"], g["name"], f"{len(names)} frames")
    json.dump(reg, open(reg_path, "w"), indent=1)
    print(f"{total / 2 ** 20:.1f} MB written; registered in {reg_path}")


if __name__ == "__main__":
    main()
