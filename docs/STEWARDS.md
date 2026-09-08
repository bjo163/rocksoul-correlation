# Correlation Steward Boundary

## Operational topology

The canonical scheduler/orchestration plan lives in `rocksoul-crayon`:

- machine contract: `contracts/research-steward-topology.v1.json`
- human plan: `docs/research-steward-topology.md`

Correlation mirrors only the part that constrains **RELATIONSHIP** ownership.

## Bootstrap mode

ROCKSOUL is currently in sparse-corpus bootstrap. All five available scheduled intelligence slots run **hourly**, staggered by ten minutes:

```text
:00  Ecosystem Bootstrap   → CRAYON
:10  Story-History         → MFTL → context reset → LEGEND
:20  Attestation           → RGBL → context reset → SUPERHERO
:30  LAW                   → AWS
:40  PERSPECTIVE           → JIZZ

Correlation Review        → EVENT-DRIVEN, no scheduled intelligence slot
```

Shared clocks do not imply shared canonical reasoning:

```text
MFTL PASS
→ finish
→ reset context
→ LEGEND PASS

RGBL PASS
→ finish
→ reset context
→ SUPERHERO PASS
```

## Why Correlation is not scheduled

Correlation is a downstream review layer. Scheduled relationship hunting would reward superficial similarity and create pressure to publish edges before domain evidence is mature.

Correct trigger conditions include:

- a new or changed canonical/candidate foreign reference;
- a domain review that explicitly proposes a cross-domain relation;
- new support or counterevidence for an existing edge;
- a foreign-reference freshness change requiring re-review;
- a JIZZ perspective that becomes reviewably related to STORY, EVENT, PERSON, TEXT, or LAW.

## Hourly bootstrap does not mean hourly Correlation

Every research Steward may run hourly during bootstrap. Correlation publishes only when the **relationship itself** is reviewable.

```text
DOMAIN RESEARCH CHANGE
      ↓
possible relation
      ↓
QUEUE / REVIEW
      ↓
support + counterevidence + alternatives + provenance
      ↓
RELATIONSHIP edge
```

A high-frequency source or perspective change may produce **zero** new edges.

## Bootstrap exit

Correlation does not decide when ROCKSOUL leaves bootstrap mode. That orchestration decision belongs in CRAYON. Cadence should be reassessed only after research owners have healthy non-duplicate queues, meaningful canonical baseline coverage, source diversity, and lower marginal value from another hourly discovery cycle.

## Guardrails

```text
CORRELATION ≠ DISCOVERY ENGINE
CORRELATION ≠ CAUSATION
SIMILARITY ≠ REVIEWED RELATIONSHIP
HIGH-FREQUENCY RESEARCH ≠ HIGH-FREQUENCY EDGE CREATION
RELATIONSHIP OWNER ≠ CONNECTED RECORD OWNER
```
