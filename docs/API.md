# Correlation Runtime API v0.5

Public read-only API for querying and traversing the MoonWitness × Rocksoul evidence graph.

## Principles

- CORRELATION owns edges, never canonical STORY / EVENT / PERSON / TEXT / LAW records.
- Search results preserve support, counterevidence, alternatives and epistemic status.
- Graph traversal is bounded. Neighborhood depth is capped at 3 and path depth at 6.
- Freshness is conservative: owner-repository movement produces `STALE_REVIEW_REQUIRED`, never automatic invalidation.

## Endpoints

### `GET /health`

Service identity and runtime version.

### `GET /api/v1/correlation/cases`

Optional query parameters:

- `q` — case-id/title/description text search
- `domain`
- `epistemic_status`

### `GET /api/v1/correlation/cases/:case_id`

Full reviewed case with original evidence edges.

### `GET /api/v1/correlation/edges`

Optional query parameters:

- `q` — searches IDs, refs, evidence, counterevidence, alternative explanations, sources and notes
- `case_id`
- `domain`
- `repository`
- `relation_type`
- `epistemic_status`
- `min_confidence`

### `GET /api/v1/correlation/graph?case_id=...`

Returns deduplicated nodes and explainable edges. Without `case_id`, returns the complete reviewed graph.

### `GET /api/v1/correlation/nodes/:node_id/neighbors`

Bounded graph neighborhood.

Parameters:

- `depth=1..3`
- `max_nodes=1..100`
- `direction=in|out|both`

Response includes `truncated` when the node cap is reached.

### `GET /api/v1/correlation/path?source=...&target=...`

Returns one shortest inspectable undirected graph path within `max_depth`.

- `max_depth=1..6`

This is graph connectivity, not causal inference.

### `GET /api/v1/correlation/nodes/:node_id/provenance`

Returns canonical owner repository/domain, record resolution, observed owner HEAD and owner link. It does not copy the canonical record.

### `GET /api/v1/correlation/edges/:edge_id/provenance`

Returns edge plus source and target provenance envelopes.

### `GET /api/v1/correlation/freshness`

Checks current owner-repository `main` heads against `data/provenance-snapshots.json`.

Possible states:

- `CURRENT` — current owner head equals the reviewed snapshot.
- `STALE_REVIEW_REQUIRED` — owner repository moved since the last review snapshot. The dependent correlation must be reviewed again.
- `UNAVAILABLE` — upstream state could not be checked.

`STALE_REVIEW_REQUIRED` does **not** mean the canonical record changed or the correlation is false. It means freshness can no longer be assumed.

## Consumer contract

WEB may present reviewed/public graph state. CRAYON may proxy, filter and orchestrate review workflows. Neither consumer may silently convert a stale or disputed edge into a stronger epistemic claim.


### `GET /api/v1/correlation/refs/resolve?ref=...`

Resolves the qualified-reference envelope without copying the owner record. Canonical short prefixes are:

`mftl:` · `legend:` · `superhero:` · `rgbl:` · `aws:`

Repository-name aliases are accepted for backwards compatibility, but responses normalize to the short prefix.

### `GET /api/v1/correlation/reanalysis`

Returns exact reviewed cases/edges that require re-review because an owner repository is stale or unavailable. Upstream movement is a review trigger, **not an automatic verdict change**.
