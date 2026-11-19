import { NAME_MAX, NAME_MIN } from "shared";

/**
 * Player names: letters (any language, Arabic included), digits, space, _ and -.
 * Removes control and invisible direction characters that can be used to fake names.
 */
export function sanitizeName(raw: string): string | null {
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/[^\p{L}\p{N}\p{M} _-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  const len = [...cleaned].length;
  if (len < NAME_MIN || len > NAME_MAX) return null;
  return cleaned;
}

/** Only accepts connections from websites we list (stops other sites from using our server). */
export function originAllowed(origin: string | undefined, allowed: Set<string>): boolean {
  if (!origin) return false;
  return allowed.has(origin);
}
