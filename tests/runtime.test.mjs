import assert from "node:assert/strict"
import test from "node:test"
import {
  findPath,
  getCase,
  graph,
  listCases,
  listEdges,
  neighbors,
  provenanceForEdge,
  provenanceForNode,
} from "../src/runtime.mjs"
import { auditFreshness, loadFreshnessSnapshot } from "../src/freshness.mjs"
import { parseQualifiedReference, resolveQualifiedReference, toQualifiedReference } from "../src/qualified-ref.mjs"
import { buildReanalysisQueue } from "../src/reanalysis.mjs"
import { createCorrelationServer } from "../src/server.mjs"

test("runtime exposes the five golden cases", async () => {
  const cases = await listCases()
  assert.equal(cases.length, 5)
  assert.ok(cases.every((item) => item.case_id.startsWith("CORR-CASE-")))
  assert.ok(cases.some((item) => item.domains.includes("LAW")))
  assert.ok(cases.some((item) => item.domains.includes("TEXT")))
})

test("case lookup preserves evidence and uncertainty", async () => {
  const item = await getCase("CORR-CASE-JERUSALEM-70")
  assert.ok(item)
  assert.ok(item.edges.length >= 3)
  assert.ok(item.edges.some((edge) => edge.counterevidence.length > 0))
  assert.ok(item.edges.some((edge) => edge.alternative_explanations.length > 0))
})

test("query filters search both metadata and evidence text", async () => {
  const law = await listEdges({ domain: "LAW" })
  assert.ok(law.length >= 1)
  assert.ok(law.every((edge) => edge.source_ref.domain === "LAW" || edge.target_ref.domain === "LAW"))

  const supported = await listEdges({ epistemic_status: "SUPPORTED", min_confidence: "0.8" })
  assert.ok(supported.length >= 1)
  assert.ok(supported.every((edge) => edge.epistemic_status === "SUPPORTED" && edge.confidence >= 0.8))

  const textSearch = await listEdges({ q: "supernatural fulfillment" })
  assert.ok(textSearch.some((edge) => edge.case_id === "CORR-CASE-JERUSALEM-70"))

  const caseSearch = await listCases({ q: "temple" })
  assert.ok(caseSearch.some((item) => item.case_id === "CORR-CASE-JERUSALEM-70"))
})

test("graph deduplicates canonical nodes", async () => {
  const result = await graph("CORR-CASE-JERUSALEM-70")
  assert.ok(result.nodes.length >= 4)
  assert.ok(result.edges.length >= 3)
  assert.equal(new Set(result.nodes.map((node) => node.id)).size, result.nodes.length)
})

test("bounded neighborhood traversal never exceeds requested limits", async () => {
  const full = await graph("CORR-CASE-JERUSALEM-70")
  const root = full.nodes[0].id
  const result = await neighbors(root, { depth: 99, max_nodes: 2, direction: "both" })
  assert.ok(result)
  assert.equal(result.depth, 3)
  assert.ok(result.nodes.length <= 2)
  assert.equal(result.truncated, true)
})

test("bounded path traversal returns an inspectable edge trail", async () => {
  const full = await graph("CORR-CASE-JERUSALEM-70")
  const source = full.edges[0].source
  const target = full.edges.at(-1).target
  const result = await findPath(source, target, { max_depth: 6 })
  assert.ok(result)
  assert.ok(result.nodes.length >= 2)
  assert.equal(result.nodes[0], source)
  assert.equal(result.nodes.at(-1), target)
  assert.ok(result.edges.length <= 6)
})

test("provenance resolves node and edge owners without copying canonical records", async () => {
  const full = await graph("CORR-CASE-JERUSALEM-70")
  const node = await provenanceForNode(full.nodes[0].id)
  assert.ok(node)
  assert.ok(node.owner_repository.startsWith("rocksoul-"))
  assert.ok(node.owner_url.includes(node.owner_repository))
  assert.ok(node.observed_head_sha)

  const edge = await provenanceForEdge(full.edges[0].id)
  assert.ok(edge)
  assert.ok(edge.source.owner_repository)
  assert.ok(edge.target.owner_repository)
})

test("freshness audit marks upstream movement stale-for-review instead of invalid", async () => {
  const snapshot = await loadFreshnessSnapshot()
  const fakeFetch = async (url) => {
    const repo = Object.keys(snapshot.repositories).find((name) => url.includes(`/${name}/`))
    const observed = snapshot.repositories[repo].observed_head_sha
    const sha = repo === "rocksoul-mftl" ? "changed-head" : observed
    return new Response(JSON.stringify({ commit: { sha } }), { status: 200, headers: { "content-type": "application/json" } })
  }
  const result = await auditFreshness({ fetchImpl: fakeFetch })
  assert.equal(result.repositories.length, 5)
  assert.equal(result.counts.STALE_REVIEW_REQUIRED, 1)
  assert.equal(result.repositories.find((item) => item.repository === "rocksoul-mftl").freshness, "STALE_REVIEW_REQUIRED")
})

