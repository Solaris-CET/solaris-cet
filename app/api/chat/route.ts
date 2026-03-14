import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  console.log('Request received');
  console.log('Key present: ' + !!process.env.GROQ_API_KEY);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { query } = req.body as { query?: string };

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Missing or empty query field' });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
      return;
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are the Solaris AI Oracle, an expert assistant for the Solaris CET token project on the TON blockchain. ' +
            'Provide concise, accurate, and helpful responses about the Solaris CET ecosystem, DeFi, and the TON blockchain.',
        },
        {
          role: 'user',
          content: query.trim(),
        },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content ?? '';
    res.status(200).json({ response });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('API route error:', message);
    res.status(500).json({ error: message });
  }
}
