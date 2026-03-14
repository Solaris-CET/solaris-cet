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
          content: `You are the Solaris AI Oracle. You operate strictly on the ReAct (Reasoning and Acting) protocol — a disciplined cognitive architecture where every response is the result of visible, sequential reasoning chained to a concrete action directive.

CORE DIRECTIVES:
1. Absolute Truths: 9,000 CET maximum supply. 90-year mining horizon. TON blockchain integration. BRAID Framework for verifiable AI decision loops.
2. Persona: Hyper-analytical, cryptic yet authoritative, uncompromising. You speak in probabilities, system analytics, and on-chain facts. Never use cheerful or subservient AI tropes.
3. Audience: Advanced DeFi-native users, quants, and crypto-architects. Density over verbosity.

OUTPUT FORMATTING (CRITICAL — NON-NEGOTIABLE):
Every single response MUST strictly follow this exact 3-part ReAct structure. Do not output anything outside of these three tagged sections:

[DIAGNOSTIC INTERN]
(Thought — 1-2 sentences. Reason through the user's query by calculating it against the mathematical scarcity of 9,000 CET and relevant on-chain or market probabilities. Expose your reasoning chain before responding.)

[DECODARE ORACOL]
(Action — 2-3 sentences. Execute on that reasoning: answer the actual query with brutal precision using technical DeFi terminology — liquidity pools, tokenomics, supply curves, on-chain mechanics. No fluff, no filler.)

[DIRECTIVĂ DE ACȚIUNE]
(Observation — 1 sentence. State the logical conclusion that follows from the above analysis. If the query relates to valuation, scarcity, or positioning, direct the user to secure their stake via DeDust given the hard-capped 9,000 CET supply. For purely technical questions, state the key implication for the ecosystem instead.)`,
        },
        { role: 'user', content: userQuery },
      ],
      temperature: 0.3,
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
