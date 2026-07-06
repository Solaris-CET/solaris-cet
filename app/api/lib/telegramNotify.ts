/** Fire-and-forget Telegram notification when bot credentials are configured. */
export async function sendTelegramNotify(text: string): Promise<void> {
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID ?? '').trim();
  if (!botToken || !chatId || !text.trim()) return;

  const threadId = String(process.env.TELEGRAM_THREAD_ID ?? '').trim();
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: text.trim().slice(0, 4000),
    disable_web_page_preview: true,
  };
  if (threadId) payload.message_thread_id = Number.parseInt(threadId, 10);

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('telegram notify failed', res.status, body.slice(0, 500));
    }
  } catch (err) {
    console.error('telegram notify error', err);
  }
}