import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const snapshotFile = path.join(root, "data", "provenance-snapshots.json")

export async function loadFreshnessSnapshot() {
  return JSON.parse(await readFile(snapshotFile, "utf8"))
}

export async function auditFreshness({ fetchImpl = fetch } = {}) {
  const snapshot = await loadFreshnessSnapshot()
  const results = []

  for (const [repository, config] of Object.entries(snapshot.repositories)) {
    const url = `https://api.github.com/repos/bjo163/${repository}/branches/${encodeURIComponent(config.branch)}`
    try {
      const response = await fetchImpl(url, {
        headers: {
          accept: "application/vnd.github+json",
          "user-agent": "rocksoul-correlation-freshness/0.4",
        },
      })
      if (!response.ok) {
        results.push({
          repository,
          domain: config.domain,
          branch: config.branch,
          observed_head_sha: config.observed_head_sha,
          current_head_sha: null,
          freshness: "UNAVAILABLE",
          http_status: response.status,
        })
        continue
      }
      const body = await response.json()
      const current = body?.commit?.sha ?? null
      results.push({
        repository,
        domain: config.domain,
        branch: config.branch,
        observed_head_sha: config.observed_head_sha,
        current_head_sha: current,
        freshness: current === config.observed_head_sha ? "CURRENT" : "STALE_REVIEW_REQUIRED",
      })
    } catch (error) {
      results.push({
        repository,
        domain: config.domain,
        branch: config.branch,
        observed_head_sha: config.observed_head_sha,
        current_head_sha: null,
        freshness: "UNAVAILABLE",
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const counts = results.reduce(
    (acc, item) => {
      acc[item.freshness] = (acc[item.freshness] ?? 0) + 1
      return acc
    },
    { CURRENT: 0, STALE_REVIEW_REQUIRED: 0, UNAVAILABLE: 0 },
  )

  return {
    generated_at: new Date().toISOString(),
    snapshot_generated_at: snapshot.generated_at,
    policy: snapshot.policy,
    counts,
    repositories: results,
  }
}
