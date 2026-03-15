import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("cn (class name utility)", () => {
  it("returns an empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("merges a single class string unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("omits falsy values (false, null, undefined, 0, empty string)", () => {
    expect(cn("foo", false, null, undefined, 0, "", "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts — later class wins", () => {
    // tailwind-merge should keep only p-4 and discard p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("resolves multiple Tailwind conflicts in one call", () => {
    expect(cn("text-sm text-lg", "font-bold")).toBe("text-lg font-bold");
  });

  it("handles conditional classes via object syntax", () => {
    expect(cn({ "bg-red-500": true, "text-white": false })).toBe("bg-red-500");
  });

  it("handles arrays of class values", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});
