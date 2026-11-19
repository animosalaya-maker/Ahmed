/** Game-wide constants shared by client and server. The server is the source of truth. */
export const PROTOCOL_VERSION = 1;

export const TICK_RATE = 30; // server simulation ticks per second
export const SNAPSHOT_RATE = 20; // snapshots sent to clients per second

export const SQUAD_MIN = 2;
export const SQUAD_MAX = 4;
export const MATCH_MAX_PLAYERS = 40;

export const NAME_MIN = 2;
export const NAME_MAX = 16;

/** Movement limits the server enforces (metres / second). */
export const MOVE = {
  walk: 4.5,
  sprint: 7,
  crouch: 2.2,
  swim: 2.5,
  fall: 55,
} as const;

/** Hard limits on network traffic from one client. */
export const NET_LIMITS = {
  maxMessageBytes: 2048,
  messagesPerSecond: 60,
  burst: 90,
  maxConnectionsPerIp: 4,
  heartbeatMs: 10_000,
} as const;
