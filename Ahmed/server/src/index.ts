import { loadConfig } from "./config.js";
import { startServer } from "./server.js";

const cfg = loadConfig();
const { stop } = startServer(cfg);
console.log(`server on :${cfg.port} · origins: ${[...cfg.allowedOrigins].join(", ")}`);

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => { void stop().then(() => process.exit(0)); });
}
