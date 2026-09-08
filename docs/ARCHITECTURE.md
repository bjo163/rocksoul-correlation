# Rocksoul Correlation Architecture

## Purpose

`rocksoul-correlation` is the public cross-domain evidence graph for MoonWitness × Rocksoul. It connects records and candidate bindings across STORY, EVENT, PERSON, TEXT, LAW, and PERSPECTIVE while preserving provenance, disagreement, uncertainty, and source ownership.

## Ownership contract

| Domain | Canonical repository |
|---|---|
| STORY | `rocksoul-mftl` |
| EVENT | `rocksoul-legend` |
| PERSON | `rocksoul-superhero` |
| TEXT | `rocksoul-rgbl` |
| LAW | `rocksoul-aws` |
| PERSPECTIVE | `rocksoul-jizz` |
| RELATIONSHIP | `rocksoul-correlation` |

Correlation owns only the edge and its analysis metadata. It must not duplicate, mint on behalf of, or silently fork canonical domain records.

## Reference lifecycle

Every foreign reference is either:

- `canonical` — stable source record already published by the owning repository;
- `candidate` — proposed owner-repo binding for a real-world case that still requires the source repository to mint/review the record.

Candidate status is part of provenance. It is not an implementation detail and must remain visible to consumers.

```text
REAL-WORLD LEAD
      ↓
CANDIDATE BINDING
      ↓
OWNER REPOSITORY REVIEW
      ↓
STABLE RECORD ID
      ↓
CORRELATION PROMOTION
      ↓
REVALIDATE EDGE
```

Correlation must never make a candidate look canonical merely to produce a complete-looking graph.

## Edge semantics

An edge is a claim about the relationship between two foreign records or candidate bindings. Every edge preserves:

- source and target references plus resolution state;
- explicit relation type;
- directionality;
- supporting observations;
- counterevidence;
- alternative explanations;
- dimension-level scores;
- combined confidence;
- epistemic state;
- source/provenance pointers.

## Scores are not truth

Dimension and confidence values exist for ordering, filtering, comparison, and explainability. They do not replace evidence text and must not be presented without the underlying rationale.

No score may imply moral worth, sanctity, guilt, innocence, religious truth, or human value.

## Correlation dimensions

### Temporal
How compatible are the dates, time ranges, or sequencing of the two records?

### Geographic
How compatible are the places, regions, routes, or spatial claims?

### Semantic
How closely does the meaning/content under comparison correspond?

### Identity
How plausible is it that the records refer to the same actor, object, event, text unit, place, or legal subject where identity is relevant?

### Provenance
How traceable and independent is the evidence chain connecting the records?

## Counterevidence is first-class

A mature edge does not contain only reasons to believe the relation. Counterevidence and alternative explanations remain visible and machine-readable.

```text
CLAIMED RELATION
├── support
├── counterevidence
├── alternative explanation A
├── alternative explanation B
└── unresolved uncertainty
```

Guarded states (`PARTIAL`, `DISPUTED`, `UNRESOLVED`, `CONTRADICTED`, `INDETERMINATE`) must expose counterevidence and/or alternatives.

## Legal boundary

A `legally_relevant_to` edge may describe applicability, jurisdictional predicates, temporal/legal fit, or another bounded legal relation. It must never be presented as a court finding, guilt determination, liability judgment, or complete legal conclusion.

LAW remains canonically owned by `rocksoul-aws`.

## Public/private boundary

Public:

- reviewed canonical edges;
- visibly marked candidate edges;
- source references;
- evidence summaries;
- counterevidence;
- uncertainty;
- relation semantics;
- reproducible validation contracts.

Private/operator scope:

- unpublished hypotheses;
- private submissions;
- moderation notes;
- credentials;
- internal operational state;
- temporary AI scratch work.

Private/operator scope belongs in `rocksoul-crayon` or `rocksoul-platform` until reviewed for publication.

## Consumer model

`rocksoul-web` consumes public graph projections. `rocksoul-crayon` consumes richer operator projections and manages candidate-review workflows. `rocksoul-ui` provides the visual/component grammar. `rocksoul-assets` remains the visual source of truth.

A future Mizan engine may consume reviewed correlation graphs, but Correlation must not pre-compute or masquerade as the Mizan verdict layer.

## Anti-patterns

Do not:

- infer causation from similarity alone;
- infer supernatural fulfillment from text-event correspondence alone;
- infer intent from outcome alone;
- treat witness proximity as infallibility;
- flatten disputed scholarship into a single certainty score;
- invent a canonical identifier and pretend the owner minted it;
- copy entire foreign records into this repository;
- hide counterevidence to improve a score;
- use correlation confidence as a moral score;
- turn legal relevance into guilt or judgment.

## Steward / scheduling boundary

The operational Steward topology is owned by `rocksoul-crayon`. Correlation is deliberately **event-driven** and receives no scheduled discovery Steward slot.

```text
DOMAIN DISCOVERY / REVIEW
      ↓
domain-owned candidate or canonical record
      ↓
cross-domain relationship becomes reviewable
      ↓
CORRELATION REVIEW
      ↓
reviewed RELATIONSHIP edge
```

Do not schedule a Correlation agent to hunt for relationships by similarity. Deterministic freshness checks are allowed and do not count as Steward intelligence.

JIZZ may run hourly because PERSPECTIVE is high-velocity. Correlation must still wait for reviewable support, counterevidence, alternatives, and provenance before publishing an edge.
