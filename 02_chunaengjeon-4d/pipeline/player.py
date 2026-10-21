"""Interactive 4D Gaussian Splatting sequence player (gsplat + OpenCV window).

usage: python player.py <dir with frame_XXXXX.ply> [--fps 30] [--size 1280x1024] [--cameras cameras.json]

mouse: left-drag orbit | right-drag pan | wheel zoom
keys : space play/pause | a/d step -/+1 | j/l jump -/+30 | c cycle capture cameras | f free camera
       b toggle background | s screenshot | q / esc quit
"""
import argparse
import glob
import json
import os
import re
import threading
import time
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from gsplat import rasterization

SH_C0 = 0.28209479177387814


def read_ply(path):
    with open(path, "rb") as fh:
        header = b""
        while not header.endswith(b"end_header\n"):
            header += fh.readline()
        names = re.findall(rb"property float (\w+)", header)
        n = int(re.search(rb"element vertex (\d+)", header).group(1))
        data = np.frombuffer(fh.read(n * len(names) * 4), np.float32).reshape(n, len(names))
    col = {k.decode(): i for i, k in enumerate(names)}
    g = lambda *ks: data[:, [col[k] for k in ks]]
    return dict(means=g("x", "y", "z"), quats=g("rot_0", "rot_1", "rot_2", "rot_3"),
                scales=np.exp(g("scale_0", "scale_1", "scale_2")),
                opac=1 / (1 + np.exp(-g("opacity")[:, 0])),
                colors=np.clip(g("f_dc_0", "f_dc_1", "f_dc_2") * SH_C0 + 0.5, 0, 1))


class Cache:
    def __init__(self, files, size=90, workers=6):
        self.files, self.size = files, size
        self.data, self.lock = OrderedDict(), threading.Lock()
        self.pool, self.pending = ThreadPoolExecutor(workers), {}

    def _load(self, i):
        d = read_ply(self.files[i])
        with self.lock:
            self.data[i] = d
            while len(self.data) > self.size:
                self.data.popitem(last=False)
            self.pending.pop(i, None)

    def request(self, i):
        with self.lock:
            if i in self.data or i in self.pending:
                return
            self.pending[i] = self.pool.submit(self._load, i)

    def get(self, i, wait=False):
        self.request(i)
        if wait:
            f = self.pending.get(i)
            if f:
                f.result()
        with self.lock:
            return self.data.get(i)


