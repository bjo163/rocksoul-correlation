# Contributing to Rocksoul Correlation

Rocksoul Correlation is a public evidence graph. Contributions must optimize for traceability, not persuasion.

## Before adding an edge

Check the owning repositories first:

- STORY → `rocksoul-mftl`
- EVENT → `rocksoul-legend`
- PERSON → `rocksoul-superhero`
- TEXT → `rocksoul-rgbl`
- LAW → `rocksoul-aws`

If the source record already exists with a stable ID, use `resolution: "canonical"` (or omit the field, which defaults to canonical).

If the record does not yet exist, use `resolution: "candidate"`. Do not invent a source record and present it as canonical.

## Edge review checklist

A publishable edge must answer all of these:

- What exact relation is claimed?
- Which repository owns each endpoint?
- What supports the relation?
- What weakens it?
- What alternative explanations remain?
- How strong are temporal, geographic, semantic, identity, and provenance dimensions?
- What does the confidence number mean in this specific edge?
- Which inspectable sources support the claim?
- Is uncertainty visible in both machine data and human-readable notes?

## Forbidden shortcuts

Do not encode any of the following as if correlation alone proved them:

```text
correlation → causation
correspondence → fulfillment
witness → infallibility
similarity → identity
legal relevance → guilt
confidence → truth
popularity → evidence
```

## Legal edges

`legally_relevant_to` edges must include LAW and an explicit note that the edge concerns applicability or legal relevance, not a court judgment, liability determination, or guilt finding.

## Candidate promotion

A candidate reference may be promoted to canonical only after the owning repository publishes the referenced record with a stable identifier.

Promotion steps:

1. verify the owner repository and stable record ID;
2. update the correlation ref from `candidate` to `canonical`;
3. verify the edge sources still support the relation;
4. re-run `npm run validate`;
5. review whether confidence or epistemic status should change because provenance improved.

## Validation

```bash
npm run validate
```

CI must be green before a correlation change is treated as publishable.
