"""Repository-level FAIR software metadata: licences, citation file and project folders."""
import re

import yaml

from conftest import ROOT

PROJECTS = sorted(p for p in ROOT.iterdir() if p.is_dir() and re.match(r"\d\d_", p.name))


def test_citation_cff_has_required_fields():
    cff = yaml.safe_load((ROOT / "CITATION.cff").read_text(encoding="utf-8"))
    for key in ("cff-version", "message", "title", "authors", "version", "date-released", "license"):
        assert cff.get(key), key
    assert all(a.get("family-names") and a.get("given-names") for a in cff["authors"])


def test_licences_present():
    assert (ROOT / "LICENSE").read_text().startswith("MIT")
    assert "CC BY 4.0" in (ROOT / "LICENSE-CONTENT.md").read_text(encoding="utf-8")


def test_every_project_is_documented():
    assert len(PROJECTS) == 7
    for p in PROJECTS:
        assert (p / "README.md").exists(), p.name


def test_relative_links_in_readmes_resolve():
    broken = []
    for md in [ROOT / "README.md", ROOT / "CONTRIBUTIONS.md", *ROOT.glob("0*/**/README.md")]:
        for target in re.findall(r"\]\((?!https?:|#|mailto:)([^)\s]+)\)", md.read_text(encoding="utf-8")):
            path = (md.parent / target.split("#")[0]).resolve()
            if not path.exists():
                broken.append(f"{md.relative_to(ROOT)} -> {target}")
    assert not broken, broken