def orbit_view(target, yaw, pitch, dist, up=np.array([0, -1.0, 0])):
    # spherical coordinates around target in a Y-down world
    eye = target + dist * np.array([np.sin(yaw) * np.cos(pitch), -np.sin(pitch), np.cos(yaw) * np.cos(pitch)])
    z = target - eye
    z /= np.linalg.norm(z)
    x = np.cross(z, up)
    x /= np.linalg.norm(x)
    y = np.cross(z, x)
    m = np.eye(4)
    m[:3, :3] = np.stack([x, y, z])
    m[:3, 3] = -m[:3, :3] @ eye
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--fps", type=float, default=30)
    ap.add_argument("--size", default="1224x1024")
    ap.add_argument("--cameras", default=None, help="cameras.json to snap the view to capture cameras")
    args = ap.parse_args()
    files = sorted(glob.glob(os.path.join(args.dir, "frame_*.ply")))
    assert files, "no frame_*.ply found"
    W, H = map(int, args.size.split("x"))
    cams = json.load(open(args.cameras)) if args.cameras and os.path.exists(args.cameras) else {}
    cam_names = sorted(cams)

    cache = Cache(files)
    first = cache.get(0, wait=True)
    target = first["means"].mean(0)
    st = dict(yaw=np.pi, pitch=0.15, dist=4.0, target=target.copy(), playing=True, cam=-1, bg=0.0,
              drag=None, last=None)
    f = 1.2 * H

    def on_mouse(ev, x, y, flags, _):
        if ev in (cv2.EVENT_LBUTTONDOWN, cv2.EVENT_RBUTTONDOWN):
            st["drag"], st["last"] = ("orbit" if ev == cv2.EVENT_LBUTTONDOWN else "pan"), (x, y)
            st["cam"] = -1
        elif ev in (cv2.EVENT_LBUTTONUP, cv2.EVENT_RBUTTONUP):
            st["drag"] = None
        elif ev == cv2.EVENT_MOUSEMOVE and st["drag"]:
            dx, dy = x - st["last"][0], y - st["last"][1]
            st["last"] = (x, y)
            if st["drag"] == "orbit":
                st["yaw"] -= dx * 0.008
                st["pitch"] = float(np.clip(st["pitch"] + dy * 0.008, -1.5, 1.5))
            else:
                V = orbit_view(st["target"], st["yaw"], st["pitch"], st["dist"])
                st["target"] += (-V[0, :3] * dx + -V[1, :3] * dy) * st["dist"] / f
        elif ev == cv2.EVENT_MOUSEWHEEL:
            st["dist"] *= 0.9 if flags > 0 else 1.1

    win = "4DGS player"
    cv2.namedWindow(win, cv2.WINDOW_AUTOSIZE)
    cv2.setMouseCallback(win, on_mouse)
    i, t_last, shown = 0, time.time(), None
    torch.set_grad_enabled(False)
    while True:
        for k in range(1, 30):
            cache.request((i + k) % len(files))
        d = cache.get(i, wait=not st["playing"]) or shown
        if d is not None:
            shown = d
            if st["cam"] >= 0:
                c = cams[cam_names[st["cam"]]]
                s = W / c["width"]
                K = np.array(c["K"]) * np.array([[s], [s], [1]])
                V = np.array(c["w2c"])
                h_ = int(round(c["height"] * s))
            else:
                K = np.array([[f, 0, W / 2], [0, f, H / 2], [0, 0, 1]])
                V = orbit_view(st["target"], st["yaw"], st["pitch"], st["dist"])
                h_ = H
            t = lambda a: torch.as_tensor(a, dtype=torch.float32, device="cuda")
            rgb, alpha, _ = rasterization(t(d["means"]), F.normalize(t(d["quats"]), dim=-1), t(d["scales"]),
                                          t(d["opac"]), t(d["colors"]), t(V)[None], t(K)[None], W, h_)
            img = rgb[0] + (1 - alpha[0]) * st["bg"]
            img = (img.clamp(0, 1).cpu().numpy() * 255).astype(np.uint8)[..., ::-1].copy()
            label = f"frame {i + 1}/{len(files)}  {'play' if st['playing'] else 'pause'}"
            if st["cam"] >= 0:
                label += f"  cam {cam_names[st['cam']]}"
            cv2.putText(img, label, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (128, 128, 128), 2)
            cv2.imshow(win, img)
        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), 27) or cv2.getWindowProperty(win, cv2.WND_PROP_VISIBLE) < 1:
            break
        elif key == ord(" "):
            st["playing"] = not st["playing"]
        elif key in (ord("a"), ord("d"), ord("j"), ord("l")):
            i = (i + {ord("a"): -1, ord("d"): 1, ord("j"): -30, ord("l"): 30}[key]) % len(files)
        elif key == ord("c") and cam_names:
            st["cam"] = (st["cam"] + 1) % len(cam_names)
        elif key == ord("f"):
            st["cam"] = -1
        elif key == ord("b"):
            st["bg"] = 1.0 - st["bg"]
        elif key == ord("s") and d is not None:
            cv2.imwrite(f"screenshot_{i + 1:05d}.png", img)
        if st["playing"] and time.time() - t_last >= 1 / args.fps:
            nxt = (i + 1) % len(files)
            if cache.get(nxt) is not None:  # wait for loading instead of skipping
                i, t_last = nxt, time.time()


if __name__ == "__main__":
    main()
