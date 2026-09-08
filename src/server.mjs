import http from "node:http"
import { getCase, graph, listCases, listEdges } from "./runtime.mjs"

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=60",
  })
  res.end(JSON.stringify(body, null, 2))
}

export function createCorrelationServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost")
      if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" })

      if (url.pathname === "/health") {
        return json(res, 200, { status: "ok", service: "rocksoul-correlation", version: "0.3.0" })
      }
      if (url.pathname === "/api/v1/correlation/cases") {
        return json(res, 200, { data: await listCases() })
      }
      if (url.pathname.startsWith("/api/v1/correlation/cases/")) {
        const id = decodeURIComponent(url.pathname.split("/").pop())
        const item = await getCase(id)
        return item ? json(res, 200, { data: item }) : json(res, 404, { error: "case_not_found", case_id: id })
      }
      if (url.pathname === "/api/v1/correlation/edges") {
        const filters = Object.fromEntries(url.searchParams.entries())
        return json(res, 200, { data: await listEdges(filters), filters })
      }
      if (url.pathname === "/api/v1/correlation/graph") {
        const caseId = url.searchParams.get("case_id")
        const data = await graph(caseId)
        if (caseId && data.nodes.length === 0) return json(res, 404, { error: "case_not_found", case_id: caseId })
        return json(res, 200, { data })
      }
      return json(res, 404, {
        error: "not_found",
        endpoints: [
          "/health",
          "/api/v1/correlation/cases",
          "/api/v1/correlation/cases/:case_id",
          "/api/v1/correlation/edges",
          "/api/v1/correlation/graph",
        ],
      })
    } catch (error) {
      return json(res, 500, { error: "internal_error", message: error instanceof Error ? error.message : String(error) })
    }
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8787)
  createCorrelationServer().listen(port, "0.0.0.0", () => {
    console.log(`rocksoul-correlation listening on :${port}`)
  })
}
