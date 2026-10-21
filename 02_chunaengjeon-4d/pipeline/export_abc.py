# Blender headless: dump each Alembic sample (30 fps) to npz (raw local coords, no object transform).
# usage: blender -b --factory-startup --python export_abc.py -- <file.abc> <out_dir> <first> <last>
import os
import sys

import bpy
import numpy as np

args = sys.argv[sys.argv.index("--") + 1:]
abc, out_dir, first, last = args[0], args[1], int(args[2]), int(args[3])
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = 30
sc.render.fps_base = 1.0
bpy.ops.wm.alembic_import(filepath=abc, set_frame_range=True, as_background_job=False)
ob = bpy.data.objects["4DViews"]
print("RANGE", sc.frame_start, sc.frame_end)

dg = bpy.context.evaluated_depsgraph_get()
for f in range(first, last + 1):
    path = os.path.join(out_dir, f"mesh.{f:05d}.npz")
    if os.path.exists(path):
        continue
    try:
        sc.frame_set(f)
        e = ob.evaluated_get(dg)
        me = e.to_mesh()
        nv, nl, nf = len(me.vertices), len(me.loops), len(me.polygons)
        v = np.empty(nv * 3, np.float32)
        me.vertices.foreach_get("co", v)
        corner = np.empty(nl, np.int32)
        me.loops.foreach_get("vertex_index", corner)
        uv = np.empty(nl * 2, np.float32)
        me.uv_layers[0].data.foreach_get("uv", uv)
        tot = np.empty(nf, np.int32)
        me.polygons.foreach_get("loop_total", tot)
        e.to_mesh_clear()
        faces = corner.reshape(-1, 3)
        ok = nf > 0 and (tot == 3).all() and (faces < nv).all()
        # drop degenerate triangles (repeated vertex) that a damaged sample may contain
        good = (faces[:, 0] != faces[:, 1]) & (faces[:, 1] != faces[:, 2]) & (faces[:, 0] != faces[:, 2]) if ok else None
        if not ok or good.mean() < 0.5:
            raise ValueError(f"damaged sample: {nv} verts, {nf} faces")
        np.savez(path, verts=v.reshape(-1, 3), faces=faces[good], uvs=uv.reshape(-1, 3, 2)[good])
        print("DONE", f, nv, nf, flush=True)
    except Exception as ex:  # noqa: BLE001  keep going; the frame is listed in bad_frames.txt
        with open(os.path.join(out_dir, "bad_frames.txt"), "a") as fh:
            fh.write(f"{f}\t{ex}\n")
        print("BAD", f, ex, flush=True)
