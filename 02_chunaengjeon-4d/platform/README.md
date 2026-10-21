# Chunaengjeon in 4D: Volumetric Heritage Workstation & Editorial Platform

Static site, no build step. Open `index.html` through any web server (`python3 -m http.server 8123`), or deploy the folder as it is (Vercel settings in `vercel.json`).

| Path | Content |
|---|---|
| `index.html`, `css/app.css`, `js/app.js` | Workstation interface (`Split Studio` / `Cinema 4D` / `Editorial Dossier`), dual design system (`Linear Dark` & `Warm Editorial`), 32-camera interactive radar, command palette (`⌘K`), and synchronized multi-track timeline (Korean & English) |
| `js/splat-player.js` | WebGL2 player for per-frame 3DGS sequences; `.gsq` bytes stored losslessly in PNG pixels, decoded in a worker, with Hwamunseok floor guide and 32-camera HOLOSYS rig overlay |
| `data/db.json` | Scene-centred database (dance, scenes, movements, pieces, instruments, verse, spaces, costumes, performance, transmitters, 10 interpretive paths) and movement segments |
| `data/cameras.json` | Calibrated 32-camera HOLOSYS parameters (`K`, `dist`, `w2c`, `reproj_px`) |
| `data/en.json` | English layer written from the Korean database (also merged into `db.json`) |
| `media/sample/` | 10-second 4DGS excerpt (`H_fast`, frames 2242–2540, 150 frames at 15 fps) |
| `media/stills/` | Sequence mid-frame thumbnails (`*_mid.jpg`) and 32-camera silhouette verification (`verify_f01500.jpg`) |
| `tools/build_data.py` | Rebuilds `data/db.json` from the interpretation workbook and annotation CSVs |
| `tools/export_movement_clips.py` | Exports movement-level excerpts from a full web sequence and registers them |

Deep links: `#MVM_008` opens a movement, `?lang=ko` or `?lang=en` selects language, `?theme=editorial` or `?theme=dark` selects the design system.
