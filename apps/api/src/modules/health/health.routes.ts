import { Router } from "express";

export const healthRouter = Router();

// Liveness only: no DB or Redis query (CLAUDE.md rule 6). Keep-warm pingers hit this.
healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok" });
});
