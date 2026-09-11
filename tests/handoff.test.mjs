import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { reviewRelationshipHandoff } from "../src/handoff.mjs";

const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/handoffs/fixtures/scheduler-v2-jerusalem.json"), "utf8"));

test("real Jerusalem convergence handoff is queued without creating an edge", () => {
  const result = reviewRelationshipHandoff(fixture.positive);
  assert.equal(result.accepted_for_review, true);
  assert.equal(result.review_status, "PENDING_CORRELATION_REVIEW");
  assert.equal(result.canonical_edge_created, false);
});

test("semantic similarity alone is held even when refs are real", () => {
  const result = reviewRelationshipHandoff(fixture.negative);
  assert.equal(result.accepted_for_review, false);
  assert.equal(result.review_status, "HELD");
  assert.equal(result.canonical_edge_created, false);
  assert.ok(result.reasons.includes("similarity_only_is_insufficient"));
});

test("producer cannot pre-accept a canonical relationship", () => {
  const result = reviewRelationshipHandoff({ ...fixture.positive, review_status: "ACCEPTED" });
  assert.equal(result.accepted_for_review, false);
  assert.equal(result.canonical_edge_created, false);
  assert.ok(result.reasons.includes("producer_cannot_preaccept_relationship"));
});

test("qualified source and target plus counterevidence and alternatives are mandatory", () => {
  const bad = { ...fixture.positive, source_ref: "not-qualified", counterevidence: [], alternative_relations: [] };
  const result = reviewRelationshipHandoff(bad);
  assert.equal(result.accepted_for_review, false);
  assert.ok(result.reasons.includes("qualified_refs_required"));
  assert.ok(result.reasons.includes("counterevidence_required"));
  assert.ok(result.reasons.includes("alternative_relations_required"));
});
