// LiquidArc Backend Server
//
// Standalone Node.js process for Railway deployment.
// Handles: pool ingestion (all protocols), volatility computation, cron scheduling.
// No timeout limits — runs independently from the Vercel frontend.
//
// Start: npx tsx src/backend/server.ts

import { createServer } from "http";
import "@/lib/defi/init";
import { runIngestionForProtocol, getRegisteredProtocols } from "./ingestion";
import { scheduleCron, runNow } from "./cron";
import { scheduleAlertCron, runAlertEvaluation } from "./alert-cron";

const PORT = parseInt(process.env.PORT || process.env.BACKEND_PORT || "3001", 10);

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === "/" || url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      service: "liquidarc-backend",
      protocols: getRegisteredProtocols(),
    }));
    return;
  }

  // Manual trigger: POST /ingest?protocol=aerodrome-base
  if (url.pathname === "/ingest" && req.method === "POST") {
    const authHeader = req.headers["x-api-key"];
    const expected = process.env.INGEST_SECRET;
    if (expected && authHeader !== expected) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const protocolId = url.searchParams.get("protocol");
    const phase = parseInt(url.searchParams.get("phase") || "0", 10);

    res.writeHead(200, { "Content-Type": "application/json" });

    if (protocolId) {
      // Run single protocol (sync, returns result)
      try {
        const result = await runIngestionForProtocol(protocolId, phase || undefined);
        res.end(JSON.stringify({ ok: true, result }));
      } catch (err) {
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
    } else {
      // Run all protocols (fires and forgets, returns immediately)
      runNow().catch((err) => console.error("[backend] Manual ingestion failed:", err));
      res.end(JSON.stringify({ ok: true, message: "Full ingestion started" }));
    }
    return;
  }

  // Manual trigger: POST /evaluate-alerts
  if (url.pathname === "/evaluate-alerts" && req.method === "POST") {
    const authHeader = req.headers["x-api-key"];
    const expected = process.env.INGEST_SECRET;
    if (expected && authHeader !== expected) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    try {
      const count = await runAlertEvaluation();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, triggered: count }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

httpServer.listen(PORT, () => {
  console.log(`[backend] Server listening on port ${PORT}`);
  console.log(`[backend] Protocols: ${getRegisteredProtocols().join(", ")}`);

  // Start cron schedulers
  scheduleCron();
  scheduleAlertCron();

  // Run initial ingestion on startup
  if (process.env.INGEST_ON_STARTUP === "true") {
    console.log("[backend] Running initial ingestion...");
    runNow().catch((err) => console.error("[backend] Initial ingestion failed:", err));
  }
});
