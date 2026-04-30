#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';

import { readConfig, writeConfig } from './config.js';
import { httpJson } from './http.js';
import { execAndCapture } from './exec.js';
import { findRepoRoot } from './repoRoot.js';

type AdminLoginResponse = { token: string };
type AdminStatsResponse = {
  users: number;
  aiQueries24h: number;
  aiConversations: number;
  cmsPosts: number;
  adminAudits24h: number;
};
type AdminUsersResponse = {
  users: Array<{
    id: string;
    walletAddress: string;
    role: string;
    points: number;
    createdAt: string;
    displayName: string | null;
    email: string | null;
  }>;
};

function resolveBaseUrl(explicit?: string, saved?: string): string {
  const fromEnv = String(process.env.SOLARIS_BASE_URL ?? '').trim();
  const u = (explicit ?? fromEnv ?? saved ?? '').trim();
  if (!u) return 'http://localhost:3000';
  return u.replace(/\/+$/, '');
}

function resolveAdminToken(explicit?: string, saved?: string): string {
  const fromEnv = String(process.env.SOLARIS_ADMIN_TOKEN ?? '').trim();
  const t = (explicit ?? fromEnv ?? saved ?? '').trim();
  return t;
}

function requireToken(token: string): string {
  if (!token) {
    throw new Error(
      'Missing admin token. Provide --token, or set SOLARIS_ADMIN_TOKEN, or run `solaris-cli login`.',
    );
  }
  return token;
}

function padRight(s: string, w: number): string {
  const v = String(s);
  return v.length >= w ? v : v + ' '.repeat(w - v.length);
}

function printTable(rows: Array<Record<string, string | number | null | undefined>>, keys: string[]) {
  const widths = new Map<string, number>();
  for (const k of keys) widths.set(k, k.length);
  for (const r of rows) {
    for (const k of keys) widths.set(k, Math.max(widths.get(k) ?? 0, String(r[k] ?? '').length));
  }
  const header = keys.map((k) => padRight(k, widths.get(k) ?? k.length)).join('  ');
  process.stdout.write(header + '\n');
  for (const r of rows) {
    const line = keys.map((k) => padRight(String(r[k] ?? ''), widths.get(k) ?? k.length)).join('  ');
    process.stdout.write(line + '\n');
  }
}

const program = new Command();
program.name('solaris-cli').description('Solaris CET admin & ops CLI').version('0.1.0');

program
  .command('login')
  .description('Login as admin and store token locally')
  .requiredOption('--email <email>', 'Admin email')
  .option('--password <password>', 'Admin password (or set SOLARIS_ADMIN_PASSWORD)')
  .option('--url <baseUrl>', 'Base URL (default: http://localhost:3000)')
  .action(async (opts: { email: string; password?: string; url?: string }) => {
    const { path: cfgPath, config } = await readConfig();
    const baseUrl = resolveBaseUrl(opts.url, config.baseUrl);
    const password = (String(opts.password ?? '').trim() || String(process.env.SOLARIS_ADMIN_PASSWORD ?? '').trim());
    if (!password) throw new Error('Missing password. Provide --password or set SOLARIS_ADMIN_PASSWORD.');
    const res = await httpJson<AdminLoginResponse>(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      body: { email: opts.email, password },
    });
    if (!res.ok) throw new Error(res.error);
    await writeConfig(cfgPath, { ...config, baseUrl, adminToken: res.data.token });
    process.stdout.write('ok\n');
  });

program
  .command('logout')
  .description('Clear stored admin token')
  .action(async () => {
    const { path: cfgPath, config } = await readConfig();
    await writeConfig(cfgPath, { ...config, adminToken: undefined });
    process.stdout.write('ok\n');
  });

program
  .command('stats')
  .description('Fetch admin stats')
  .option('--url <baseUrl>', 'Base URL (default: http://localhost:3000)')
  .option('--token <token>', 'Admin JWT (or set SOLARIS_ADMIN_TOKEN)')
  .option('--json', 'Output raw JSON')
  .action(async (opts: { url?: string; token?: string; json?: boolean }) => {
    const { config } = await readConfig();
    const baseUrl = resolveBaseUrl(opts.url, config.baseUrl);
    const token = requireToken(resolveAdminToken(opts.token, config.adminToken));
    const res = await httpJson<AdminStatsResponse>(`${baseUrl}/api/admin/stats`, {
      method: 'GET',
      token,
    });
    if (!res.ok) throw new Error(res.error);
    if (opts.json) {
      process.stdout.write(JSON.stringify(res.data, null, 2) + '\n');
      return;
    }
    const rows = Object.entries(res.data).map(([k, v]) => ({ metric: k, value: v }));
    printTable(rows, ['metric', 'value']);
  });

