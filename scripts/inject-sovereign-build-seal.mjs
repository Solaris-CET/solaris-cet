#!/usr/bin/env node
/**
 * After sync-sovereign copies to app/public/sovereign/, replace <!-- BUILD_SEAL_INJECT -->
 * with a static line (no JS) so the OMEGA surface shows artifact short hash + date.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const target = join(root, "app/public/sovereign/index.html");

function hasGit() {
  try {
    execSync("command -v git", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (!existsSync(target)) {
  console.error("[inject-sovereign-build-seal] missing:", target);
  process.exit(1);
}

let hash = process.env.VITE_GIT_COMMIT_HASH?.trim() ?? "";
if (!hash) {
  if (hasGit()) {
    try {
      hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    } catch {
      hash = "unknown";
    }
  } else {
    hash = "unknown";
  }
}
hash = hash.slice(0, 7);
const iso = process.env.VITE_BUILD_TIMESTAMP?.trim() || new Date().toISOString();
const date = iso.slice(0, 10);

const sealAria = `Artifact seal: short commit ${hash}, build date ${date}. Compare with the repository to verify this deployment.`;
const seal = `      <div class="sovereign-build-seal" role="img" aria-label="${sealAria.replace(/"/g, "&quot;")}"><span aria-hidden="true">ARTIFACT · ${hash} · ${date}</span></div>`;

let html = readFileSync(target, "utf8");
const marker = "<!-- BUILD_SEAL_INJECT -->";
if (!html.includes(marker)) {
  console.warn("[inject-sovereign-build-seal] marker missing; append before </body>");
  html = html.replace("</body>", `${seal}\n  </body>`);
} else {
  html = html.replace(marker, seal);
}
writeFileSync(target, html);
console.log("[inject-sovereign-build-seal]", hash, date);
