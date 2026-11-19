import { describe, expect, it } from "vitest";
import { ConnectionCounter, TokenBucket } from "../src/security/rateLimit.js";
import { originAllowed, sanitizeName } from "../src/security/sanitize.js";
import { parseClientMessage } from "../src/net/parse.js";

describe("sanitizeName", () => {
  it("keeps Arabic and Latin names", () => {
    expect(sanitizeName("أحمد")).toBe("أحمد");
    expect(sanitizeName("  Ahmed_99 ")).toBe("Ahmed_99");
  });
  it("strips markup and invisible direction characters", () => {
    expect(sanitizeName("<b>علي</b>")).toBe("bعليb");
    expect(sanitizeName("ab‮cd")).toBe("abcd");
  });
  it("rejects too short or too long names", () => {
    expect(sanitizeName("a")).toBeNull();
    expect(sanitizeName("x".repeat(17))).toBeNull();
  });
});

describe("originAllowed", () => {
  const allowed = new Set(["https://game.example"]);
  it("allows only listed sites", () => {
    expect(originAllowed("https://game.example", allowed)).toBe(true);
    expect(originAllowed("https://evil.example", allowed)).toBe(false);
    expect(originAllowed(undefined, allowed)).toBe(false);
  });
});

describe("rate limits", () => {
  it("token bucket blocks floods and refills over time", () => {
    const b = new TokenBucket(10, 3, 0);
    expect([b.take(0), b.take(0), b.take(0), b.take(0)]).toEqual([true, true, true, false]);
    expect(b.take(100)).toBe(true);
  });
  it("caps connections per IP", () => {
    const c = new ConnectionCounter(2);
    expect(c.tryAdd("1.1.1.1")).toBe(true);
    expect(c.tryAdd("1.1.1.1")).toBe(true);
    expect(c.tryAdd("1.1.1.1")).toBe(false);
    c.remove("1.1.1.1");
    expect(c.tryAdd("1.1.1.1")).toBe(true);
  });
});

describe("parseClientMessage", () => {
  const input = { t: "input", seq: 1, mx: 0, mz: 1, yaw: 0, pitch: 0, sprint: false, crouch: false, jump: false, fire: false };
  it("accepts a valid input", () => {
    expect(parseClientMessage(JSON.stringify(input)).ok).toBe(true);
  });
  it("rejects extra fields like a client trying to set its own health", () => {
    expect(parseClientMessage(JSON.stringify({ ...input, hp: 9999 })).ok).toBe(false);
  });
  it("rejects out-of-range movement", () => {
    expect(parseClientMessage(JSON.stringify({ ...input, mz: 50 })).ok).toBe(false);
  });
  it("rejects oversized and broken messages", () => {
    expect(parseClientMessage("x".repeat(5000)).ok).toBe(false);
    expect(parseClientMessage("{not json").ok).toBe(false);
  });
});
