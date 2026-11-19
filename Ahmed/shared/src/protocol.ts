import { z } from "zod";
import { NAME_MAX, NAME_MIN, PROTOCOL_VERSION } from "./constants.js";

/**
 * Every message is JSON: { t: <type>, ...fields }.
 * Client messages are validated on the server with these schemas.
 * The client only sends INTENT (inputs). It never sends its position, health or damage.
 */
const finite = z.number().finite();

export const ClientHello = z.object({
  t: z.literal("hello"),
  v: z.literal(PROTOCOL_VERSION),
  name: z.string().min(NAME_MIN).max(NAME_MAX * 4), // raw; sanitized on the server
}).strict();

export const ClientInput = z.object({
  t: z.literal("input"),
  seq: z.number().int().nonnegative().max(2 ** 31),
  mx: finite.min(-1).max(1), // move right / left
  mz: finite.min(-1).max(1), // move forward / back
  yaw: finite.min(-Math.PI * 4).max(Math.PI * 4),
  pitch: finite.min(-Math.PI / 2).max(Math.PI / 2),
  sprint: z.boolean(),
  crouch: z.boolean(),
  jump: z.boolean(),
  fire: z.boolean(),
}).strict();

export const ClientPing = z.object({ t: z.literal("ping"), at: finite }).strict();

export const ClientMessage = z.discriminatedUnion("t", [ClientHello, ClientInput, ClientPing]);
export type ClientMessage = z.infer<typeof ClientMessage>;
export type ClientInput = z.infer<typeof ClientInput>;

/** Server → client messages (trusted by the client, so plain types are enough). */
export interface PlayerState {
  id: string;
  name: string;
  squad: number;
  x: number; y: number; z: number;
  yaw: number;
  hp: number;
  alive: boolean;
}
export type ServerMessage =
  | { t: "welcome"; id: string; squad: number; tick: number }
  | { t: "snapshot"; tick: number; ack: number; players: PlayerState[] }
  | { t: "pong"; at: number; server: number }
  | { t: "error"; code: ServerErrorCode; message: string };

export type ServerErrorCode = "bad_message" | "rate_limited" | "full" | "bad_version" | "bad_name" | "not_joined";
