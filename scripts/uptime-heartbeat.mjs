const url = String(process.env.UPTIME_HEARTBEAT_URL ?? '').trim();
if (!url) {
  console.error('Missing UPTIME_HEARTBEAT_URL');
  process.exit(2);
}

const timeoutMs = Number.parseInt(String(process.env.UPTIME_HEARTBEAT_TIMEOUT_MS ?? '5000'), 10);
const controller = new AbortController();
const id = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 5000);

try {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': `solaris-cet-heartbeat/${String(process.env.GIT_SHA ?? '').slice(0, 12) || 'unknown'}`,
      'Cache-Control': 'no-store',
    },
    signal: controller.signal,
  });
  clearTimeout(id);
  if (!res.ok) {
    console.error('Heartbeat failed:', res.status);
    process.exit(1);
  }
  process.exit(0);
} catch {
  clearTimeout(id);
  console.error('Heartbeat error');
  process.exit(1);
}

