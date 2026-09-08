import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadFreshnessSnapshot } from "./freshness.mjs"\nimport { toQualifiedReference } from "./qualified-ref.mjs"

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

export async function listCases(filters = {}) {
  const items = (await loadCases()).map(summarizeCase)
  const q = normalizeQuery(filters.q)
  return items.filter((item) => {
    if (filters.domain && !item.domains.includes(filters.domain)) return false
    if (filters.epistemic_status && !item.epistemic_statuses.includes(filters.epistemic_status)) return false
    if (q && !`${item.case_id} ${item.title} ${item.description}`.toLowerCase().includes(q)) return false
    return true
  })
}

export async function getCase(caseId) {
  return (await loadCases()).find((item) => item.case_id === caseId) ?? null
}

function normalizeQuery(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function searchableEdge(edge) {
  return [
    edge.id,
    edge.case_id,
    edge.case_title,
    edge.relation_type,
    edge.epistemic_status,
    edge.source_ref.repository,
    edge.source_ref.domain,
    edge.source_ref.record_id,
    edge.target_ref.repository,
    edge.target_ref.domain,
    edge.target_ref.record_id,
    ...(edge.support ?? []),
    ...(edge.counterevidence ?? []),
    ...(edge.alternative_explanations ?? []),
    ...(edge.sources ?? []),
    edge.notes ?? "",
  ].join(" ").toLowerCase()
}

export async function listEdges(filters = {}) {
  const q = normalizeQuery(filters.q)
  const edges = (await loadCases()).flatMap((item) =>
    (item.edges ?? []).map((edge) => ({ case_id: item.case_id, case_title: item.title, ...edge })),
  )
  return edges.filter((edge) => {
    if (filters.case_id && edge.case_id !== filters.case_id) return false
    if (filters.domain && edge.source_ref.domain !== filters.domain && edge.target_ref.domain !== filters.domain) return false
    if (filters.relation_type && edge.relation_type !== filters.relation_type) return false
    if (filters.epistemic_status && edge.epistemic_status !== filters.epistemic_status) return false
    if (filters.repository && edge.source_ref.repository !== filters.repository && edge.target_ref.repository !== filters.repository) return false
    if (filters.min_confidence != null && edge.confidence < Number(filters.min_confidence)) return false
    if (q && !searchableEdge(edge).includes(q)) return false
    return true
  })
}

function nodeId(ref) {
  return `${ref.repository}:${ref.record_id}`
}

export async function graph(caseId = null) {
  const cases = caseId ? [await getCase(caseId)].filter(Boolean) : await loadCases()
  const nodes = new Map()
  const edges = []
  for (const item of cases) {
    for (const edge of item.edges ?? []) {
      for (const ref of [edge.source_ref, edge.target_ref]) {
        const id = nodeId(ref)
        if (!nodes.has(id)) nodes.set(id, { id, qualified_ref: toQualifiedReference(ref), ...ref })
      }
      edges.push({
        id: edge.id,
        case_id: item.case_id,
        source: nodeId(edge.source_ref),
        target: nodeId(edge.target_ref),
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

export async function getNode(id) {
  const result = await graph()
  return result.nodes.find((node) => node.id === id) ?? null
}

export async function neighbors(id, options = {}) {
  const maxDepth = Math.max(1, Math.min(Number(options.depth ?? 1), 3))
  const maxNodes = Math.max(1, Math.min(Number(options.max_nodes ?? 50), 100))
  const direction = ["in", "out", "both"].includes(options.direction) ? options.direction : "both"
  const result = await graph()
  if (!result.nodes.some((node) => node.id === id)) return null

  const visited = new Set([id])
  const includedEdges = new Map()
  let frontier = [id]

  for (let depth = 0; depth < maxDepth && frontier.length > 0 && visited.size < maxNodes; depth += 1) {
    const next = []
    for (const current of frontier) {
      for (const edge of result.edges) {
        const outgoing = edge.source === current
        const incoming = edge.target === current
        if ((direction === "out" && !outgoing) || (direction === "in" && !incoming) || (direction === "both" && !outgoing && !incoming)) continue
        const other = outgoing ? edge.target : edge.source
        includedEdges.set(edge.id, edge)
        if (!visited.has(other) && visited.size < maxNodes) {
          visited.add(other)
          next.push(other)
        }
      }
    }
    frontier = next
  }

  return {
    root: id,
    depth: maxDepth,
    direction,
    truncated: visited.size >= maxNodes,
    nodes: result.nodes.filter((node) => visited.has(node.id)),
    edges: [...includedEdges.values()].filter((edge) => visited.has(edge.source) && visited.has(edge.target)),
  }
}

export async function findPath(sourceId, targetId, options = {}) {
  const maxDepth = Math.max(1, Math.min(Number(options.max_depth ?? 4), 6))
  const result = await graph()
  const nodeIds = new Set(result.nodes.map((node) => node.id))
  if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return null
  if (sourceId === targetId) return { nodes: [sourceId], edges: [] }

  const adjacency = new Map()
  for (const edge of result.edges) {
    for (const [from, to] of [[edge.source, edge.target], [edge.target, edge.source]]) {
      if (!adjacency.has(from)) adjacency.set(from, [])
      adjacency.get(from).push({ node: to, edge })
    }
  }

  const queue = [{ node: sourceId, nodes: [sourceId], edges: [] }]
  const bestDepth = new Map([[sourceId, 0]])
  while (queue.length > 0) {
    const item = queue.shift()
    if (item.edges.length >= maxDepth) continue
    for (const next of adjacency.get(item.node) ?? []) {
      const depth = item.edges.length + 1
      if ((bestDepth.get(next.node) ?? Infinity) < depth) continue
      const candidate = { node: next.node, nodes: [...item.nodes, next.node], edges: [...item.edges, next.edge] }
      if (next.node === targetId) return { nodes: candidate.nodes, edges: candidate.edges }
      bestDepth.set(next.node, depth)
      queue.push(candidate)
    }
  }
  return { nodes: [], edges: [] }
}

export async function provenanceForNode(id) {
  const node = await getNode(id)
  if (!node) return null
  const snapshot = await loadFreshnessSnapshot()
  const owner = snapshot.repositories[node.repository]
  return {
    node,
    owner_repository: node.repository,
    owner_domain: node.domain,
    owner_branch: owner?.branch ?? "main",
    observed_head_sha: owner?.observed_head_sha ?? null,
    owner_url: `https://github.com/bjo163/${node.repository}`,
    record_resolution: node.resolution ?? "canonical",\n    qualified_reference: node.qualified_ref ?? toQualifiedReference(node),
    freshness_policy: snapshot.policy,
  }
}

export async function provenanceForEdge(edgeId) {
  const edge = (await listEdges()).find((item) => item.id === edgeId)
  if (!edge) return null
  return {
    edge,
    source: await provenanceForNode(nodeId(edge.source_ref)),
    target: await provenanceForNode(nodeId(edge.target_ref)),
  }
}
