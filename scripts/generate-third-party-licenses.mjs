import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const mode = process.argv.includes('--all') ? 'all' : 'production';
const repoRoot = process.cwd();
const outDir = resolve(repoRoot, 'artifacts', 'licenses');
mkdirSync(outDir, { recursive: true });

const run = (args) => {
  execFileSync('npx', args, { cwd: repoRoot, stdio: 'inherit' });
};

const base = ['-y', 'license-checker-rseidelsohn'];
const scope = mode === 'all' ? [] : ['--production'];

run([...base, ...scope, '--json', '--out', resolve(outDir, `THIRD_PARTY_LICENSES.${mode}.json`)]);
run([...base, ...scope, '--csv', '--out', resolve(outDir, `THIRD_PARTY_LICENSES.${mode}.csv`)]);

