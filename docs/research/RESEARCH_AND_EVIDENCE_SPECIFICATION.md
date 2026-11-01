# Research and Evidence Specification

**Status: PROPOSED.** Research assertions are inspectable, attributable and revisable; publication does not make an assertion universally true.

## Core model

- **Question:** bounded inquiry, scope, owner and intended method.
- **Claim:** proposition with subject/predicate/object or explicit text, domain/type and attribution.
- **Evidence:** source passage, witness, dataset, observation, event record or other explicitly typed record.
- **Evidence relation:** supports, challenges, contextualizes, derives from, or is irrelevant to a claim; direction and rationale required.
- **Method:** named, versioned method/rubric; Mizan can provide a method reference.
- **Assessment:** evaluator, method version, evidence considered, reasoning, confidence/uncertainty, date and status.
- **Review/publication:** human workflow separate from assessment content and source rights.

Research addon owns claims, links and assessments. Source/corpus/person/event owners retain their own records. A `CORRELATION` relationship is not evidence of causation or truth. Exact source, translation, user interpretation and AI summary remain distinct.

## Required properties

Attribution; source/version locator; provenance; rights state; scope and temporal context; method/assessor; uncertainty and known limitations; conflicts or counter-evidence; revision history; review state; publication state. Store reviewer rationale for material approval/rejection decisions.

## Mizan and RGBL overlap resolution

RGBL/`ql_corpus` owns corpus text and structural records. Mizan owns a named method/rubric and versions if approved. Research owns each claim evaluation and applied assessment. This avoids parallel “truth score” or quality verdict tables. Exact source projects and specs need content audit before adopting terminology or methods.

### Source-method audit evidence (not acceptance)

The inspected private Gen2 method packages expose deterministic pure functions, not canonical research records or APIs: `moonwitness-cosmic` at `916fabbf0f0844a719e4cc0eb67a4aa75de538eb` compares explicit ISO instants, builds a semantic weight vector marked `normativeAuthority: false`, and maps numeric values to legacy Mizan severity bands; `moonwitness-crayon` at `104b4c43a35456c5644f243beb82162ac7d89be9` validates 0–4 study scores and reports descriptive arm differences or scenario stability while explicitly disclaiming causal/correctness claims. `moonwitness-prophetic` at `bff17226c3c52fb0118443945a9baa03e74756e8` exports a one-source-per-slot resolver; its README describes a separate internal, non-canonical R&D evaluator and rejects revelation/theology authority. These are historical methods and safety boundaries, not adopted product policy. Any accepted use must record method/version, inputs, source lane, evaluator, limits and human review in the owning addon; tests, fixtures, rights and methodological validity remain unverified here.

The public `moonwitness-wheremythfadetolegend` source at `db22782f7f7e3f6563895caac8afe69a42980717` is a separate static observatory with practice-level Tawhid-gap scores/labels, named community observations, and a deterministic weighted temporal/geographic proximity function. Its source explicitly says proximity is not causal proof and stores reviewed causality scores separately. That safeguard is useful evidence, but neither its numerical thresholds nor the normative practice ratings establish scientific validity or theological consensus. Any accepted use needs an explicit, versioned method, source perspective, qualified reviewers, counter-evidence, correction/dispute path and source-level rights; never promote group-level ratings from repository values.

The same repo's monitor source is a distinct candidate-discovery method: the scheduled RSS collector stores raw headline/URL/description/query metadata, and a keyword classifier emits only `DISCOVERED` candidates without setting theological verdicts. The workflow has `contents: write` and pushes those candidate files directly, so repository-publication policy and source retention need review. `data/monitor/README.md`, `intelligence-policy.json`, and `classify-signals.mjs` also declare different stage vocabularies; select one canonical lifecycle and preserve a human source-check/evaluation boundary before adopting the process.

## AI restrictions

AI output is an attributed suggestion with model/tool/version and source references where available. It cannot silently create/approve a canonical claim, overwrite text, publish, or issue religious/historical final authority. A human action and review trail are required for canonical state change.

## Open decisions

Claim ontology; confidence representation; evidence-quality rubric; acceptable source hierarchy; dispute handling; public status vocabulary; version/correction policy. Ratify before implementing assessment semantics.
