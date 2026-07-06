/**
 * Post-deploy smoke — alias strict pentru survey-prod-gate.
 * Usage:
 *   SITE_URL=https://solaris-cet.com npm run survey:post-deploy
 *   SOFT_FAIL=1 npm run survey:post-deploy   # toleră rute opționale 404
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env };
if (!env.SOFT_FAIL) env.SOFT_FAIL = '0';

const child = spawnSync(process.execPath, [path.join(root, 'scripts', 'survey-prod-gate.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env,
});
process.exit(child.status ?? 1);