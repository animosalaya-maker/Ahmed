import { randomUUID } from "node:crypto";
import { MOVE, SQUAD_MAX, TICK_RATE, type ClientInput, type PlayerState } from "shared";

/**
 * Server-authoritative match. The client sends inputs; the server moves players.
 * A modified client cannot teleport, speed up, or set its own health.
 * No map, characters or weapons yet: those come later.
 */
export interface Player extends PlayerState {
  lastSeq: number;
  input: ClientInput | null;
  vy: number;
}

export class Match {
  readonly players = new Map<string, Player>();
  tick = 0;
  constructor(readonly maxPlayers: number) {}

  get full(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  addPlayer(name: string): Player | null {
    if (this.full) return null;
    const p: Player = {
      id: randomUUID(), name, squad: this.pickSquad(),
      x: 0, y: 0, z: 0, yaw: 0, hp: 100, alive: true,
      lastSeq: -1, input: null, vy: 0,
    };
    this.players.set(p.id, p);
    return p;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
  }

  /** Fills squads of up to SQUAD_MAX. Friend lobbies will replace this later. */
  private pickSquad(): number {
    const sizes = new Map<number, number>();
    for (const p of this.players.values()) sizes.set(p.squad, (sizes.get(p.squad) ?? 0) + 1);
    for (let s = 1; ; s++) if ((sizes.get(s) ?? 0) < SQUAD_MAX) return s;
  }

  /** Stores the newest input only; old or repeated inputs are ignored. */
  applyInput(id: string, input: ClientInput): void {
    const p = this.players.get(id);
    if (!p || !p.alive || input.seq <= p.lastSeq) return;
    p.lastSeq = input.seq;
    p.input = input;
  }

  step(dt = 1 / TICK_RATE): void {
    this.tick++;
    for (const p of this.players.values()) {
      const i = p.input;
      if (!p.alive || !i) continue;
      p.yaw = i.yaw;
      const speed = i.crouch ? MOVE.crouch : i.sprint ? MOVE.sprint : MOVE.walk;
      let mx = i.mx, mz = i.mz;
      const len = Math.hypot(mx, mz);
      if (len > 1) { mx /= len; mz /= len; } // diagonal is not faster
      const sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
      p.x += (mx * cos - mz * sin) * speed * dt;
      p.z += (-mx * sin - mz * cos) * speed * dt;
      // simple gravity on flat ground until the island terrain exists
      if (i.jump && p.y === 0) p.vy = 5;
      p.vy = Math.max(-MOVE.fall, p.vy - 9.8 * dt);
      p.y = Math.max(0, p.y + p.vy * dt);
      if (p.y === 0) p.vy = 0;
    }
  }

  snapshot(): PlayerState[] {
    return [...this.players.values()].map(({ id, name, squad, x, y, z, yaw, hp, alive }) => ({
      id, name, squad, x: round(x), y: round(y), z: round(z), yaw: round(yaw), hp, alive,
    }));
  }
}
const round = (n: number) => Math.round(n * 100) / 100;
