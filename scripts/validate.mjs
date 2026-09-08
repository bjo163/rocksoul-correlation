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

const failures = []
const seenIds = new Set()
const files = (await readdir(path.join(root, "data", "cases"))).filter((name) => name.endsWith(".json"))
if (!files.length) failures.push("no correlation cases found")

function checkRef(ref, label, file) {
  if (!ref || typeof ref !== "object") return failures.push(`${file}: ${label} missing`)
  if (!ownerByDomain[ref.domain]) failures.push(`${file}: ${label} invalid domain ${ref.domain}`)
  else if (ownerByDomain[ref.domain] !== ref.repository) {
    failures.push(`${file}: ${label} ownership mismatch ${ref.domain} -> ${ref.repository}; expected ${ownerByDomain[ref.domain]}`)
  }
  if (!ref.record_id || typeof ref.record_id !== "string") failures.push(`${file}: ${label} record_id missing`)
}

for (const file of files) {
  const record = JSON.parse(await readFile(path.join(root, "data", "cases", file), "utf8"))
  if (!record.case_id?.startsWith("CORR-CASE-")) failures.push(`${file}: invalid case_id`)
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
    if (!Array.isArray(edge.support)) failures.push(`${file}: ${edge.id} support must be array`)
    if (!Array.isArray(edge.counterevidence)) failures.push(`${file}: ${edge.id} counterevidence must be array`)
    if (!Array.isArray(edge.alternative_explanations)) failures.push(`${file}: ${edge.id} alternative_explanations must be array`)
    if (!Array.isArray(edge.sources) || edge.sources.length === 0) failures.push(`${file}: ${edge.id} sources must be non-empty`)
    if (!epistemicStates.has(edge.epistemic_status)) failures.push(`${file}: ${edge.id} invalid epistemic_status`)
    if (typeof edge.confidence !== "number" || edge.confidence < 0 || edge.confidence > 1) failures.push(`${file}: ${edge.id} confidence outside 0..1`)
    const dimensions = ["temporal", "geographic", "semantic", "identity", "provenance"]
    for (const key of dimensions) {
      const value = edge.dimensions?.[key]
      if (typeof value !== "number" || value < 0 || value > 1) failures.push(`${file}: ${edge.id} dimension ${key} outside 0..1`)
    }
  }
}

const jerusalem = JSON.parse(await readFile(path.join(root, "data", "cases", "jerusalem-70.json"), "utf8"))
const domains = new Set((jerusalem.edges ?? []).flatMap((edge) => [edge.source_ref?.domain, edge.target_ref?.domain]))
for (const domain of ["STORY", "EVENT", "PERSON", "TEXT"]) {
  if (!domains.has(domain)) failures.push(`golden case missing ${domain} coverage`)
}

if (failures.length) {
  console.error("Correlation validation failed:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Correlation validation passed: ${files.length} case(s), ${seenIds.size} edge(s).`)
