# Correlation Runtime API

`rocksoul-correlation` exposes a dependency-free, read-only Node.js runtime over the reviewed correlation corpus.

## Boundary

The runtime never mints STORY, EVENT, PERSON, TEXT, or LAW records. It reads correlation case files and exposes their cross-domain edges, provenance, counterevidence, alternatives, confidence, and epistemic status.

It is not a verdict engine and it must not convert correlation into causation, fulfillment, guilt, or certainty.

## Start

```bash
npm start
```

Default port: `8787` (`PORT` may override it).

## Endpoints

```text
GET /health
GET /api/v1/correlation/cases
GET /api/v1/correlation/cases/:case_id
GET /api/v1/correlation/edges
GET /api/v1/correlation/graph
```

### Edge filters

`/api/v1/correlation/edges` accepts:

- `domain=STORY|EVENT|PERSON|TEXT|LAW`
- `repository=rocksoul-*`
- `relation_type=<bounded relation>`
- `epistemic_status=SUPPORTED|PARTIAL|DISPUTED|UNRESOLVED|CONTRADICTED|INDETERMINATE`
- `min_confidence=0..1`

### Graph filter

`/api/v1/correlation/graph?case_id=CORR-CASE-JERUSALEM-70`

returns deduplicated nodes and evidence-rich edges suitable for `rocksoul-web` and `rocksoul-crayon`.

## Consumer rule

Public presentation may simplify layout, but must keep these inspectable:

```text
relation type
confidence
status
support
counterevidence
alternative explanations
source + target canonical references
```

Color alone may never encode epistemic status.
