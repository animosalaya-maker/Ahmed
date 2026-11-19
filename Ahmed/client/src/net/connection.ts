import { PROTOCOL_VERSION, type ClientMessage, type ServerMessage } from "shared";

/** WebSocket link to the game server with automatic reconnect. */
export class Connection {
  private ws: WebSocket | null = null;
  private retry = 0;
  onMessage: (m: ServerMessage) => void = () => {};
  onStatus: (s: "connecting" | "online" | "offline") => void = () => {};

  constructor(private readonly url: string, private readonly name: string) {}

  open(): void {
    this.onStatus("connecting");
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.onStatus("online");
      this.send({ t: "hello", v: PROTOCOL_VERSION, name: this.name });
    };
    ws.onmessage = (e) => {
      if (typeof e.data !== "string") return;
      try { this.onMessage(JSON.parse(e.data) as ServerMessage); } catch { /* ignore */ }
    };
    ws.onclose = () => {
      this.onStatus("offline");
      const wait = Math.min(10_000, 500 * 2 ** this.retry++);
      setTimeout(() => this.open(), wait);
    };
  }

  send(m: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }
}
