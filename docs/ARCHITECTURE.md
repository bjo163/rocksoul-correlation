# Rocksoul Correlation Architecture

## Purpose

`rocksoul-correlation` is the public cross-domain evidence graph for MoonWitness × Rocksoul. It connects canonical foreign records from STORY, EVENT, PERSON, TEXT, and LAW while preserving provenance, disagreement, and uncertainty.

## Ownership contract

| Domain | Canonical repository |
|---|---|
| STORY | `rocksoul-mftl` |
| EVENT | `rocksoul-legend` |
| PERSON | `rocksoul-superhero` |
| TEXT | `rocksoul-rgbl` |
| LAW | `rocksoul-aws` |
| CORRELATION | `rocksoul-correlation` |

Correlation owns only the edge and its analysis metadata. It must not duplicate or silently fork canonical domain records.

## Edge semantics

An edge is a claim about the relationship between two foreign records. Every edge must preserve:

- source and target foreign references;
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

A mature edge does not contain only reasons to believe the relation. Counterevidence and alternative explanations must remain visible and machine-readable.

```text
CLAIMED RELATION
├── support
├── counterevidence
├── alternative explanation A
├── alternative explanation B
└── unresolved uncertainty
```

## Public/private boundary

Public:

- reviewed correlation edges;
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

`rocksoul-web` consumes public graph projections. `rocksoul-crayon` consumes richer operator projections. `rocksoul-ui` provides the visual/component grammar. `rocksoul-assets` remains the visual source of truth.

A future Mizan engine may consume reviewed correlation graphs, but Correlation must not pre-compute or masquerade as the Mizan verdict layer.

## Anti-patterns

Do not:

- infer causation from similarity alone;
- infer supernatural fulfillment from text-event correspondence alone;
- infer intent from outcome alone;
- treat witness proximity as infallibility;
- flatten disputed scholarship into a single certainty score;
- invent missing canonical identifiers;
- copy entire foreign records into this repository;
- hide counterevidence to improve a score;
- use correlation confidence as a moral score.
