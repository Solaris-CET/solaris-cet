#!/usr/bin/env node
/**
 * Creează repo pe gitea.com (dacă lipsește) și face push pe main.
 * Necesită: GITEA_TOKEN (Personal Access Token cu repo write)
 *
 * Usage:
 *   GITEA_TOKEN=xxx node scripts/gitea-push-main.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GITEA = 'https://gitea.com';
const ORG = 'Solaris-Cet';
const REPO = 'solaris-cet';
const token = String(process.env.GITEA_TOKEN ?? '').trim();

if (!token) {
  console.error('Lipsește GITEA_TOKEN. Generează un PAT în Gitea → Settings → Applications.');
  process.exit(2);
}

async function api(pathname, opts = {}) {
  const res = await fetch(`${GITEA}/api/v1${pathname}`, {
    ...opts,
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

const exists = await api(`/repos/${ORG}/${REPO}`);
if (exists.res.status === 404) {
  console.log(`Creare repo ${ORG}/${REPO}...`);
  const created = await api(`/orgs/${ORG}/repos`, {
    method: 'POST',
    body: JSON.stringify({
      name: REPO,
      private: false,
      auto_init: false,
      description: 'SOLARIS CET — platformă + survey engine',
    }),
  });
  if (!created.res.ok) {
    const userCreate = await api('/user/repos', {
      method: 'POST',
      body: JSON.stringify({ name: REPO, private: false, auto_init: false }),
    });
    if (!userCreate.res.ok) {
      console.error('Nu am putut crea repo:', created.body, userCreate.body);
      process.exit(1);
    }
    console.log('Repo creat sub user (fallback):', userCreate.body?.html_url ?? REPO);
  } else {
    console.log('Repo creat:', created.body?.html_url ?? `${ORG}/${REPO}`);
  }
} else if (exists.res.ok) {
  console.log('Repo există:', exists.body?.html_url ?? `${ORG}/${REPO}`);
} else {
  console.error('Eroare verificare repo:', exists.res.status, exists.body);
  process.exit(1);
}

const remote = `${GITEA.replace('https://', `https://${token}@`)}/${ORG}/${REPO}.git`;
const push = spawnSync('git', ['push', remote, 'main', '--force-with-lease'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
});

if (push.status !== 0) process.exit(push.status ?? 1);
console.log(`\n✓ Push main → ${GITEA}/${ORG}/${REPO}`);