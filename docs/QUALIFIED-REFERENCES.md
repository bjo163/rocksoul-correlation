# Qualified Reference Protocol v0.1

Canonical cross-repository notation:

```text
mftl:<record-id>       STORY
legend:<record-id>     EVENT
superhero:<record-id>  PERSON
rgbl:<record-id>       TEXT
aws:<record-id>        LAW
```

A qualified reference resolves to an envelope containing the owner repository, domain, stable record ID, resolution state, owner branch, reviewed owner-head snapshot, and owner URL.

## Rules

1. The prefix identifies **ownership**, not a copy namespace.
2. Record IDs are never rewritten simply to make another repository look uniform.
3. Name similarity never auto-merges identities.
4. `candidate` and `canonical` resolution states remain visible.
5. Owner movement triggers re-analysis of dependent edges.
6. Qualified-reference resolution never changes the edge epistemic status by itself.

The protocol accepts old `rocksoul-<repo>:` prefixes when reading legacy data and normalizes them to the short form when responding.
