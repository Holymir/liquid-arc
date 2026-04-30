import { describe, expect, it } from "vitest";
import { validateSessionSecret } from "../session";

describe("validateSessionSecret", () => {
  const goodSecret = "x".repeat(32);

  it("returns the secret unchanged when it's valid", () => {
    expect(validateSessionSecret(goodSecret)).toBe(goodSecret);
  });

  it("throws when the secret is undefined", () => {
    expect(() => validateSessionSecret(undefined)).toThrow(/not set/i);
  });

  it("throws when the secret is empty", () => {
    expect(() => validateSessionSecret("")).toThrow(/not set/i);
  });

  it("throws when the secret is shorter than 32 chars", () => {
    expect(() => validateSessionSecret("x".repeat(31))).toThrow(
      /at least 32 characters/i
    );
  });

  it("rejects the well-known placeholder string", () => {
    const placeholder = "placeholder-secret-at-least-32-characters-long";
    expect(() => validateSessionSecret(placeholder)).toThrow(/placeholder/i);
  });

  it("rejects any secret starting with 'placeholder' (case-insensitive)", () => {
    const upper = "PLACEHOLDER" + "x".repeat(30);
    expect(() => validateSessionSecret(upper)).toThrow(/placeholder/i);
  });

  it("returns a build-time stub during next build phase even when missing", () => {
    const result = validateSessionSecret(undefined, "phase-production-build");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThanOrEqual(32);
  });
});
