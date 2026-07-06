const botToken = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
const chatId = String(process.env.TELEGRAM_CHAT_ID ?? '').trim();
const threadId = String(process.env.TELEGRAM_THREAD_ID ?? '').trim();

if (!botToken || !chatId) {
  process.stderr.write('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID\n');
  process.exit(2);
}

const text = process.argv.slice(2).join(' ').trim();
if (!text) {
  process.stderr.write('Usage: node scripts/telegram-notify.mjs "message"\n');
  process.exit(2);
}

const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

const payload = {
  chat_id: chatId,
  text,
  disable_web_page_preview: true,
};

if (threadId) payload.message_thread_id = Number.parseInt(threadId, 10);

const res = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const body = await res.text().catch(() => '');
  process.stderr.write(`Telegram API error: ${res.status} ${res.statusText}\n`);
  if (body) process.stderr.write(`${body.slice(0, 2000)}\n`);
  process.exit(1);
}

process.stdout.write('ok\n');
