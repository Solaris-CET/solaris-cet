import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildReactAgentFinalAnswer,
  buildReactAgentTrace,
  parseReactAgentBody,
  REACT_AGENT_PROBE,
} from '../lib/reactAgent';

export { REACT_AGENT_PATH, REACT_AGENT_PROBE } from '@/api/lib/reactAgent';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': REACT_AGENT_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  try {
    const body = await req.json();
    const { query, walletAddress } = parseReactAgentBody(body);
    const trace = buildReactAgentTrace(walletAddress);
    const finalAnswer = buildReactAgentFinalAnswer(walletAddress);

    return jsonResponse({ query, walletAddress, trace, finalAnswer }, allowedOrigin, 200);
  } catch {
    return jsonResponse({ error: REACT_AGENT_PROBE.invalidJsonError }, allowedOrigin, 400);
  }
}