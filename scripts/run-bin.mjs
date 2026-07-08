#!/usr/bin/env node
/**
 * Cross-platform runner for hoisted workspace binaries (Windows-safe, paths with spaces).
 * Usage: node scripts/run-bin.mjs <bin-name> [args...]
 * CWD should be the workspace package (e.g. app/).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const name = process.argv[2];
const args = process.argv.slice(3);

if (!name) {
  console.error('Usage: node scripts/run-bin.mjs <bin> [args...]');
  process.exit(1);
}

const PKG_ALIASES = {
  tsc: 'typescript',
  eslint: 'eslint',
  vitest: 'vitest',
  playwright: 'playwright',
};

function packageEntry(binName) {
  const pkgNames = [binName, PKG_ALIASES[binName]].filter(Boolean);
  const bases = pkgNames.flatMap((pkg) => [
    join(root, 'node_modules', pkg),
    join(process.cwd(), 'node_modules', pkg),
  ]);
  for (const base of bases) {
    const pkgPath = join(base, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    let rel;
    if (typeof pkg.bin === 'string') rel = pkg.bin;
    else if (pkg.bin && typeof pkg.bin[binName] === 'string') rel = pkg.bin[binName];
    else if (pkg.bin && typeof pkg.bin === 'object') {
      const key = Object.keys(pkg.bin).find((k) => k === binName) ?? Object.keys(pkg.bin)[0];
      if (key && typeof pkg.bin[key] === 'string') rel = pkg.bin[key];
    }
    else continue;
    const entry = join(base, rel);
    if (existsSync(entry)) return entry;
  }
  return null;
}

const entry = packageEntry(name);
if (entry) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    stdio: 'inherit',
    cwd: process.cwd(),
    windowsHide: true,
  });
  process.exit(result.status ?? 1);
}

const isWin = process.platform === 'win32';
const shim = join(root, 'node_modules', '.bin', isWin ? `${name}.cmd` : name);
if (!existsSync(shim)) {
  console.error(`Binary not found: ${name}`);
  process.exit(1);
}

const result = isWin
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${shim}" ${args.map((a) => `"${a}"`).join(' ')}`], {
      stdio: 'inherit',
      cwd: process.cwd(),
      windowsHide: true,
    })
  : spawnSync(shim, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      windowsHide: true,
    });
process.exit(result.status ?? 1);