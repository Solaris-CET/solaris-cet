#!/usr/bin/env node
/**
 * Fail fast before Playwright when app/dist is missing (local `npm run test:e2e` without build).
 * CI downloads dist into app/dist before E2E — this passes there.
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');
const indexHtml = join(repoRoot, 'app', 'dist', 'index.html');

if (!existsSync(indexHtml)) {
  console.error(
    'E2E: app/dist is missing (expected app/dist/index.html). From app/, run: npm run build — or npm run verify — before npm run test:e2e.',
  );
  process.exit(1);
}
