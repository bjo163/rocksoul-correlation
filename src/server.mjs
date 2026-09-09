import http from "node:http";
import {
  findPath,
  getCase,
  graph,
  listCases,
  listEdges,
  neighbors,
  provenanceForEdge,
  provenanceForNode,
} from "./runtime.mjs";
import { auditFreshness } from "./freshness.mjs";
import { resolveQualifiedReference } from "./qualified-ref.mjs";
import { buildReanalysisQueue } from "./reanalysis.mjs";

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=60",
  });
  res.end(JSON.stringify(body, null, 2));
}

export function createCorrelationServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });

      if (url.pathname === "/health") {
        return json(res, 200, { status: "ok", service: "rocksoul-correlation", version: "0.5.0" });
      }
      if (url.pathname === "/api/v1/correlation/cases") {
        const filters = Object.fromEntries(url.searchParams.entries());
        return json(res, 200, { data: await listCases(filters), filters });
      }
      if (url.pathname.startsWith("/api/v1/correlation/cases/")) {
        const id = decodeURIComponent(url.pathname.split("/").pop());
        const item = await getCase(id);
        return item ? json(res, 200, { data: item }) : json(res, 404, { error: "case_not_found", case_id: id });
      }
      if (url.pathname === "/api/v1/correlation/edges") {
        const filters = Object.fromEntries(url.searchParams.entries());
        return json(res, 200, { data: await listEdges(filters), filters });
      }
      if (url.pathname === "/api/v1/correlation/graph") {
        const caseId = url.searchParams.get("case_id");
        const data = await graph(caseId);
        if (caseId && data.nodes.length === 0) return json(res, 404, { error: "case_not_found", case_id: caseId });
        return json(res, 200, { data });
      }
      if (url.pathname.startsWith("/api/v1/correlation/nodes/") && url.pathname.endsWith("/neighbors")) {
        const parts = url.pathname.split("/");
        const id = decodeURIComponent(parts[5]);
        const options = Object.fromEntries(url.searchParams.entries());
        const data = await neighbors(id, options);
        return data ? json(res, 200, { data }) : json(res, 404, { error: "node_not_found", node_id: id });
      }
      if (url.pathname.startsWith("/api/v1/correlation/nodes/") && url.pathname.endsWith("/provenance")) {
        const parts = url.pathname.split("/");
        const id = decodeURIComponent(parts[5]);
        const data = await provenanceForNode(id);
        return data ? json(res, 200, { data }) : json(res, 404, { error: "node_not_found", node_id: id });
      }
      if (url.pathname.startsWith("/api/v1/correlation/edges/") && url.pathname.endsWith("/provenance")) {
        const parts = url.pathname.split("/");
        const id = decodeURIComponent(parts[5]);
        const data = await provenanceForEdge(id);
        return data ? json(res, 200, { data }) : json(res, 404, { error: "edge_not_found", edge_id: id });
      }
      if (url.pathname === "/api/v1/correlation/path") {
        const source = url.searchParams.get("source");
        const target = url.searchParams.get("target");
        if (!source || !target) return json(res, 400, { error: "source_and_target_required" });
        const data = await findPath(source, target, { max_depth: url.searchParams.get("max_depth") ?? 4 });
        if (!data) return json(res, 404, { error: "node_not_found" });
        return json(res, 200, { data });
      }
      if (url.pathname === "/api/v1/correlation/freshness") {
        return json(res, 200, { data: await auditFreshness() });
      }
      if (url.pathname === "/api/v1/correlation/reanalysis") {
        return json(res, 200, { data: await buildReanalysisQueue() });
      }
      if (url.pathname === "/api/v1/correlation/refs/resolve") {
        const ref = url.searchParams.get("ref");
        if (!ref) return json(res, 400, { error: "ref_required" });
        const data = await resolveQualifiedReference(ref, { resolution: url.searchParams.get("resolution") ?? "canonical" });
        return data ? json(res, 200, { data }) : json(res, 400, { error: "invalid_qualified_reference", ref });
      }

      return json(res, 404, {
        error: "not_found",
        endpoints: [
          "/health",
          "/api/v1/correlation/cases",
          "/api/v1/correlation/cases/:case_id",
          "/api/v1/correlation/edges",
          "/api/v1/correlation/graph",
          "/api/v1/correlation/nodes/:node_id/neighbors",
          "/api/v1/correlation/nodes/:node_id/provenance",
          "/api/v1/correlation/edges/:edge_id/provenance",
          "/api/v1/correlation/path?source=...&target=...",
          "/api/v1/correlation/freshness",
          "/api/v1/correlation/reanalysis",
          "/api/v1/correlation/refs/resolve?ref=mftl:...",
        ],
      });
    } catch (error) {
      return json(res, 500, {
        error: "internal_error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 8787);
  createCorrelationServer().listen(port, "0.0.0.0", () => {
    console.log(`rocksoul-correlation listening on :${port}`);
  });
}

