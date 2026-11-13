"""02 Chunaengjeon: referential integrity of the scene-centred dance database and its link to 4D frames."""
import json

import pytest

from conftest import ROOT

DB = json.loads((ROOT / "02_chunaengjeon-4d" / "platform" / "data" / "db.json").read_text(encoding="utf-8"))
IDS = {k: {r["id"] for r in v} for k, v in DB.items() if isinstance(v, list) and v and "id" in v[0]}

SCENE_REFS = {"movement": "movements", "piece": "pieces", "space": "spaces", "lyrics": "lyrics",
              "transmitter": "transmitters"}


def test_ids_are_unique():
    for coll, rows in DB.items():
        if isinstance(rows, list) and rows and "id" in rows[0] and coll != "lyrics":
            assert len(rows) == len(IDS[coll]), coll


def test_verse_lines_share_the_verse_id_and_are_ordered():
    # the four lines of the sung verse (창사) are one record, LYR_001, distinguished by their order
    keys = [(r["id"], int(r["order"])) for r in DB["lyrics"]]
    assert len(set(keys)) == len(keys)
    assert sorted(o for _, o in keys) == list(range(1, len(keys) + 1))


@pytest.mark.parametrize("field,target", SCENE_REFS.items())
def test_scene_references_resolve(field, target):
    dangling = [s["id"] for s in DB["scenes"] if s.get(field) and s[field] not in IDS[target]]
    assert not dangling


@pytest.mark.parametrize("coll", ["movements", "pieces", "lyrics"])
def test_back_references_to_scenes_resolve(coll):
    dangling = [(r["id"], s) for r in DB[coll] if isinstance(r.get("scenes"), list)
                for s in r["scenes"] if s not in IDS["scenes"]]
    assert not dangling


@pytest.mark.parametrize("seq", DB["sequences"], ids=lambda s: s["id"])
def test_movement_segments_address_the_4d_record(seq):
    segs = seq["segments"]
    assert len(segs) == 35
    for s in segs:
        assert 1 <= s["start"] < s["end"] <= seq["frames"], s["segment"]
        assert s["movement"] in IDS["movements"]
        assert s["scene_start"] in IDS["scenes"] and s["scene_end"] in IDS["scenes"]
    # segments follow the choreography in order and do not overlap
    assert all(a["end"] < b["start"] for a, b in zip(segs, segs[1:]))


def test_both_recordings_annotate_the_same_choreography():
    a, b = ([s["movement"] for s in q["segments"]] for q in DB["sequences"])
    assert a == b