program
  .command('user-list')
  .description('List users (admin)')
  .option('--url <baseUrl>', 'Base URL (default: http://localhost:3000)')
  .option('--token <token>', 'Admin JWT (or set SOLARIS_ADMIN_TOKEN)')
  .option('--q <query>', 'Search query (walletAddress)')
  .option('--json', 'Output raw JSON')
  .action(async (opts: { url?: string; token?: string; q?: string; json?: boolean }) => {
    const { config } = await readConfig();
    const baseUrl = resolveBaseUrl(opts.url, config.baseUrl);
    const token = requireToken(resolveAdminToken(opts.token, config.adminToken));
    const q = String(opts.q ?? '').trim();
    const url = new URL(`${baseUrl}/api/admin/users`);
    if (q) url.searchParams.set('q', q);
    const res = await httpJson<AdminUsersResponse>(url.toString(), { method: 'GET', token });
    if (!res.ok) throw new Error(res.error);
    if (opts.json) {
      process.stdout.write(JSON.stringify(res.data, null, 2) + '\n');
      return;
    }
    const rows = res.data.users.map((u) => ({
      id: u.id,
      wallet: u.walletAddress,
      role: u.role,
      points: u.points,
      createdAt: u.createdAt,
      name: u.displayName ?? '',
      email: u.email ?? '',
    }));
    printTable(rows, ['id', 'wallet', 'role', 'points', 'createdAt', 'name', 'email']);
  });

program
  .command('deploy')
  .description('Trigger Coolify deploy by tag (wraps scripts/coolify-deploy-by-tag.sh)')
  .requiredOption('--tag <tag>', 'Git tag to deploy')
  .option('--coolify-base-url <url>', 'Coolify base URL (or set COOLIFY_BASE_URL)')
  .option('--coolify-api-token <token>', 'Coolify API token (or set COOLIFY_API_TOKEN)')
  .option('--coolify-resource-uuid <uuid>', 'Coolify resource UUID (or set COOLIFY_RESOURCE_UUID)')
  .action(async (opts: { tag: string; coolifyBaseUrl?: string; coolifyApiToken?: string; coolifyResourceUuid?: string }) => {
    const repoRoot = findRepoRoot(process.cwd());
    if (!repoRoot) throw new Error('Run this command from inside the solaris-cet repo.');

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      COOLIFY_TAG: String(opts.tag ?? '').trim(),
      COOLIFY_BASE_URL: String(opts.coolifyBaseUrl ?? process.env.COOLIFY_BASE_URL ?? '').trim(),
      COOLIFY_API_TOKEN: String(opts.coolifyApiToken ?? process.env.COOLIFY_API_TOKEN ?? '').trim(),
      COOLIFY_RESOURCE_UUID: String(opts.coolifyResourceUuid ?? process.env.COOLIFY_RESOURCE_UUID ?? '').trim(),
    };

    const script = path.join(repoRoot, 'scripts', 'coolify-deploy-by-tag.sh');
    const r = await execAndCapture('bash', [script], { cwd: repoRoot, env });
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    if (r.code !== 0) process.exitCode = r.code;
  });

program
  .command('backup')
  .description('Run Postgres + Redis backups (wraps scripts/pg-backup.sh and scripts/redis-data-backup.sh)')
  .option('--pg', 'Backup Postgres')
  .option('--redis', 'Backup Redis')
  .option('--backup-dir <dir>', 'Backup output dir (BACKUP_DIR)')
  .option('--passphrase <pass>', 'Encrypt backups (BACKUP_PASSPHRASE)')
  .action(async (opts: { pg?: boolean; redis?: boolean; backupDir?: string; passphrase?: string }) => {
    const repoRoot = findRepoRoot(process.cwd());
    if (!repoRoot) throw new Error('Run this command from inside the solaris-cet repo.');

    const doPg = Boolean(opts.pg || (!opts.pg && !opts.redis));
    const doRedis = Boolean(opts.redis || (!opts.pg && !opts.redis));

    const baseEnv: NodeJS.ProcessEnv = { ...process.env };
    if (opts.backupDir) baseEnv.BACKUP_DIR = String(opts.backupDir).trim();
    if (opts.passphrase) baseEnv.BACKUP_PASSPHRASE = String(opts.passphrase);

    if (doPg) {
      const script = path.join(repoRoot, 'scripts', 'pg-backup.sh');
      const r = await execAndCapture('bash', [script], { cwd: repoRoot, env: baseEnv });
      if (r.stdout) process.stdout.write(r.stdout);
      if (r.stderr) process.stderr.write(r.stderr);
      if (r.code !== 0) process.exitCode = r.code;
    }

    if (doRedis) {
      const script = path.join(repoRoot, 'scripts', 'redis-data-backup.sh');
      const r = await execAndCapture('bash', [script], { cwd: repoRoot, env: baseEnv });
      if (r.stdout) process.stdout.write(r.stdout);
      if (r.stderr) process.stderr.write(r.stderr);
      if (r.code !== 0) process.exitCode = r.code;
    }
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write((err instanceof Error ? err.message : String(err)) + '\n');
  process.exitCode = 1;
});
