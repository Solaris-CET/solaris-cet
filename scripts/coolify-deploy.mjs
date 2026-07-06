#!/usr/bin/env node
/**
 * Trigger Coolify deploy by tag (Windows-safe — no bash).
 * Usage: node scripts/coolify-deploy.mjs
 * Env: COOLIFY_BASE_URL, COOLIFY_API_TOKEN, COOLIFY_RESOURCE_UUID, COOLIFY_TAG (default main)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function triggerCoolifyDeploy(env = process.env) {
  const base = String(env.COOLIFY_BASE_URL ?? '').trim().replace(/\/$/, '');
  const token = String(env.COOLIFY_API_TOKEN ?? '').trim();
  const uuid = String(env.COOLIFY_RESOURCE_UUID ?? '').trim();
  const tag = String(env.COOLIFY_TAG ?? 'main').trim();

  const missing = [
    !base && 'COOLIFY_BASE_URL',
    !token && 'COOLIFY_API_TOKEN',
    !uuid && 'COOLIFY_RESOURCE_UUID',
    !tag && 'COOLIFY_TAG',
  ].filter(Boolean);

  if (missing.length) {
    return { ok: false, status: 2, error: `Missing env: ${missing.join(', ')}` };
  }

  const url = `${base}/api/v1/deploy`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ uuid, tag }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: body.slice(0, 400) || res.statusText };
    }
    return { ok: true, status: res.status, tag, uuid };
  } catch (e) {
    return { ok: false, status: 1, error: e instanceof Error ? e.message : String(e) };
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const result = await triggerCoolifyDeploy();
  if (!result.ok) {
    console.error(`Coolify deploy failed: ${result.error}`);
    process.exit(result.status === 2 ? 2 : 1);
  }
  console.log(`✓ Coolify deploy triggered tag=${result.tag} uuid=${result.uuid}`);
}