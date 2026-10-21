"""Independent sanity checks for the shared NA0007 CQ/negative-control graph."""
import csv
from collections import Counter
from pathlib import Path

data = Path(__file__).parent / 'data'


def rows(name):
    with (data / name).open(newline='', encoding='utf-8-sig') as file:
        return list(csv.DictReader(file))


original = rows('NA0007_CQ_relationships_original.csv')
corrected = rows('NA0007_CQ_relationships_corrected.csv')
witnesses = rows('NA0007_CQ_relationships_with_controls.csv')
focal_nodes = rows('NA0007_CQ_nodes_original.csv')
all_nodes = rows('NA0007_CQ_nodes_with_controls.csv')
assert (len(focal_nodes), len(original), len(corrected), len(all_nodes), len(witnesses)) == (44, 50, 46, 51, 51)


def has(source, relation, target, edges=witnesses):
    return any(e[':START_ID(NHO)'] == source and e[':TYPE'] == relation and e[':END_ID(NHO)'] == target for e in edges)


def targets(source, relation):
    return {e[':END_ID(NHO)'] for e in witnesses if e[':START_ID(NHO)'] == source and e[':TYPE'] == relation}


assert targets('NA0007', 'HAS_SPECIMEN') == {'SP0007', 'SP0008', 'SP0009', 'SP0064'}
assert targets('NA0007', 'HAS_OBSERVATION') == {'OB0007'}
assert targets('NA0007', 'DESIGNATED_AS') == {'HR00002', 'HR00007'}
assert len(targets('NA0007', 'DOCUMENTED_BY')) == 23
chains = [s for s in targets('NA0007', 'HAS_SPECIMEN') for instance in targets(s, 'DIGITIZED_AS') if targets(instance, 'HAS_FILE')]
assert len(chains) == 4
assert all(has('PR0001', 'INCLUDES_SPECIMEN', s) for s in targets('NA0007', 'HAS_SPECIMEN'))
assert all(has('PR0001', 'PRODUCED_INSTANCE', instance) for s in targets('NA0007', 'HAS_SPECIMEN') for instance in targets(s, 'DIGITIZED_AS'))

for invalid in ['HR00003', 'HR00004', 'HR00005', 'HR00006']:
    assert has('NA0007', 'DESIGNATED_AS', invalid, original)
    assert not has('NA0007', 'DESIGNATED_AS', invalid)
assert has('NA0092', 'DESIGNATED_AS', 'HR00059') and not has('NA0007', 'DESIGNATED_AS', 'HR00059')
assert has('NA0125', 'DESIGNATED_AS', 'HR00076') and not has('NA0007', 'DESIGNATED_AS', 'HR00076')
assert has('NA0125', 'DOCUMENTED_BY', 'RH215') and not has('NA0007', 'DOCUMENTED_BY', 'RH215')
for taxon, observation in [('NA0092', 'OB0092'), ('NA0125', 'OB0125')]:
    assert has(taxon, 'HAS_OBSERVATION', observation)
    assert not has('NA0007', 'HAS_OBSERVATION', observation)

print('ALL_CQ_CHECKS_PASSED: corrected CQ1--CQ7 and NC1--NC3, with positive other-taxon witnesses')
print('CQ7:', {'Specimen': 4, 'Observation': 1, 'Heritage': 2, 'Resource': 23, 'Instance': 4, 'Item': 4})
