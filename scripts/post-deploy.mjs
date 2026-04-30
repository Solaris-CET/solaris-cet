const baseUrl = String(process.env.POST_DEPLOY_BASE_URL ?? '').trim();
const port = String(process.env.PORT ?? '3000').trim();

async function fetchHealth() {
  const url = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/health.json` : `http://127.0.0.1:${port}/health.json`;
  const res = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
  const text = await res.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { url, ok: res.ok, status: res.status, json };
}

async function telegramSend(text) {
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID ?? '').trim();
  const threadId = String(process.env.TELEGRAM_THREAD_ID ?? '').trim();
  if (!botToken || !chatId) return { sent: false };

  const payload = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };
  if (threadId) payload.message_thread_id = Number.parseInt(threadId, 10);

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { sent: res.ok, status: res.status };
}

const sha = String(process.env.GIT_SHA ?? process.env.SOURCE_COMMIT ?? process.env.VITE_GIT_COMMIT_HASH ?? '').trim();
const env = String(process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production');

const health = await fetchHealth().catch((e) => ({ url: 'unknown', ok: false, status: 0, json: { error: String(e) } }));
const statusLine = health.ok ? 'HEALTH OK' : `HEALTH BAD (${health.status || 'no_response'})`;
const version = typeof health.json?.version === 'string' ? health.json.version : null;

const msg = [
  `solaris-cet deploy: ${statusLine}`,
  env ? `env: ${env}` : null,
  sha ? `sha: ${sha}` : null,
  version ? `version: ${version}` : null,
  `health: ${health.url}`,
]
  .filter(Boolean)
  .join('\n');

process.stdout.write(`${msg}\n`);
await telegramSend(msg);

if (!health.ok) process.exit(1);
