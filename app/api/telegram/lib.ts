export type TelegramUpdate = {
  message?: {
    message_id: number;
    chat: { id: number; type: string; username?: string };
    from?: { id: number; username?: string };
    text?: string;
  };
};

export async function telegramSendMessage(token: string, chatId: number, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
}

export function parseCommand(text: string): { cmd: string; args: string } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;
  const [rawCmd, ...rest] = trimmed.split(' ');
  const cmd = (rawCmd || '').trim().toLowerCase();
  const args = rest.join(' ').trim();
  return cmd ? { cmd, args } : null;
}

