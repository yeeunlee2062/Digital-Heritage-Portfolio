# NEXUS reproducibility supplement (corrected validation and ranking)

This package reproduces the corrected NA0007 competency questions, three semantic negative controls with positive other-taxon witnesses, and the aggregate ranking analyses in manuscript Section 7.2, Table 8, and Appendix Table C3. It preserves the original graph-construction totals separately from the corrected analysis graph. No Neo4j instance is needed for the two automated checks below; the matching Cypher queries are also supplied.

## Run the checks

```sh
python3 validate_cq_subset.py
node reproduce_ranking.cjs
```

The Python script checks CQ1--CQ7 and NC1--NC3 from the corrected local CSVs. The JavaScript script uses the same graph engine and scoring constants as the prototype, asserts the reported Table 8/C3 values, and writes `results_reproduced.json`. Node.js and Python 3 with their standard libraries suffice. `File_S1_expected_results_corrected.tsv` states the expected CQ outputs and their limits.

To inspect the Cypher results in Neo4j 5.26, import `data/NA0007_CQ_nodes_with_controls.csv` and `data/NA0007_CQ_relationships_with_controls.csv` into a separate empty database, then run `File_S1_CQ_validation_corrected.cypher`. Execute each independently headed query. Do not import the subset into or overwrite the original full-project database. The supplied node CSV uses `id:ID(NHO)` and `:LABEL`; the relationships use `:START_ID(NHO)`, `:END_ID(NHO)`, and `:TYPE`. The expected counts in this separate test database are 51 nodes and 51 relations; the corrected NA0007 designation query returns HR00002 and HR00007. `File_S1_full_graph_scope_check.cypher` provides optional read-only queries for the author's *original* full-project database, where the original construction counts remain 2,910 nodes and 3,251 relations. These two databases have different scopes and must not be compared as if they were identical exports.

## Original counts versus analysis graphs

| Dataset | Nodes | Relations | Purpose |
| --- | ---: | ---: | --- |
| Original complete graph (reported construction counts) | 2,910 | 3,251 | Counts retained in manuscript Table 6; full graph is not contained in this package |
| Original supplied NA0007 subset | 44 | 50 | Original import, including four incorrect `DESIGNATED_AS` edges |
| Corrected NA0007 subset | 44 | 46 | CQ1--CQ7 for the corrected focal entity; the four removed edges leave their Heritage nodes isolated |
| Corrected NA0007 subset plus controls | 51 | 51 | Above corrected graph plus seven other-taxon witness nodes and five true witness edges for NC1--NC3 |
| Minimal corrected ranking projection | 398 | 618 | Union of paths reachable within three hops from the 12 declared focal nodes using the prototype's traversal rules |

The four excluded original edges connect `NA0007` to `HR00003`, `HR00004`, `HR00005`, and `HR00006`. Corrected NA0007 results contain two directly connected Heritage nodes (`HR00002` and `HR00007`); these corrected outputs supersede the original `CQ3=6` and `CQ7 Heritage=6` in the earlier expected-results file. In the full original graph, excluding four edges for analysis would leave 3,247 edges, but 3,251 remains the original graph-construction count reported in Table 6.

The new positive witnesses are `NA0092` -> `HR00059` and `OB0092`, and `NA0125` -> `HR00076`, `RH215`, and `OB0125`. The negative tests check that those other-taxon records exist and are connected to their source taxa while not being linked to `NA0007`. The witness nodes carry only the fields necessary for these tests; they are not a replacement for the entire external taxonomic metadata source. No habitat negative control is possible because no independent habitat relation is instantiated in the current graph.

CQ7 aggregates previously checked focal counts and is not an independent semantic constraint. CQ6's focal project links and counts are reproducible here; its complete-project totals (538 specimens and 382 instances) require the unreleased complete graph. This focused package does not validate every ontology property or taxonomic association in the full graph.

## Properties and UCO scope

