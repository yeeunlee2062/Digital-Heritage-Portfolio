# 07 Operationalising FAIR for 3D/4D Heritage Data: From Design to Verified Deployment

Two assessments with the RDA FAIR Data Maturity Model: the metadata design of a 4D archive of traditional dance, behind [Chunaengjeon in 4D](../02_chunaengjeon-4d/), and the deployed [Hansan Mosi weaving archive](../01_hansan-mosi-scene-archive/).

## Research overview

FAIR is now a common requirement for 3D heritage infrastructures, but it is often claimed at the level of a design or a policy, and the generic indicators say little about what 3D and 4D data make difficult: large captures, proprietary formats, digitisation paradata and per-asset rights. This work does not propose new FAIR indicators. It applies an existing framework, the RDA FAIR Data Maturity Model (v1.0; 41 indicators, each marked essential, important or useful, with area levels 0–5), and uses it as a working instrument. Three questions guide the work:

- What does each indicator require of a heritage data model and of the web service that publishes it, stated as a specification that can be implemented and tested?
- How far does an assessment of a design differ from one verified against a running service?
- Where do 3D/4D data resist the generic indicators?

## Assessment procedure

- **Evidence for every indicator.** Each of the 41 indicators is scored in the model's template (from not considered to fully implemented, 0–4) with the evidence behind the judgement: a section of the specification, a file, an endpoint or the output of a test.
- **Strict reading.** Indicators about resolution and access count as met only when they have been verified against a running service; a design can describe identifiers and endpoints, but it cannot resolve them. Where an indicator could be argued either way, both readings are recorded and the lower one is used.
- **Level and count together.** An area stays at Level 0 until all of its essential indicators are fully met, so progress is reported both as the level and as the number of essential indicators met.
- **Assessment as a development loop.** The archive was re-assessed after each change: a gap became a specification, the specification was implemented, and the deployment was checked again.

## A. From assessment to specification: a metadata design (traditional dance, v10 → v12)

The document-database design of the traditional-dance archive (v10: 12 collections, 219 metadata fields) was assessed before any service existed. Its indicators averaged 2.61 out of 4, so most provisions were in progress. All the same, F, A and R stood at Level 0, because the design had no persistent identifiers, no harvesting interface, no licence or access fields and no mappings to community standards. Its strengths lay in discovery metadata, cross-references between collections and detailed 3D/4D technical metadata.

| Scenario | F | A | I | R | Mean area level |
|---|---|---|---|---|---|
| As designed (v10) | 0 | 0 | 1 | 0 | 0.25 |
| Minimum plan: 17 F and A indicators addressed (v11) | 5 | 5 | 1 | 0 | **2.75** (target 2.6) |
| Same plan, strict reading before operational verification | 0 | 0 | 1 | 0 | 0.25 |
| Schema and access-interface extension | 5 | 5 | 2 | 2 | 3.50 |

The gaps were turned into specifications: an identifier assignment and maintenance policy, global identifiers on every collection and UUIDs for files, record status and change dates for incremental harvesting, a Dublin Core mapping, and an OAI-PMH provision (Dublin Core and LIDO formats, sets per collection, a persistent deleted-record policy). They are now part of the [v12 specification](../02_chunaengjeon-4d/data-model/metadata-specification-v12.md). Nine of the 22 fully implemented indicators in v11 can only be confirmed once a service is running, which the strict row makes visible.

## B. From specification to verified deployment: a 3D/4D archive (Hansan Mosi, seven assessments)

The Hansan Mosi archive was assessed first as a database and data model (fourth assessment) and last against its public deployment (seventh, 19 October 2026). The checks against the deployment were the following:

- Record files and DCAT distributions are served with their media types.
- Records resolve by content negotiation at `/id/{ID}` (JSON-LD, Turtle or HTML), and a withdrawn record resolves as a tombstone.
- Missing paths return 404.
- There is a sitemap of 735 entries and a schema.org Dataset description.
- The sizes and SHA-256 checksums of the distributions match the catalogue.
- SHACL validation reports no violations.
- Each file is checked with a validator for its format: 508 of 520 files pass standard validators (glTF-Validator, image and video decoders), and PLY, Alembic and SPLAT files are given structural checks.

| Area | Fourth (design) | Seventh (deployed) | Remaining |
|---|---|---|---|
| F | 0 | 0 (5 of 7 essential met) | Register the `w3id.org/hansan-mosi` namespace: this alone lifts F to 5 |
| A | 0 | 0 (3 of 8 essential met) | Access route to research originals without a public copy (published since, not yet re-assessed); deposit in a trusted repository |
| I | 1 | **2** | Proprietary 4D format (4DS) limits the data-level indicators |
| R | 0 | **2** | A community provenance profile to validate against; the proprietary 4D format |

Between the two assessments, the number of fully implemented indicators rose from 7 to 24 of 41 and the mean indicator score from 2.85 to 3.50. Yet F and A remain at Level 0, because their last essential indicators depend on acts outside the code: registering a persistent namespace and depositing in a trusted repository. After the seventh assessment, access conditions were added to all 523 items and published: 488 are open, and 35 are available on request, with a named contact and HTTPS delivery after approval. This change has not yet been re-assessed.

## What 3D/4D data add to FAIR

- **Metadata advances faster than data.** In the seventh assessment, 21 of 26 metadata indicators were fully met, against 3 of 13 applicable data indicators. Large research originals, such as 4DS volumetric captures, Alembic meshes, PLY files and ProRes video, are impractical to make public. They therefore need access conditions and a request route recorded item by item, not a binary of open and closed.
- **Proprietary capture formats stop at fixity.** The 4DS volumetric format has no public specification or validator, so its files can be checksummed but not validated, which caps the data-level interoperability indicators. Open derivatives are needed alongside them, as in the per-frame PLY files and the documented web sequence format of [02](../02_chunaengjeon-4d/).
- **Paradata needs a shared profile.** The production lineage, from digitisation project to performance, asset and file, is published in RDF with mappings to PROV-O and CIDOC CRM. It has not been validated against a community provenance profile for heritage 3D, however, so the indicator for community-standard provenance stays below full implementation. Which profile to use is a question for a community, not for a single archive.
- **Licences need registries.** The Korean public-sector open licence is not in the SPDX list, so licences are given as the URIs of their official pages, with an ODRL policy for each.
- **Persistence is institutional.** The essential indicators that remain unmet concern a resolvable persistent namespace and deposit in a trusted repository, which an infrastructure must provide and a single project cannot.

## Contribution and scope

The work shows how an existing maturity model can be operationalised for 3D/4D heritage data. Its indicators become specifications, the specifications are verified against a running service, and every score is reported with its evidence and its strict reading, so that a claim of FAIRness can itself be checked. The findings locate the points where generic indicators need community-specific answers for 3D: formats, paradata provenance and access to large originals. These are questions that an infrastructure for 3D scholarly publication has to settle for all of its projects.

The scope is bounded. The assessments are self-assessments by the developer, not independent audits; they cover two Korean archives; and the scores rest on judgement, which is why the evidence and both readings are recorded. Automated evaluators such as F-UJI were not applied, and comparing them with the manual reading is a natural next step. The w3id registration and the repository deposit are still pending.

The work presented here covers the indicator-level assessments and their evidence; for the traditional-dance design, the supplementary specifications (identifier policy draft and OAI-PMH provision); and, for the Hansan Mosi archive, the FAIR export, validation and publication. Project-specific responsibilities are recorded in [CONTRIBUTIONS.md](../CONTRIBUTIONS.md).
