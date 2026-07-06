/**
 * Self-test: survey route manifest vs OpenAPI source (string cross-check).
 * Usage: node scripts/survey-route-manifest.test.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { OPENAPI_REQUIRED_PATHS, SURVEY_GATE_ROUTES } from './lib/surveyRouteManifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const openApiSrc = readFileSync(path.join(root, 'app', 'api', 'lib', 'surveyOpenApi.ts'), 'utf8');
const indexSrc = readFileSync(path.join(root, 'app', 'server', 'index.cjs'), 'utf8');

let failures = 0;

for (const route of SURVEY_GATE_ROUTES) {
  if (!indexSrc.includes(route.path)) {
    console.error(`✗ missing in index.cjs: ${route.path}`);
    failures += 1;
  } else {
    console.log(`✓ gate route registered: ${route.path}`);
  }
}

for (const p of OPENAPI_REQUIRED_PATHS) {
  if (!openApiSrc.includes(p)) {
    console.error(`✗ openapi spec missing path string: ${p}`);
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`\n✗ Manifest test failed (${failures})`);
  process.exit(1);
}
console.log('\n✓ Survey route manifest test passed');