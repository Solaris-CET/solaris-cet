/**
 * Reproducible install for monorepo — optimized for Windows ENOTEMPTY issues.
 * Usage: node scripts/ci-install.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const NODE_MODULES_DIRS = [
  'node_modules',
  'app/node_modules',
  'api/node_modules',
  'cli/node_modules',
  'contracts/node_modules',
  'scripts/node_modules',
];

function run(cmd, args, { allowFail = false } = {}) {
  const label = [cmd, ...args].join(' ');
  console.log(`\n> ${label}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0 && !allowFail) {
    process.exit(result.status ?? 1);
  }
  return result.status ?? 1;
}

function rimrafAll() {
  const existing = NODE_MODULES_DIRS.filter((d) => existsSync(path.join(root, d)));
  if (!existing.length) {
    console.log('No node_modules folders to remove.');
    return;
  }
  run('npx', ['--yes', 'rimraf@5', ...existing]);
}

function npmCiWithRetry(maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n--- npm ci attempt ${attempt}/${maxAttempts} ---`);
    const code = run('npm', ['ci', '--ignore-scripts', '--no-audit'], { allowFail: true });
    if (code === 0) return;
    if (attempt < maxAttempts) {
      console.warn('npm ci failed; cleaning node_modules and retrying...');
      run('npx', ['--yes', 'rimraf@5', 'node_modules'], { allowFail: true });
    } else {
      process.exit(code);
    }
  }
}

console.log('SOLARIS CET — ci-install');
console.log(`Platform: ${process.platform} · Node ${process.version}`);

rimrafAll();
npmCiWithRetry();
run('node', ['scripts/prepare-husky.mjs'], { allowFail: true });

console.log('\n✓ Install complete. Next: npm run survey:api & npm run app:dev');