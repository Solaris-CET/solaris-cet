#!/usr/bin/env node
/**
 * Repair/replace adminAuth vi.mock blocks with guardAdminRoute mocks.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const testsDir = path.join(root, 'app/src/__tests__');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

function detectHoistedStateVar(src) {
  const m = src.match(/const (\w+) = vi\.hoisted\(\(\) => \(\{[\s\S]*?authOk:/);
  return m?.[1] ?? null;
}

function hasRoleInHoisted(src, stateVar) {
  return new RegExp(`const ${stateVar} = vi\\.hoisted\\([\\s\\S]*?role:`).test(src);
}

function buildMock(stateVar, { hasRole, hasEmail }) {
  const adminReturn = hasEmail
    ? `{ id: 'admin_1', email: 'admin@test.com', role: ${hasRole ? `${stateVar}.role` : "'admin'"} }`
    : `{ id: 'admin_1', role: ${hasRole ? `${stateVar}.role` : "'admin'"} }`;

  if (!stateVar) {
    return `vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async () => ({ admin: { id: 'admin_1', role: 'admin' }, sessionId: 'sess_1' }),
}));`;
  }

  const roleBlock = hasRole
    ? `
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[${stateVar}.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }`
    : '';

  return `vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!${stateVar}.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }${roleBlock}
    return { admin: ${adminReturn}, sessionId: 'sess_1' };
  },
}));`;
}

function replaceAdminAuthMock(src) {
  const marker = "vi.mock('../../api/lib/adminAuth'";
  const start = src.indexOf(marker);
  if (start < 0) return src;

  // End at next top-level statement: import / vi. / describe / const (hoisted already above)
  const after = src.slice(start + marker.length);
  const endPatterns = [
    /\nimport /,
    /\nvi\.mock\(/,
    /\nvi\.stubGlobal\(/,
    /\ndescribe\(/,
  ];
  let endOffset = after.length;
  for (const pat of endPatterns) {
    const m = pat.exec(after);
    if (m && m.index < endOffset) endOffset = m.index;
  }

  const stateVar = detectHoistedStateVar(src);
  const hasRole = stateVar ? hasRoleInHoisted(src, stateVar) : false;
  const oldBlock = src.slice(start, start + marker.length + endOffset);
  const hasEmail = /email:\s*'admin@test\.com'/.test(oldBlock);
  const replacement = buildMock(stateVar, { hasRole, hasEmail });
  return `${src.slice(0, start)}${replacement}${src.slice(start + marker.length + endOffset)}`;
}

const files = walk(testsDir).filter((f) => readFileSync(f, 'utf8').includes("vi.mock('../../api/lib/adminAuth'"));
let updated = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const next = replaceAdminAuthMock(src);
  if (next !== src) {
    writeFileSync(file, next, 'utf8');
    updated++;
    console.log('updated', path.relative(root, file));
  }
}
console.log(`Done: ${updated}/${files.length}`);