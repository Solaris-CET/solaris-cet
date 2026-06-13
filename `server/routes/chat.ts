import { Request, Response } from 'express';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `Esti asistentul virtual al Solaris CET, companie din Cetatuia, Vaslui, Romania.
Servicii: panouri fotovoltaice, constructii, acoperisuri, finantari (Casa Verde, RePowerEU).
Contact: solaris-cet@protonmail.com, +40 769 889 721.
Raspunde politicos, concis si in limba romana.`;

export async function handleChat(req: Request, res: Response): Promise<void> {
  const { messages } = req.body;

  // ---- validation ----
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array' });
    return;
  }
  if (messages.length > 50) {
    res.status(400).json({ error: 'max 50 messages allowed' });
    return;
  }
  for (const msg of messages) {
    if (
      typeof msg?.content !== 'string' ||
      msg.content.length > 4000
    ) {
      res.status(400).json({
        error: 'each message content must be a string of at most 4000 characters',
      });
      return;
    }
  }

  // ---- DeepSeek client ----
  const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    baseURL: 'https://api.deepseek.com',
  });

  const stream = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ],
    stream: true,
  });

  // ---- streaming response ----
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      const token = delta?.content;
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('Stream error', err);
  } finally {
    res.end();
  }
}
