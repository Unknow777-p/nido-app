import express from "express";
import "node:fs";
import { resolve } from "node:path";
import { toNodeHandler } from "better-auth/node";
import { ZodError } from "zod";
import { auth, requireUserId } from "./auth";
import { getSql } from "./lib/db";
import { sameSite } from "./lib/origin-check";
import { registerAll, registry, runWithRequest, UnauthorizedError } from "./rpc";
import * as functions from "./functions";
import { handleStripeWebhook } from "./stripe";
registerAll(functions);
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);
app.all("/api/auth/{*splat}", toNodeHandler(auth));
app.post("/api/stripe/webhook", express.raw({ type: "*/*", limit: "1mb" }), async (req, res) => {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  const request = new Request(`http://${req.headers.host ?? "localhost"}${req.originalUrl}`, {
    method: "POST",
    headers,
    body: req.body
  });
  const response = await handleStripeWebhook(request);
  res.status(response.status).send(await response.text());
});
app.use(express.json({ limit: "256kb" }));
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.post("/api/rpc/:name", async (req, res) => {
  const entry = registry.get(String(req.params.name));
  if (!entry) {
    res.status(404).json({ error: "Funci\xF3n no encontrada." });
    return;
  }
  try {
    await runWithRequest({ req }, async () => {
      const context = {};
      if (entry.needsAuth) {
        if (!sameSite(req)) {
          res.status(403).json({ error: "Solicitud bloqueada." });
          return;
        }
        context.userId = await requireUserId(req);
      }
      const raw = req.body?.data;
      const data = entry.validate ? entry.validate(raw) : raw;
      const result = await entry.run({ data, context });
      res.json({ result: result ?? null });
    });
  } catch (err) {
    sendError(res, err);
  }
});
function sendError(res, err) {
  if (res.headersSent) return;
  if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });
  } else if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? "Datos no v\xE1lidos." });
  } else {
    const message = err instanceof Error ? err.message : "Error inesperado.";
    console.error("[rpc]", message);
    res.status(400).json({ error: message });
  }
}
const dist = resolve(process.cwd(), "dist");
if (false) {
  app.use(express.static(dist, { index: false, maxAge: "1h" }));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(resolve(dist, "index.html"));
  });
}
app.use((err, _req, res, _next) => sendError(res, err));
const port = Number(process.env.PORT ?? 3e3);
void getSql().then(() => {
  app.listen(port, () => console.log(`[nido] API escuchando en http://localhost:${port}`));
}).catch((err) => {
  console.error("[nido] no se pudo iniciar la base de datos:", err);
  process.exit(1);
});
