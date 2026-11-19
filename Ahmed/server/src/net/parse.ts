import { ClientMessage, NET_LIMITS } from "shared";

export type ParseResult = { ok: true; msg: ClientMessage } | { ok: false; reason: string };

/** Size check, JSON parse and strict schema validation. Anything unexpected is rejected. */
export function parseClientMessage(data: unknown): ParseResult {
  let text: string;
  if (typeof data === "string") text = data;
  else if (data instanceof Buffer) text = data.toString("utf8");
  else return { ok: false, reason: "type" };
  if (Buffer.byteLength(text, "utf8") > NET_LIMITS.maxMessageBytes) return { ok: false, reason: "size" };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, reason: "json" };
  }
  const r = ClientMessage.safeParse(json);
  if (!r.success) return { ok: false, reason: "schema" };
  return { ok: true, msg: r.data };
}
