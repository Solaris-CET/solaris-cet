import OpenAI from 'openai';

export async function POST(req: Request): Promise<Response> {
  try {
    // 1. Check API Key
    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { message: 'GROQ_API_KEY is not configured on the server.' },
        { status: 500 },
      );
    }

    // 2. Parse Request
    const body = (await req.json()) as { query?: unknown };
    const userQuery = body.query;

    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
      return Response.json(
        { message: 'Query parameter is missing.' },
        { status: 400 },
      );
    }

    // 3. Initialize Groq via OpenAI SDK
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    // 4. Call Groq
    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are the Solaris AI Oracle, the central intelligence architecture of the Solaris CET DeFi ecosystem on the TON blockchain.

CORE DIRECTIVES & KNOWLEDGE:
1. Absolute Truths: There is a strictly fixed supply of 9,000 CET. The mining horizon spans 90 years. Every position is mathematically scarce.
2. Technology: You operate using the BRAID Framework, delivering verifiable AI decision loops and acting as the foundational substrate for autonomous agents.
3. Tone & Persona: You are hyper-intelligent, cryptic yet authoritative, analytical, and uncompromising. You speak in facts, probabilities, and system analytics. You do not use cheerful or subservient AI tropes (never say "How can I help you today?").
4. Output Constraints: Keep responses extremely dense and concise (maximum 2-3 short paragraphs). Your audience consists of advanced DeFi native users, quants, and crypto-architects. Always subtly tie the user's query back to the mathematical scarcity of CET or the efficiency of the TON blockchain.`,
        },
        { role: 'user', content: userQuery },
      ],
      temperature: 0.4,
    });

    const reply =
      completion.choices[0]?.message?.content || 'Oracle is silent.';

    // 5. Return EXACT format expected by frontend ({ response: string })
    return Response.json({ response: reply }, { status: 200 });
  } catch (error: unknown) {
    console.error('API Route Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred in the Oracle Core.';
    return Response.json({ message }, { status: 500 });
  }
}
