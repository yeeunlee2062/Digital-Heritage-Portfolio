"""01 Hansan Mosi: published RDF records, vocabulary, SHACL shapes and DCAT catalogue.

The full export (27,602 triples) is validated in the project's build; this repository carries an
excerpt of five records. They are checked here against the same shapes: the only permitted results
are sh:class checks on records that are referenced but not included in the excerpt.
"""
from pathlib import Path

import pytest
import rdflib
from pyshacl import validate
from rdflib.compare import isomorphic
from rdflib.namespace import RDF, SH

from conftest import ROOT

MODEL = ROOT / "01_hansan-mosi-scene-archive" / "data-model"
RECORDS = sorted((MODEL / "sample-records").glob("*.ttl"))


def parse(path: Path, fmt=None):
    return rdflib.Graph().parse(path, format=fmt)


@pytest.mark.parametrize("name", ["vocab.ttl", "shapes.ttl", "catalog.ttl"])
def test_model_files_parse(name):
    assert len(parse(MODEL / name)) > 0


@pytest.mark.parametrize("ttl", RECORDS, ids=lambda p: p.stem)
def test_jsonld_and_turtle_serialisations_are_isomorphic(ttl):
    assert isomorphic(parse(ttl), parse(ttl.with_suffix(".jsonld"), "json-ld"))


def test_sample_records_conform_to_shapes():
    data = parse(MODEL / "vocab.ttl")
    for ttl in RECORDS:
        data.parse(ttl)
    _, report, text = validate(data, shacl_graph=parse(MODEL / "shapes.ttl"), inference="none")

    unexpected = []
    for r in report.subjects(RDF.type, SH.ValidationResult):
        value = report.value(r, SH.value)
        component = report.value(r, SH.sourceConstraintComponent)
        outside_excerpt = isinstance(value, rdflib.URIRef) and (value, None, None) not in data
        if not (component == SH.ClassConstraintComponent and outside_excerpt):
            unexpected.append(text)
    assert not unexpected, unexpected[0]


def test_catalogue_describes_distributions():
    g = parse(MODEL / "catalog.ttl")
    dcat = rdflib.Namespace("http://www.w3.org/ns/dcat#")
    assert any(g.subjects(RDF.type, dcat.Distribution))
