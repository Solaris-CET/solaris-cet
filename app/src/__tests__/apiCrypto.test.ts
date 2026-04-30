import { webcrypto } from "node:crypto";

import { beforeAll,describe, expect, it } from "vitest";

import { decryptApiKey, encryptApiKey, resolveApiKey } from "../../api/lib/crypto";

describe("api/lib/crypto", () => {
  beforeAll(() => {
    if (!globalThis.crypto) {
      Object.defineProperty(globalThis, "crypto", {
        value: webcrypto,
        configurable: true,
      });
    }
  });

  it("round-trips encryptApiKey → decryptApiKey", async () => {
    const secret = "test-secret-1234567890";
    const plaintext = "tavily-test-key";
    const encrypted = await encryptApiKey(secret, plaintext);
    const decrypted = await decryptApiKey(secret, encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("resolveApiKey prefers encrypted when ENCRYPTION_SECRET is present", async () => {
    const secret = "test-secret-1234567890";
    const plaintext = "tavily-test-key";
    const encrypted = await encryptApiKey(secret, plaintext);
    await expect(resolveApiKey(encrypted, "fallback", secret)).resolves.toBe(plaintext);
  });

  it("resolveApiKey falls back to plaintext when decrypt fails", async () => {
    const secret = "test-secret-1234567890";
    const plaintext = "tavily-test-key";
    const encrypted = await encryptApiKey(secret, plaintext);
    await expect(resolveApiKey(encrypted, "fallback", "wrong-secret")).resolves.toBe("fallback");
  });

  it("resolveApiKey uses plaintext when ENCRYPTION_SECRET is missing", async () => {
    await expect(resolveApiKey("encrypted", "fallback", undefined)).resolves.toBe("fallback");
  });
});

