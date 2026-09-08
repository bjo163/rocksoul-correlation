import assert from "node:assert/strict"
import test from "node:test"
import { getCase, graph, listCases, listEdges } from "../src/runtime.mjs"
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

test("edge filters are deterministic", async () => {
  const law = await listEdges({ domain: "LAW" })
  assert.ok(law.length >= 1)
  assert.ok(law.every((edge) => edge.source_ref.domain === "LAW" || edge.target_ref.domain === "LAW"))
  const supported = await listEdges({ epistemic_status: "SUPPORTED", min_confidence: "0.8" })
  assert.ok(supported.length >= 1)
  assert.ok(supported.every((edge) => edge.epistemic_status === "SUPPORTED" && edge.confidence >= 0.8))
})

test("graph deduplicates canonical nodes", async () => {
  const result = await graph("CORR-CASE-JERUSALEM-70")
  assert.ok(result.nodes.length >= 4)
  assert.ok(result.edges.length >= 3)
  assert.equal(new Set(result.nodes.map((node) => node.id)).size, result.nodes.length)
})

test("HTTP API serves public read-only graph", async () => {
  const server = createCorrelationServer()
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/correlation/cases`)
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.data.length, 5)

    const missing = await fetch(`http://127.0.0.1:${address.port}/api/v1/correlation/cases/DOES-NOT-EXIST`)
    assert.equal(missing.status, 404)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
