import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildMermaidAgentGraph,
  MERMAID_AGENT_PROBE,
  parseMermaidAgentQuery,
} from '../../lib/mermaidAgent';

export { MERMAID_AGENT_PATH, MERMAID_AGENT_PROBE } from '@/api/lib/mermaidAgent';

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
        'Access-Control-Allow-Methods': MERMAID_AGENT_PROBE.methods.join(', '),
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
    const query = parseMermaidAgentQuery(body);
    const graph = buildMermaidAgentGraph(query);

    return jsonResponse(
      {
        format: MERMAID_AGENT_PROBE.format,
        graph,
        render: MERMAID_AGENT_PROBE.renderMode,
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ error: MERMAID_AGENT_PROBE.invalidJsonError }, allowedOrigin, 400);
  }
}