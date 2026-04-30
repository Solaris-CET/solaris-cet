import fs from 'node:fs';
import path from 'node:path';

export function findRepoRoot(fromDir: string): string | null {
  let cur = path.resolve(fromDir);
  for (let i = 0; i < 30; i += 1) {
    const pkgPath = path.join(cur, 'package.json');
    try {
      if (fs.existsSync(pkgPath)) {
        const raw = fs.readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(raw) as { name?: string };
        if (pkg?.name === 'solaris-cet-root') return cur;
      }
    } catch {
      void 0;
    }
    const next = path.dirname(cur);
    if (next === cur) return null;
    cur = next;
  }
  return null;
}

