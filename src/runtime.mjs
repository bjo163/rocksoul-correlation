import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const casesDir = path.join(root, "data", "cases")

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"))
}

export async function loadCases() {
  const files = (await readdir(casesDir)).filter((name) => name.endsWith(".json")).sort()
  return Promise.all(files.map((name) => readJson(path.join(casesDir, name))))
}

export function summarizeCase(item) {
  const domains = new Set()
  const statuses = new Set()
  for (const edge of item.edges ?? []) {
    domains.add(edge.source_ref.domain)
    domains.add(edge.target_ref.domain)
    statuses.add(edge.epistemic_status)
  }
  return {
    case_id: item.case_id,
    title: item.title,
    status: item.status,
    description: item.description,
    edge_count: item.edges?.length ?? 0,
    domains: [...domains].sort(),
    epistemic_statuses: [...statuses].sort(),
  }
}

export async function listCases() {
  return (await loadCases()).map(summarizeCase)
}

export async function getCase(caseId) {
  return (await loadCases()).find((item) => item.case_id === caseId) ?? null
}

export async function listEdges(filters = {}) {
  const edges = (await loadCases()).flatMap((item) =>
    (item.edges ?? []).map((edge) => ({ case_id: item.case_id, case_title: item.title, ...edge })),
  )
  return edges.filter((edge) => {
    if (filters.domain && edge.source_ref.domain !== filters.domain && edge.target_ref.domain !== filters.domain) return false
    if (filters.relation_type && edge.relation_type !== filters.relation_type) return false
    if (filters.epistemic_status && edge.epistemic_status !== filters.epistemic_status) return false
    if (filters.repository && edge.source_ref.repository !== filters.repository && edge.target_ref.repository !== filters.repository) return false
    if (filters.min_confidence != null && edge.confidence < Number(filters.min_confidence)) return false
    return true
  })
}

export async function graph(caseId = null) {
  const cases = caseId ? [await getCase(caseId)].filter(Boolean) : await loadCases()
  const nodes = new Map()
  const edges = []
  for (const item of cases) {
    for (const edge of item.edges ?? []) {
      for (const ref of [edge.source_ref, edge.target_ref]) {
        const id = `${ref.repository}:${ref.record_id}`
        if (!nodes.has(id)) nodes.set(id, { id, ...ref })
      }
      edges.push({
        id: edge.id,
        case_id: item.case_id,
        source: `${edge.source_ref.repository}:${edge.source_ref.record_id}`,
        target: `${edge.target_ref.repository}:${edge.target_ref.record_id}`,
        relation_type: edge.relation_type,
        confidence: edge.confidence,
        epistemic_status: edge.epistemic_status,
        support: edge.support,
        counterevidence: edge.counterevidence,
        alternative_explanations: edge.alternative_explanations,
      })
    }
  }
  return { nodes: [...nodes.values()], edges }
}
