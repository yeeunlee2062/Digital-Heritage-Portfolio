// Execute against the corrected 51-node, 51-relation graph with control witnesses.
// The first 44 nodes and 46 relations reproduce corrected NA0007 focal paths.

// CQ1: focal specimens (4).
MATCH (:Nature {id:'NA0007'})-[:HAS_SPECIMEN]->(s:Specimen)
RETURN s.id AS specimen ORDER BY specimen;

// CQ2: focal observation (1).
MATCH (:Nature {id:'NA0007'})-[:HAS_OBSERVATION]->(o:Observation)
RETURN o.id AS observation ORDER BY observation;

// CQ3: semantically retained heritage nodes (2).
MATCH (:Nature {id:'NA0007'})-[:DESIGNATED_AS]->(h:Heritage)
RETURN h.id AS heritage ORDER BY heritage;

// CQ4: focal documentary resources (23).
MATCH (:Nature {id:'NA0007'})-[:DOCUMENTED_BY]->(r:Resource)
RETURN r.id AS resource ORDER BY resource;

// CQ5: complete specimen -> instance -> item chains (4).
MATCH (:Nature {id:'NA0007'})-[:HAS_SPECIMEN]->(s:Specimen)
MATCH (s)-[:DIGITIZED_AS]->(i:Instance)-[:HAS_FILE]->(it:Item)
RETURN s.id AS specimen, i.id AS instance, it.id AS item ORDER BY specimen;

// CQ6: only the *focal* project association is reproducible from this subset.
MATCH (:Nature {id:'NA0007'})-[:HAS_SPECIMEN]->(s:Specimen)
MATCH (p:Project)-[:INCLUDES_SPECIMEN]->(s)
MATCH (p)-[:PRODUCED_INSTANCE]->(i:Instance)<-[:DIGITIZED_AS]-(s)
RETURN p.id AS project, count(DISTINCT s) AS focal_specimens, count(DISTINCT i) AS focal_instances;

// CQ7: aggregate consistency check, not an independent semantic constraint.
MATCH (n:Nature {id:'NA0007'})
OPTIONAL MATCH (n)-[:HAS_SPECIMEN]->(s:Specimen)
OPTIONAL MATCH (n)-[:HAS_OBSERVATION]->(o:Observation)
OPTIONAL MATCH (n)-[:DESIGNATED_AS]->(h:Heritage)
OPTIONAL MATCH (n)-[:DOCUMENTED_BY]->(r:Resource)
OPTIONAL MATCH (s)-[:DIGITIZED_AS]->(i:Instance)
OPTIONAL MATCH (i)-[:HAS_FILE]->(it:Item)
RETURN count(DISTINCT s) AS Specimen, count(DISTINCT o) AS Observation,
       count(DISTINCT h) AS Heritage, count(DISTINCT r) AS Resource,
       count(DISTINCT i) AS Instance, count(DISTINCT it) AS Item;

// NC1: the four excluded designation links are absent; retained links remain.
MATCH (n:Nature {id:'NA0007'})
OPTIONAL MATCH (n)-[bad:DESIGNATED_AS]->(h:Heritage)
WHERE h.id IN ['HR00003','HR00004','HR00005','HR00006']
RETURN count(bad) AS invalid_designations;

// NC1 witness: another taxon has its own designation; NA0007 does not.
MATCH (other:Nature {id:'NA0092'})-[:DESIGNATED_AS]->(h:Heritage {id:'HR00059'})
MATCH (focal:Nature {id:'NA0007'})
RETURN other.id AS witness_taxon, h.id AS designation,
       EXISTS { MATCH (focal)-[:DESIGNATED_AS]->(h) } AS erroneous_focal_link;

// NC2: the taxon-exclusive resource exists and is linked to NA0125, not NA0007.
MATCH (other:Nature {id:'NA0125'})-[:DOCUMENTED_BY]->(r:Resource {id:'RH215'})
MATCH (focal:Nature {id:'NA0007'})
RETURN other.id AS witness_taxon, r.id AS documentary_resource,
       EXISTS { MATCH (focal)-[:DOCUMENTED_BY]->(r) } AS erroneous_focal_link;

// NC3: two observations exist and are linked to their respective other taxa.
UNWIND [['NA0092','OB0092'],['NA0125','OB0125']] AS pair
MATCH (other:Nature)-[:HAS_OBSERVATION]->(o:Observation)
WHERE other.id = pair[0] AND o.id = pair[1]
MATCH (focal:Nature {id:'NA0007'})
RETURN other.id AS witness_taxon, o.id AS observation,
       EXISTS { MATCH (focal)-[:HAS_OBSERVATION]->(o) } AS erroneous_focal_link;
