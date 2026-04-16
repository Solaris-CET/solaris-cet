import { describe, it, expect } from "vitest";
import { PRODUCTION_SITE_ORIGIN } from "@/lib/brandAssetFilenames";
import { getAllowedOrigin } from "../../api/lib/cors";

describe("getAllowedOrigin", () => {
  it("returns production origin when origin is null", () => {
    expect(getAllowedOrigin(null)).toBe(PRODUCTION_SITE_ORIGIN);
  });

  it("echoes apex production origin", () => {
    expect(getAllowedOrigin(PRODUCTION_SITE_ORIGIN)).toBe(PRODUCTION_SITE_ORIGIN);
  });

  it("echoes www and legacy preview hosts in the allowlist", () => {
    expect(getAllowedOrigin("https://www.solaris-cet.com")).toBe("https://www.solaris-cet.com");
    expect(getAllowedOrigin("https://solaris-cet.github.io")).toBe("https://solaris-cet.github.io");
  });

  it("allows localhost during local development", () => {
    expect(getAllowedOrigin("http://localhost:5173")).toBe("http://localhost:5173");
  });

  it("falls back to production origin for unknown hosts", () => {
    expect(getAllowedOrigin("https://evil.example")).toBe(PRODUCTION_SITE_ORIGIN);
  });
});
