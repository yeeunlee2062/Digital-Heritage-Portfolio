// Optional, read-only checks against the author's ORIGINAL full-project Neo4j database.
// This script is not executable against the 51-node corrected validation subset.

// Original construction totals (expected: 2910 nodes and 3251 relations).
MATCH (n) RETURN count(n) AS original_nodes;

MATCH ()-[r]->() RETURN count(r) AS original_relations;

// Original designation total (expected: 80; corrected analysis excludes four edges).
MATCH ()-[r:DESIGNATED_AS]->() RETURN count(r) AS original_designations;

// Audit the four original erroneous links; on the unmodified original graph these return four rows.
MATCH (:Nature {id:'NA0007'})-[r:DESIGNATED_AS]->(h:Heritage)
WHERE h.id IN ['HR00003','HR00004','HR00005','HR00006']
RETURN h.id AS excluded_heritage_id, type(r) AS original_relation ORDER BY excluded_heritage_id;

// Enumerate directly queryable properties; serialized JSON fields are not broken out by this query.
MATCH (n) UNWIND keys(n) AS property
RETURN property, count(*) AS nodes_with_property ORDER BY property;
