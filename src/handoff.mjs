const REQUIRED_FIELDS = [
  "schema_version", "handoff_id", "created_at", "origin_domain", "origin_repository", "origin_issue",
  "source_ref", "target_ref", "proposed_relation_type", "support", "counterevidence", "alternative_relations",
  "confidence", "freshness_state", "review_status"
];

const PRODUCER_DOMAINS = new Set(["STORY", "EVENT", "TEXT", "PERSON", "LAW", "PERSPECTIVE"]);

function missingFields(handoff) {
  return REQUIRED_FIELDS.filter((field) => handoff?.[field] === undefined || handoff?.[field] === null);
}

function qualifiedRef(value) {
  return typeof value === "string" && /^rocksoul:\/\/bjo163\/rocksoul-[a-z0-9-]+\/(STORY|EVENT|TEXT|PERSON|LAW|PERSPECTIVE)\//.test(value);
}

function similarityOnly(support = []) {
  if (!Array.isArray(support) || support.length === 0) return false;
  return support.every((item) => /similar|embedding|same[- ]?name|same[- ]?url|semantic|co-?occurr/i.test(String(item)));
}

export function reviewRelationshipHandoff(handoff = {}) {
  const reasons = [];
  const missing = missingFields(handoff);
  if (missing.length) reasons.push(`missing_fields:${missing.join(",")}`);
  if (handoff.schema_version !== "rocksoul.relationship-handoff.v1") reasons.push("schema_version_mismatch");
  if (!PRODUCER_DOMAINS.has(handoff.origin_domain)) reasons.push("invalid_origin_domain");
  if (!qualifiedRef(handoff.source_ref) || !qualifiedRef(handoff.target_ref)) reasons.push("qualified_refs_required");
  if (handoff.source_ref === handoff.target_ref) reasons.push("source_target_must_differ");
  if (!Array.isArray(handoff.support) || handoff.support.length === 0) reasons.push("support_required");
  if (!Array.isArray(handoff.counterevidence) || handoff.counterevidence.length === 0) reasons.push("counterevidence_required");
  if (!Array.isArray(handoff.alternative_relations) || handoff.alternative_relations.length === 0) reasons.push("alternative_relations_required");
  if (similarityOnly(handoff.support)) reasons.push("similarity_only_is_insufficient");
  if (handoff.review_status === "ACCEPTED") reasons.push("producer_cannot_preaccept_relationship");
  if (typeof handoff.confidence !== "number" || handoff.confidence < 0 || handoff.confidence > 1) reasons.push("confidence_out_of_range");

  if (reasons.length) {
    return {
      accepted_for_review: false,
      review_status: reasons.includes("similarity_only_is_insufficient") ? "HELD" : "REJECTED",
      canonical_edge_created: false,
      reasons
    };
  }

  return {
    accepted_for_review: true,
    review_status: "PENDING_CORRELATION_REVIEW",
    canonical_edge_created: false,
    reasons: []
  };
}

export function renderRelationshipHandoffReview(result) {
  return result.accepted_for_review
    ? `Relationship handoff queued for event-driven Correlation review; canonical edge created=${result.canonical_edge_created}.`
    : `Relationship handoff ${result.review_status.toLowerCase()}: ${result.reasons.join(", ")}; canonical edge created=${result.canonical_edge_created}.`;
}
