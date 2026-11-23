import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "API listening");
});

// Render sends SIGTERM on deploy/restart: stop accepting requests, finish in-flight ones.
function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
