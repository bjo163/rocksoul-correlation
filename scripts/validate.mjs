import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const ownerByDomain = {
  STORY: "rocksoul-mftl",
  EVENT: "rocksoul-legend",
  PERSON: "rocksoul-superhero",
  TEXT: "rocksoul-rgbl",
  LAW: "rocksoul-aws",
}
const relationTypes = new Set([
  "attests","witnessed_by","describes","corresponds_to","temporally_aligns_with",
  "geographically_aligns_with","textually_parallels","legally_relevant_to","contradicts",
  "supports","weakens","derived_from","transmitted_by","alternative_to",
])
const epistemicStates = new Set(["SUPPORTED","PARTIAL","DISPUTED","UNRESOLVED","CONTRADICTED","INDETERMINATE"])
const resolutionStates = new Set(["canonical", "candidate"])
const guardedStates = new Set(["PARTIAL", "DISPUTED", "UNRESOLVED", "CONTRADICTED", "INDETERMINATE"])

const failures = []
const seenIds = new Set()
const caseIds = new Set()
const coverage = new Set()
let canonicalRefs = 0
let candidateRefs = 0
const files = (await readdir(path.join(root, "data", "cases"))).filter((name) => name.endsWith(".json")).sort()
if (!files.length) failures.push("no correlation cases found")

function checkRef(ref, label, file) {
  if (!ref || typeof ref !== "object") return failures.push(`${file}: ${label} missing`)
  if (!ownerByDomain[ref.domain]) failures.push(`${file}: ${label} invalid domain ${ref.domain}`)
  else if (ownerByDomain[ref.domain] !== ref.repository) {
    failures.push(`${file}: ${label} ownership mismatch ${ref.domain} -> ${ref.repository}; expected ${ownerByDomain[ref.domain]}`)
  }
  if (!ref.record_id || typeof ref.record_id !== "string") failures.push(`${file}: ${label} record_id missing`)
  const resolution = ref.resolution ?? "canonical"
  if (!resolutionStates.has(resolution)) failures.push(`${file}: ${label} invalid resolution ${resolution}`)
  if (resolution === "candidate") candidateRefs += 1
  else canonicalRefs += 1
  if (ref.domain) coverage.add(ref.domain)
}

for (const file of files) {
  const record = JSON.parse(await readFile(path.join(root, "data", "cases", file), "utf8"))
  if (!record.case_id?.startsWith("CORR-CASE-")) failures.push(`${file}: invalid case_id`)
  if (caseIds.has(record.case_id)) failures.push(`${file}: duplicate case_id ${record.case_id}`)
  caseIds.add(record.case_id)
  if (!record.title || !record.description || !record.status) failures.push(`${file}: title/description/status required`)
  if (!Array.isArray(record.edges) || !record.edges.length) failures.push(`${file}: edges must be non-empty`)

  for (const edge of record.edges ?? []) {
    if (!/^CORR-[A-Z0-9-]+$/.test(edge.id ?? "")) failures.push(`${file}: invalid edge id ${edge.id}`)
    if (seenIds.has(edge.id)) failures.push(`${file}: duplicate edge id ${edge.id}`)
    seenIds.add(edge.id)
    checkRef(edge.source_ref, "source_ref", file)
    checkRef(edge.target_ref, "target_ref", file)

    if (edge.source_ref?.repository === edge.target_ref?.repository && edge.source_ref?.record_id === edge.target_ref?.record_id) {
      failures.push(`${file}: self-referential edge ${edge.id}`)
    }
    if (!relationTypes.has(edge.relation_type)) failures.push(`${file}: invalid relation_type ${edge.relation_type}`)
    if (!["directed", "undirected"].includes(edge.direction)) failures.push(`${file}: invalid direction ${edge.direction}`)
    if (!Array.isArray(edge.support) || edge.support.length === 0) failures.push(`${file}: ${edge.id} support must be non-empty array`)
    if (!Array.isArray(edge.counterevidence)) failures.push(`${file}: ${edge.id} counterevidence must be array`)
    if (!Array.isArray(edge.alternative_explanations)) failures.push(`${file}: ${edge.id} alternative_explanations must be array`)
    if (!Array.isArray(edge.sources) || edge.sources.length === 0) failures.push(`${file}: ${edge.id} sources must be non-empty`)
    if (!epistemicStates.has(edge.epistemic_status)) failures.push(`${file}: ${edge.id} invalid epistemic_status`)
    if (typeof edge.confidence !== "number" || edge.confidence < 0 || edge.confidence > 1) failures.push(`${file}: ${edge.id} confidence outside 0..1`)

    for (const key of ["temporal", "geographic", "semantic", "identity", "provenance"]) {
      const value = edge.dimensions?.[key]
      if (typeof value !== "number" || value < 0 || value > 1) failures.push(`${file}: ${edge.id} dimension ${key} outside 0..1`)
    }

    if (guardedStates.has(edge.epistemic_status) && edge.counterevidence.length === 0 && edge.alternative_explanations.length === 0) {
      failures.push(`${file}: ${edge.id} ${edge.epistemic_status} requires counterevidence or alternative explanations`)
    }
    if (edge.epistemic_status === "SUPPORTED" && edge.confidence < 0.5) {
      failures.push(`${file}: ${edge.id} SUPPORTED confidence must be >= 0.5`)
    }
    if (edge.relation_type === "legally_relevant_to") {
      const domains = new Set([edge.source_ref?.domain, edge.target_ref?.domain])
      if (!domains.has("LAW")) failures.push(`${file}: ${edge.id} legal relevance edge must include LAW`)
      if (!(edge.notes ?? "").toLowerCase().match(/court|guilt|liability|judgment|applicability/)) {
        failures.push(`${file}: ${edge.id} LAW edge must state a legal-boundary note`)
      }
    }
    if ((edge.source_ref?.resolution === "candidate" || edge.target_ref?.resolution === "candidate") && !(edge.notes ?? "").toLowerCase().includes("candidate") && !record.status.includes("candidate")) {
      failures.push(`${file}: ${edge.id} candidate reference must be visible in case status or notes`)
    }
  }
}

for (const domain of ["STORY", "EVENT", "PERSON", "TEXT", "LAW"]) {
  if (!coverage.has(domain)) failures.push(`corpus missing ${domain} coverage`)
}
if (files.length < 5) failures.push(`golden corpus requires at least 5 cases; found ${files.length}`)
if (canonicalRefs === 0) failures.push("corpus must include at least one canonical reference")
if (candidateRefs === 0) failures.push("corpus must exercise candidate-reference semantics")

const jerusalem = JSON.parse(await readFile(path.join(root, "data", "cases", "jerusalem-70.json"), "utf8"))
const jerusalemDomains = new Set((jerusalem.edges ?? []).flatMap((edge) => [edge.source_ref?.domain, edge.target_ref?.domain]))
for (const domain of ["STORY", "EVENT", "PERSON", "TEXT"]) {
  if (!jerusalemDomains.has(domain)) failures.push(`Jerusalem canonical foundation missing ${domain} coverage`)
}

if (failures.length) {
  console.error("Correlation validation failed:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Correlation validation passed: ${files.length} cases, ${seenIds.size} edges, ${canonicalRefs} canonical refs, ${candidateRefs} candidate refs.`)
console.log(`Domain coverage: ${[...coverage].sort().join(", ")}`)
