# Correlation Steward Boundary

## Operational topology

The canonical scheduler/orchestration plan lives in `rocksoul-crayon`. Correlation mirrors only the part that constrains RELATIONSHIP ownership.

```text
1  Ecosystem Steward   → CRAYON
2  Story-History       → MFTL then LEGEND, isolated domain passes
3  Attestation         → RGBL then SUPERHERO, isolated domain passes
4  AWS Steward         → LAW dedicated
5  JIZZ Steward        → PERSPECTIVE dedicated, hourly

Correlation Review     → EVENT-DRIVEN, no scheduled intelligence slot
```

## Why Correlation is not scheduled

Correlation is a downstream review layer. Scheduled relationship hunting would reward superficial similarity and create pressure to publish edges before domain evidence is mature.

Correct trigger conditions include:

- a new or changed canonical/candidate foreign reference;
- a domain review that explicitly proposes a cross-domain relation;
- new support or counterevidence for an existing edge;
- a foreign-reference freshness change requiring re-review;
- a JIZZ perspective that becomes reviewably related to STORY, EVENT, PERSON, TEXT, or LAW.

## Hourly JIZZ does not mean hourly Correlation

JIZZ may observe PERSPECTIVE every hour. Correlation publishes only when the relationship itself is reviewable.

```text
PERSPECTIVE CHANGE
      ↓
possible relation
      ↓
QUEUE / REVIEW
      ↓
support + counterevidence + alternatives + provenance
      ↓
RELATIONSHIP edge
```

## Guardrails

```text
CORRELATION ≠ DISCOVERY ENGINE
CORRELATION ≠ CAUSATION
SIMILARITY ≠ REVIEWED RELATIONSHIP
HIGH-FREQUENCY OBSERVATION ≠ HIGH-FREQUENCY EDGE CREATION
RELATIONSHIP OWNER ≠ CONNECTED RECORD OWNER
```
