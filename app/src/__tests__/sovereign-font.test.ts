import { existsSync, statSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect,it } from "vitest";

/**
 * Guardrail: static/sovereign/index.html references fonts/jetbrains-mono-400.woff2.
 * If the binary is missing from the repo, prebuild sync cannot ship a working /sovereign/.
 */
describe("OMEGA sovereign — self-hosted JetBrains Mono", () => {
  // app/src/__tests__ → ../../../ = repository root (solaris-cet)
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const fontPath = join(
    repoRoot,
    "static/sovereign/fonts/jetbrains-mono-400.woff2"
  );

  it("woff2 exists under static/sovereign/fonts/", () => {
    expect(existsSync(fontPath), `missing ${fontPath}`).toBe(true);
    expect(statSync(fontPath).size).toBeGreaterThan(1000);
  });
});
