export const MERMAID_AGENT_PATH = '/api/mermaid/agent';
export const MERMAID_AGENT_METHODS = 'POST, OPTIONS';

export const MERMAID_AGENT_PROBE = {
  path: MERMAID_AGENT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  defaultQuery: 'How to stake CET?' as const,
  format: 'mermaid' as const,
  renderMode: 'client' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export function parseMermaidAgentQuery(body: unknown): string {
  if (!body || typeof body !== 'object') return MERMAID_AGENT_PROBE.defaultQuery;
  const query = (body as { query?: unknown }).query;
  return typeof query === 'string' && query.trim() ? query.trim() : MERMAID_AGENT_PROBE.defaultQuery;
}

export function buildMermaidAgentGraph(query: string): string {
  const safeQuery = query.replace(/"/g, "'");
  return [
    'graph TD',
    `  A[User asks: "${safeQuery}"] --> B{Is wallet connected?}`,
    '  B -->|Yes| C[Show staking options]',
    '  B -->|No| D[Show connect wallet]',
    '  C --> E[Show staking calculator]',
    '  E --> F[Show estimated rewards]',
  ].join('\n');
}