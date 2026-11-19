import { createServer, type IncomingMessage, type Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { NET_LIMITS, PROTOCOL_VERSION, SNAPSHOT_RATE, TICK_RATE, type ServerMessage } from "shared";
import type { Config } from "./config.js";
import { Match } from "./game/match.js";
import { parseClientMessage } from "./net/parse.js";
import { ConnectionCounter, TokenBucket } from "./security/rateLimit.js";
import { originAllowed, sanitizeName } from "./security/sanitize.js";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-site",
};

interface Conn {
  ws: WebSocket;
  ip: string;
  bucket: TokenBucket;
  playerId: string | null;
  alive: boolean;
  strikes: number;
}

export function startServer(cfg: Config): { http: Server; stop: () => Promise<void> } {
  const match = new Match(cfg.maxPlayers);
  const ipCounter = new ConnectionCounter(NET_LIMITS.maxConnectionsPerIp);
  const conns = new Set<Conn>();

  const http = createServer((req, res) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, players: match.players.size }));
      return;
    }
    res.writeHead(404).end();
  });

  const wss = new WebSocketServer({ noServer: true, maxPayload: NET_LIMITS.maxMessageBytes, perMessageDeflate: false });

  const clientIp = (req: IncomingMessage): string => {
    if (cfg.trustProxy) {
      const fwd = req.headers["x-forwarded-for"];
      const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
      if (first) return first;
    }
    return req.socket.remoteAddress ?? "unknown";
  };

  http.on("upgrade", (req, socket, head) => {
    const reject = (code: number) => { socket.write(`HTTP/1.1 ${code} \r\n\r\n`); socket.destroy(); };
    if (req.url !== "/play") return reject(404);
    if (!originAllowed(req.headers.origin, cfg.allowedOrigins)) return reject(403);
    const ip = clientIp(req);
    if (!ipCounter.tryAdd(ip)) return reject(429);
    wss.handleUpgrade(req, socket, head, (ws) => onConnection(ws, ip));
  });

  const send = (ws: WebSocket, m: ServerMessage) => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(m)); };

  function onConnection(ws: WebSocket, ip: string) {
    const c: Conn = { ws, ip, bucket: new TokenBucket(NET_LIMITS.messagesPerSecond, NET_LIMITS.burst), playerId: null, alive: true, strikes: 0 };
    conns.add(c);
    // must say hello within 5 seconds
    const helloTimer = setTimeout(() => { if (!c.playerId) ws.close(4000, "hello timeout"); }, 5000);

    ws.on("pong", () => { c.alive = true; });
    ws.on("message", (data, isBinary) => {
      if (isBinary) return ws.close(4001, "binary not allowed");
      if (!c.bucket.take()) {
        if (++c.strikes > 20) return ws.close(4002, "rate limited");
        return send(ws, { t: "error", code: "rate_limited", message: "رسائل كثيرة جداً" });
      }
      const r = parseClientMessage(data);
      if (!r.ok) {
        if (++c.strikes > 20) return ws.close(4003, "bad messages");
        return send(ws, { t: "error", code: "bad_message", message: "رسالة غير صالحة" });
      }
      const m = r.msg;
      if (m.t === "ping") return send(ws, { t: "pong", at: m.at, server: Date.now() });
      if (m.t === "hello") {
        if (c.playerId) return;
        if (m.v !== PROTOCOL_VERSION) return send(ws, { t: "error", code: "bad_version", message: "حدّث اللعبة" });
        const name = sanitizeName(m.name);
        if (!name) return send(ws, { t: "error", code: "bad_name", message: "الاسم غير صالح" });
        const p = match.addPlayer(name);
        if (!p) { send(ws, { t: "error", code: "full", message: "المباراة ممتلئة" }); return ws.close(4004, "full"); }
        c.playerId = p.id;
        clearTimeout(helloTimer);
        return send(ws, { t: "welcome", id: p.id, squad: p.squad, tick: match.tick });
      }
      if (!c.playerId) return send(ws, { t: "error", code: "not_joined", message: "ادخل المباراة أولاً" });
      match.applyInput(c.playerId, m);
    });
    ws.on("close", () => {
      clearTimeout(helloTimer);
      if (c.playerId) match.removePlayer(c.playerId);
      ipCounter.remove(ip);
      conns.delete(c);
    });
    ws.on("error", () => ws.terminate());
  }

  const tickTimer = setInterval(() => match.step(), 1000 / TICK_RATE);
  const snapTimer = setInterval(() => {
    const players = match.snapshot();
    for (const c of conns) {
      if (!c.playerId) continue;
      const me = match.players.get(c.playerId);
      send(c.ws, { t: "snapshot", tick: match.tick, ack: me?.lastSeq ?? -1, players });
    }
  }, 1000 / SNAPSHOT_RATE);
  const beatTimer = setInterval(() => {
    for (const c of conns) {
      if (!c.alive) { c.ws.terminate(); continue; }
      c.alive = false;
      c.ws.ping();
    }
  }, NET_LIMITS.heartbeatMs);

  http.listen(cfg.port);

  return {
    http,
    stop: () => new Promise<void>((resolve) => {
      clearInterval(tickTimer); clearInterval(snapTimer); clearInterval(beatTimer);
      for (const c of conns) c.ws.terminate();
      wss.close();
      http.close(() => resolve());
    }),
  };
}
