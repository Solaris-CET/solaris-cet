import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

let huskyEntry;
try {
  const pkgDir = path.dirname(require.resolve('husky/package.json'));
  huskyEntry = path.join(pkgDir, 'bin.js');
} catch {
  process.exit(0);
}

if (!existsSync(huskyEntry)) {
  process.exit(0);
}

const result = spawnSync(process.execPath, [huskyEntry], {
  stdio: 'inherit',
  cwd: root,
  windowsHide: true,
});
process.exit(result.status ?? 0);