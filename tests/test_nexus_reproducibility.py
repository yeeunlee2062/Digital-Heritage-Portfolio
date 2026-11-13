"""03 NEXUS: the published reproducibility package still reproduces the article's numbers.

Runs the package's own checks unchanged (Python CQ validation and the Node.js ranking
recomputation), and verifies that the ranking script regenerates results_reproduced.json byte for byte.
"""
import hashlib
import shutil
import subprocess
import sys

import pytest

from conftest import ROOT

PKG = ROOT / "03_nexus-natural-heritage" / "reproducibility"


def test_competency_questions_and_negative_controls():
    out = subprocess.run([sys.executable, "validate_cq_subset.py"], cwd=PKG, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    assert "ALL_CQ_CHECKS_PASSED" in out.stdout


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js not installed")
def test_ranking_results_are_regenerated_identically(tmp_path):
    work = tmp_path / "pkg"
    shutil.copytree(PKG, work)
    out = subprocess.run(["node", "reproduce_ranking.cjs"], cwd=work, capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    assert (work / "results_reproduced.json").read_bytes() == (PKG / "results_reproduced.json").read_bytes()


def test_package_fixity():
    lines = (PKG / "SHA256SUMS.txt").read_text().split("\n")
    entries = [line.split(None, 1) for line in lines if line.strip()]
    assert entries
    for digest, name in entries:
        name = name.lstrip("*").strip()
        assert hashlib.sha256((PKG / name).read_bytes()).hexdigest() == digest, name
