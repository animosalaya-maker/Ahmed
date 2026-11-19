import { MATCH_MAX_PLAYERS } from "shared";

/** Reads configuration from environment variables. Secrets never live in code. */
export interface Config {
  port: number;
  allowedOrigins: Set<string>;
  maxPlayers: number;
  trustProxy: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT غير صالح");
  const maxPlayers = Math.min(MATCH_MAX_PLAYERS, Math.max(1, Number(env.MAX_PLAYERS ?? MATCH_MAX_PLAYERS)));
  const allowedOrigins = new Set(
    (env.ALLOWED_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean),
  );
  return { port, allowedOrigins, maxPlayers, trustProxy: env.TRUST_PROXY === "1" };
}
