"""Read and write per-frame 3DGS PLY files (the standard INRIA 3DGS layout).

Kept free of torch, gsplat and OpenCV so that the packing step and its tests run on a plain
NumPy installation.
"""
import re

import numpy as np

SH_C0 = 0.28209479177387814
PLY_FIELDS = ("x", "y", "z", "f_dc_0", "f_dc_1", "f_dc_2", "opacity",
              "scale_0", "scale_1", "scale_2", "rot_0", "rot_1", "rot_2", "rot_3")


def read_ply(path):
    """Return means (n,3), quats wxyz (n,4), linear scales (n,3), opacity 0..1 (n,) and RGB 0..1 (n,3)."""
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


def write_ply(path, means, quats, scales, opac, colors):
    """Inverse of read_ply: store log-scales, logit opacity and SH degree-0 colour."""
    o = np.clip(np.asarray(opac, np.float64), 1e-6, 1 - 1e-6)
    cols = [means, (np.asarray(colors) - 0.5) / SH_C0, np.log(o / (1 - o))[:, None], np.log(scales), quats]
    data = np.concatenate([np.asarray(c, np.float32) for c in cols], 1)
    header = "ply\nformat binary_little_endian 1.0\nelement vertex %d\n" % len(data)
    header += "".join(f"property float {k}\n" for k in PLY_FIELDS) + "end_header\n"
    with open(path, "wb") as fh:
        fh.write(header.encode("ascii"))
        fh.write(data.astype("<f4").tobytes())
