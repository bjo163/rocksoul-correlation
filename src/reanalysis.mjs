import { auditFreshness } from "./freshness.mjs"
import { loadCases } from "./runtime.mjs"

export async function buildReanalysisQueue({ fetchImpl = fetch } = {}) {
  const freshness = await auditFreshness({ fetchImpl })
  const byRepo = new Map(freshness.repositories.map(item => [item.repository,item]))
  const affected = new Set(freshness.repositories.filter(item => item.freshness !== "CURRENT").map(item => item.repository))
  const cases = await loadCases()
  const items = []

  for (const item of cases) {
    for (const edge of item.edges ?? []) {
      const repos = [...new Set([edge.source_ref.repository,edge.target_ref.repository].filter(repo => affected.has(repo)))]
      if (!repos.length) continue
      items.push({
        case_id: item.case_id,
        case_title: item.title,
        edge_id: edge.id,
        relation_type: edge.relation_type,
        epistemic_status: edge.epistemic_status,
        affected_repositories: repos.map(repository => ({
          repository,
          freshness: byRepo.get(repository)?.freshness ?? "UNAVAILABLE",
          observed_head_sha: byRepo.get(repository)?.observed_head_sha ?? null,
          current_head_sha: byRepo.get(repository)?.current_head_sha ?? null,
        })),
        action: "REVIEW_DEPENDENT_EDGE",
        guardrail: "Upstream movement triggers review; it does not automatically invalidate the edge or strengthen/weaken its epistemic status.",
      })
    }
  }

  return {
    generated_at: freshness.generated_at,
    freshness_counts: freshness.counts,
    review_item_count: items.length,
    items,
  }
}