The original focal node-import CSV directly exposes `id`, `name`, `type`, `domain`, `scientificName`, `description`, `source`, `url`, `institution`, `location`, `date`, `fileType`, `sizeMB`, and `public`. `propertiesJson` stores additional class-specific source metadata as serialized content, rather than as independently queryable Neo4j properties. For example, the supplied specimen records store sex (성별) and, where present, life stage (성장단계) in `propertiesJson`; the observation record stores its source event date there, while the common `date` property is directly queryable where populated. An ontology-level seasonal state is not a populated standalone column in these CSVs. The earlier README listed only the smaller subset of direct fields actually referenced by the CQ queries; Appendix Table B4 documents these levels. Schema-only extensions such as `HAS_COMPONENT`, `HAS_VARIANT`, and `DERIVED_FROM` are not instantiated or tested by the supplied CSVs.

This package reproduces NHO graph paths and the ranking engine, but does not contain UCO user instances, a complete cold-start implementation, interface presentation rules, or participant responses. The supplied ranking engine accepts the four profile weights as inputs. In the evaluated six-item cold start, Q4 captures `DomainFamiliarity`; neither Q1--Q6 nor the published profile-activation table captures `ExpertiseLevel` (Novice, Intermediate, Expert). Accordingly, this UCO attribute does not enter the reported six-item numerical profile-activation or ranking procedure. `UCO_ontology_source.cypher`, supplied from the author's earlier recovered ontology code, defines the three expertise categories and associates `Intermediate` and `Expert` with the analytical profile. These are ontology-level associations, not extra numeric terms in the evaluated activation formula. Manuscript Figures 3 and 5 illustrate the ontology and interface; the present package does not establish expertise-dependent adjustment of explanation depth.

## The 12-focal ranking analysis

The evaluation set used to recompute the numbers reported in Section 7.2, Table 8, and Table C3 was `NA0007, NA0019, NA0024, NA0035, NA0057, NA0067, NA0081, NA0084, NA0108, NA0109, NA0119, NA0124`. Each has direct specimen, observation, designation, and documentary relations. This list documents the actual recalculation used for the revision; the original NA0007-only supplement does not determine a unique 12-case selection. The selected cases should not be described as a random or representative sample of all Nature nodes.

`analysis_config.json` records the IDs, graph correction, four one-hot profiles, and default parameters. `data/ranking_graph_minimal.json` strips source metadata and retains only the nodes and edges sufficient for this 12-case, three-hop ranking analysis. The full corrected graph and this projection were verified to return identical ordered result lists and candidate lists across all 48 focal-node/profile base conditions. This projection makes the reported ranking results runnable, while it cannot independently establish the full project's node/edge totals or validate other queries requiring unexported source records.

`reproduce_ranking.cjs` tests all 12 focal nodes against four profiles; cross-profile comparisons average six unordered pairs per focal node. Overlap@k is the number of shared nodes in the two top-k sets divided by k. Kendall's tau compares complete result rankings of the same node set; ties are resolved by descending score, then ascending distance, then node ID. Jaccard is used when a changed depth or quota produces different returned sets. The candidate pool is measured before the per-class quota; the returned set is measured after it. Sensitivity changes one of the 32 profile--relation affinities at a time by -10%, +10%, -20%, or +20%, clips values to [0,1], and holds all other parameters fixed. Perturbation agreement compares only the affected profile with its reference; cross-profile ranges each span 64 perturbation settings.

The reference scoring coefficients are `(eta, lambda, beta)=(0.55, 0.25, 0.20)`. The alternative `(0.60, 0.23, 0.17)` produces identical rankings in the reported tests, but it is **not** the reference configuration. Uniform-relation weights and term ablations are reproduced separately in `results_reproduced.json`.

`NEXUS_Supplementary_v3.docx` reports the complete QFD matrix and design priorities. Table S1c documents the operational class-prior assignments: H1 (0.675) for Nature, Specimen, Observation, and Project; H9 (0.783) for Heritage and Resource; and H7 (0.800) for Instance and Item. The broader HOW links in manuscript Table 3 document requirement traceability and are not all node-prior assignments. Table S1d provides the functional rationale for manually specified profile--relation affinities, which are not estimated from the QFD matrix. Table S2 contains the corrected full top-24 results for NA0007.
