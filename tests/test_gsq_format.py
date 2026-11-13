"""02 Chunaengjeon: the .gsq web format for per-frame 3D Gaussian Splatting.

Round-trips synthetic splats through PLY -> .gsq -> decode and checks that every attribute stays
within its quantisation step; then decodes the published PNG-wrapped sample frames the way the
browser player does (platform/js/splat-player.js).
"""
import json
import sys

import numpy as np
import pytest
from PIL import Image

from conftest import ROOT

sys.path.insert(0, str(ROOT / "02_chunaengjeon-4d" / "pipeline"))
import pack_sequence  # noqa: E402
from ply_io import read_ply, write_ply  # noqa: E402

SAMPLE = ROOT / "02_chunaengjeon-4d" / "platform" / "media" / "sample"


def synthetic_splats(n=5000, seed=1):
    rng = np.random.default_rng(seed)
    q = rng.normal(size=(n, 4))
    return dict(means=rng.uniform([-0.8, -1.9, -0.6], [0.8, 0.1, 0.6], (n, 3)),
                quats=q / np.linalg.norm(q, axis=1, keepdims=True),
                scales=np.exp(rng.uniform(-7, -3, (n, 3))),
                opac=rng.uniform(0.01, 0.99, n),
                colors=rng.uniform(0, 1, (n, 3)))


@pytest.fixture
def frame(tmp_path):
    s = synthetic_splats()
    ply = tmp_path / "frame_00001.ply"
    write_ply(ply, **s)
    return s, ply


def test_ply_roundtrip(frame):
    s, ply = frame
    d = read_ply(ply)
    for k in ("means", "scales", "colors", "quats"):
        np.testing.assert_allclose(d[k], s[k], rtol=1e-5, atol=1e-6)
    np.testing.assert_allclose(d["opac"], s["opac"], atol=1e-6)


def test_gsq_roundtrip_within_quantisation_step(frame):
    s, ply = frame
    d = read_ply(ply)
    buf = pack_sequence.encode(d)
    assert len(buf) == pack_sequence.HEADER.size + pack_sequence.BYTES_PER_SPLAT * len(s["means"])
    out = pack_sequence.decode(buf)

    span = d["means"].max(0) - d["means"].min(0)
    assert np.all(np.abs(out["means"] - d["means"]) <= span / 65535 * 0.5 + 1e-6)

    ls = np.log(d["scales"])
    step = (ls.max() - ls.min()) / 255
    assert np.all(np.abs(np.log(out["scales"]) - ls) <= step * 0.5 + 1e-5)

    assert np.all(np.abs(out["colors"] - d["colors"]) <= 0.5 / 255 + 1e-6)
    assert np.all(np.abs(out["opac"] - d["opac"]) <= 0.5 / 255 + 1e-6)

    # quaternions are sign-normalised (w >= 0) before int8 quantisation
    q = d["quats"] * np.where(d["quats"][:, :1] < 0, -1, 1)
    assert np.all(out["quats"][:, 0] >= 0)
    assert np.all(np.abs(out["quats"] - q) <= 0.5 / 127 + 1e-6)


def test_pack_writes_file_atomically(frame, tmp_path):
    _, ply = frame
    out = tmp_path / "frame_00001.gsq"
    n, centre = pack_sequence.pack(str(ply), str(out))
    assert out.exists() and not (tmp_path / "frame_00001.gsq.tmp").exists()
    assert pack_sequence.decode(out.read_bytes())["means"].shape == (n, 3)
    assert centre.shape == (3,)


def test_decode_rejects_bad_input():
    with pytest.raises(ValueError):
        pack_sequence.decode(b"XXXX" + bytes(36))
    hdr = pack_sequence.HEADER.pack(b"GSQ1", 10, *([0.0] * 8))
    with pytest.raises(ValueError):
        pack_sequence.decode(hdr + bytes(5))


def png_to_gsq(path):
    """Same unwrapping as pngToBuffer() in splat-player.js: 3 bytes per RGB pixel, zero padded."""
    return np.asarray(Image.open(path).convert("RGB")).tobytes()


def test_published_sample_manifest_lists_existing_frames():
    m = json.loads((SAMPLE / "manifest.json").read_text())
    assert m["fps"] > 0 and len(m["frames"]) == 150
    missing = [f for f in m["frames"] if not (SAMPLE / f).exists()]
    assert not missing


@pytest.mark.parametrize("index", [0, 74, 149])
def test_published_sample_frames_decode(index):
    m = json.loads((SAMPLE / "manifest.json").read_text())
    d = pack_sequence.decode(png_to_gsq(SAMPLE / m["frames"][index]))
    n = len(d["means"])
    assert 10_000 < n <= 1_000_000
    assert np.isfinite(d["means"]).all() and np.isfinite(d["scales"]).all()
    # the dancer stands inside the capture volume (metres, OpenCV world frame of the rig)
    assert np.all(np.abs(d["means"]) < 5)
