import { describe, expect, it } from "vitest";
import { MOVE, SQUAD_MAX } from "shared";
import { Match } from "../src/game/match.js";

const inp = (seq: number, o: Partial<Record<string, unknown>> = {}) => ({
  t: "input" as const, seq, mx: 0, mz: 1, yaw: 0, pitch: 0, sprint: false, crouch: false, jump: false, fire: false, ...o,
});

describe("Match", () => {
  it("moves players no faster than the server limit", () => {
    const m = new Match(10);
    const p = m.addPlayer("أحمد")!;
    m.applyInput(p.id, inp(1, { mx: 1, mz: 1, sprint: true }));
    for (let i = 0; i < 30; i++) m.step(1 / 30);
    expect(Math.hypot(p.x, p.z)).toBeLessThanOrEqual(MOVE.sprint + 1e-6);
  });
  it("ignores old or replayed inputs", () => {
    const m = new Match(10);
    const p = m.addPlayer("يوسف")!;
    m.applyInput(p.id, inp(5));
    m.applyInput(p.id, inp(3, { mz: -1 }));
    expect(p.input?.mz).toBe(1);
  });
  it("fills squads up to the maximum size", () => {
    const m = new Match(10);
    const squads = Array.from({ length: SQUAD_MAX + 1 }, (_, i) => m.addPlayer("لاعب" + i)!.squad);
    expect(squads.filter((s) => s === 1)).toHaveLength(SQUAD_MAX);
    expect(squads.at(-1)).toBe(2);
  });
  it("refuses players when full", () => {
    const m = new Match(1);
    expect(m.addPlayer("واحد")).not.toBeNull();
    expect(m.addPlayer("اثنان")).toBeNull();
  });
});
