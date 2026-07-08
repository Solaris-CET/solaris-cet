import OpenAI from 'openai';

export async function moderateIfConfigured(text: string): Promise<{ flagged: boolean }> {
  const key = (process.env.OPENAI_API_KEY ?? '').trim();
  if (!key) return { flagged: false };
  try {
    const client = new OpenAI({ apiKey: key });
    const res = await client.moderations.create({ model: 'omni-moderation-latest', input: text });
    const flagged = Boolean(res.results?.[0]?.flagged);
    return { flagged };
  } catch {
    return { flagged: false };
  }
}