test("HTTP API serves query traversal and provenance endpoints", async () => {
  const server = createCorrelationServer()
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  const base = `http://127.0.0.1:${address.port}`
  try {
    const response = await fetch(`${base}/api/v1/correlation/cases?q=temple`)
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.ok(body.data.some((item) => item.case_id === "CORR-CASE-JERUSALEM-70"))

    const full = await graph("CORR-CASE-JERUSALEM-70")
    const nodeId = encodeURIComponent(full.nodes[0].id)
    const neighborhood = await fetch(`${base}/api/v1/correlation/nodes/${nodeId}/neighbors?depth=2&max_nodes=10`)
    assert.equal(neighborhood.status, 200)

    const provenance = await fetch(`${base}/api/v1/correlation/nodes/${nodeId}/provenance`)
    assert.equal(provenance.status, 200)

    const source = encodeURIComponent(full.edges[0].source)
    const target = encodeURIComponent(full.edges.at(-1).target)
    const pathResponse = await fetch(`${base}/api/v1/correlation/path?source=${source}&target=${target}&max_depth=6`)
    assert.equal(pathResponse.status, 200)

    const missing = await fetch(`${base}/api/v1/correlation/cases/DOES-NOT-EXIST`)
    assert.equal(missing.status, 404)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})


test("qualified reference protocol preserves canonical owner identity", async () => {
  const ref = parseQualifiedReference("mftl:MYTH-JERUSALEM-TEMPLE-DESTRUCTION-PROPHECY-000001")
  assert.equal(ref.repository,"rocksoul-mftl")
  assert.equal(ref.domain,"STORY")
  assert.equal(toQualifiedReference({repository:"rocksoul-rgbl",record_id:"mw:passage:sblgnt:v1-2:mark:13:2"}),"rgbl:mw:passage:sblgnt:v1-2:mark:13:2")
  assert.equal(parseQualifiedReference("rocksoul-superhero:PER-JERUSALEM-FLAVIUS-JOSEPHUS").qualified_ref,"superhero:PER-JERUSALEM-FLAVIUS-JOSEPHUS")
  const resolved = await resolveQualifiedReference(ref.qualified_ref)
  assert.equal(resolved.observed_owner_head_sha.length,40)
})

test("Jerusalem foundation resolves current canonical STORY and EVENT IDs", async () => {
  const item = await getCase("CORR-CASE-JERUSALEM-70")
  const refs = item.edges.flatMap(edge => [edge.source_ref,edge.target_ref])
  assert.ok(refs.some(ref => ref.record_id === "MYTH-JERUSALEM-TEMPLE-DESTRUCTION-PROPHECY-000001"))
  assert.ok(refs.some(ref => ref.record_id === "EVT-JERUSALEM-SECOND-TEMPLE-DESTRUCTION-70"))
  assert.ok(!refs.some(ref => ref.record_id === "JERUSALEM-70-TEMPLE-PREDICTION"))
})

test("reanalysis queue points to exact dependent edges when an owner moves", async () => {
  const snapshot = await loadFreshnessSnapshot()
  const fakeFetch = async (url) => {
    const repo = Object.keys(snapshot.repositories).find(name => url.includes(`/${name}/`))
    const observed = snapshot.repositories[repo].observed_head_sha
    const sha = repo === "rocksoul-mftl" ? "new-mftl-head" : observed
    return new Response(JSON.stringify({commit:{sha}}),{status:200,headers:{"content-type":"application/json"}})
  }
  const queue = await buildReanalysisQueue({fetchImpl:fakeFetch})
  assert.ok(queue.review_item_count >= 1)
  assert.ok(queue.items.every(item => item.affected_repositories.some(repo => repo.repository === "rocksoul-mftl")))
})

test("HTTP API resolves qualified refs", async () => {
  const server = createCorrelationServer()
  await new Promise(resolve => server.listen(0,"127.0.0.1",resolve))
  const {port}=server.address()
  try {
    const ref=encodeURIComponent("mftl:MYTH-JERUSALEM-TEMPLE-DESTRUCTION-PROPHECY-000001")
    const response=await fetch(`http://127.0.0.1:${port}/api/v1/correlation/refs/resolve?ref=${ref}`)
    assert.equal(response.status,200)
    const body=await response.json()
    assert.equal(body.data.owner_repository,"rocksoul-mftl")
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})
