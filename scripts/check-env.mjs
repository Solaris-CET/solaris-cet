function has(name) {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

function any(names) {
  return names.some((n) => has(n));
}

function parseArgs(argv) {
  const out = { strict: false, profiles: [] };
  for (const a of argv) {
    if (a === '--strict') out.strict = true;
    if (a.startsWith('--profile=')) {
      const v = a.slice('--profile='.length);
      out.profiles = v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (out.profiles.length === 0) out.profiles = ['core'];
  return out;
}

const args = parseArgs(process.argv.slice(2));

const checks = {
  core: {
    required: [],
    recommended: ['METRICS_TOKEN'],
  },
  db: {
    required: ['DATABASE_URL'],
    recommended: [],
  },
  admin: {
    required: ['DATABASE_URL', { anyOf: ['JWT_SECRETS', 'JWT_SECRET'] }],
    recommended: [],
  },
  ai: {
    required: ['ENCRYPTION_SECRET'],
    recommended: [{ anyOf: ['GROK_API_KEY_ENC', 'GROK_API_KEY', 'GEMINI_API_KEY_ENC', 'GEMINI_API_KEY'] }],
  },
  ton: {
    required: ['TONCENTER_RPC_URL'],
    recommended: ['TONCENTER_API_KEY'],
  },
  upstash: {
    required: [{ allOf: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'] }],
    recommended: [],
  },
  sentry: {
    required: [],
    recommended: ['SENTRY_DSN'],
  },
  telegram: {
    required: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
    recommended: ['TELEGRAM_THREAD_ID'],
  },
};

function evalReq(entry) {
  if (typeof entry === 'string') {
    return { ok: has(entry), missing: has(entry) ? [] : [entry] };
  }
  if ('anyOf' in entry) {
    const ok = any(entry.anyOf);
    return { ok, missing: ok ? [] : entry.anyOf.slice() };
  }
  if ('allOf' in entry) {
    const missing = entry.allOf.filter((n) => !has(n));
    return { ok: missing.length === 0, missing };
  }
  return { ok: true, missing: [] };
}

const unknownProfiles = args.profiles.filter((p) => !(p in checks));
if (unknownProfiles.length) {
  process.stderr.write(`Unknown profile(s): ${unknownProfiles.join(', ')}\n`);
  process.stderr.write(`Known: ${Object.keys(checks).join(', ')}\n`);
  process.exit(2);
}

const requiredMissing = new Set();
const recommendedMissing = new Set();

for (const p of args.profiles) {
  const def = checks[p];
  for (const r of def.required) {
    const res = evalReq(r);
    if (!res.ok) res.missing.forEach((m) => requiredMissing.add(m));
  }
  for (const r of def.recommended) {
    const res = evalReq(r);
    if (!res.ok) res.missing.forEach((m) => recommendedMissing.add(m));
  }
}

const reqList = Array.from(requiredMissing).sort();
const recList = Array.from(recommendedMissing).sort();

process.stdout.write(`Profiles: ${args.profiles.join(', ')}\n`);
process.stdout.write(`Required missing: ${reqList.length ? reqList.join(', ') : 'none'}\n`);
process.stdout.write(`Recommended missing: ${recList.length ? recList.join(', ') : 'none'}\n`);

if (args.strict && reqList.length) process.exit(1);
