const owners = {
  mftl: { repository: "rocksoul-mftl", domain: "STORY" },
  legend: { repository: "rocksoul-legend", domain: "EVENT" },
  superhero: { repository: "rocksoul-superhero", domain: "PERSON" },
  rgbl: { repository: "rocksoul-rgbl", domain: "TEXT" },
  aws: { repository: "rocksoul-aws", domain: "LAW" },
  jizz: { repository: "rocksoul-jizz", domain: "PERSPECTIVE" },
  correlation: { repository: "rocksoul-correlation", domain: "RELATIONSHIP" },
}
const aliases = Object.fromEntries(Object.entries(owners).flatMap(([prefix,value]) => [[prefix,prefix],[value.repository,prefix]]))
const repoToPrefix = Object.fromEntries(Object.entries(owners).map(([prefix,value]) => [value.repository,prefix]))

export function toQualifiedReference(ref) {
  const prefix = repoToPrefix[ref.repository]
  if (!prefix) throw new Error(`unknown repository: ${ref.repository}`)
  const owner = owners[prefix]
  if (ref.domain && ref.domain !== owner.domain) throw new Error(`repository/domain mismatch: ${ref.repository}/${ref.domain}`)
  return `${prefix}:${ref.record_id}`
}

export function parseQualifiedReference(value) {
  if (typeof value !== "string" || !value.includes(":")) return null
  const index = value.indexOf(":")
  const rawPrefix = value.slice(0,index)
  const recordId = value.slice(index + 1)
  const prefix = aliases[rawPrefix]
  if (!prefix || !recordId) return null
  const owner = owners[prefix]
  return {
    qualified_ref: `${prefix}:${recordId}`,
    prefix,
    repository: owner.repository,
    domain: owner.domain,
    record_id: recordId,
  }
}

export async function resolveQualifiedReference(value,{ resolution = "canonical" } = {}) {
  const parsed = parseQualifiedReference(value)
  if (!parsed) return null
  const { loadFreshnessSnapshot } = await import("./freshness.mjs")
  const snapshot = await loadFreshnessSnapshot()
  const owner = snapshot.repositories[parsed.repository]
  return {
    ...parsed,
    resolution,
    owner_repository: parsed.repository,
    owner_domain: parsed.domain,
    owner_branch: owner?.branch ?? "main",
    observed_owner_head_sha: owner?.observed_head_sha ?? null,
    owner_url: `https://github.com/bjo163/${parsed.repository}`,
    public_record_url: parsed.repository === "rocksoul-mftl"
      ? `https://rocksoul-mftl.vercel.app/api/v1/records/${encodeURIComponent(parsed.record_id)}`
      : null,
    policy: "Qualified references preserve owner repository and record identity; they do not transfer canonical ownership.",
  }
}

export const QUALIFIED_REFERENCE_OWNERS = Object.freeze(owners)
