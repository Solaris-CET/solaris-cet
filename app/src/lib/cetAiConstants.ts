/**
 * Max characters for a single CET AI user query (UI + Edge `/api/chat`).
 * Keep in sync with repository root `api/chat/route.ts` (OpenAI fallback).
 */
export const CET_AI_MAX_QUERY_CHARS = 8000 as const;

/**
 * When remaining characters to the cap are at or below this value, the query length
 * indicator uses the warning (amber) tone — see `cetAiQueryCharCountToneClass`.
 */
export const CET_AI_QUERY_NEAR_LIMIT_REMAINING_CHARS = 200 as const;

// --- CONFIDENCE SCORES per topic ---
export const CONFIDENCE_SCORES: Record<string, number> = {
  price: 94.7,
  mining: 97.2,
  ai: 99.1,
  ton: 96.8,
  buy: 98.3,
  quantum: 95.6,
  security: 98.9,
  roadmap: 99.5,
  competition: 99.3,
  rwa: 98.7,
  dcbm: 97.5,
  rav: 99.1,
  braid: 98.4,
  wallet: 99.6,
  staking: 96.8,
  team: 99.8,
  default: 91.4,
};

// Keyword sets covering multiple languages for topic detection
export const TOPIC_KEYWORDS: Record<string, string[]> = {
  price:    ['price', 'value', 'worth', 'market', 'preț', 'pret', 'valoare', 'precio', '价格', 'цена', 'preis', 'preço'],
  mining:   ['mine', 'mining', 'earn', 'reward', 'minar', 'minare', 'minería', '挖矿', 'майнинг', 'mining', 'mineração'],
  ai:       ['ai', 'intelligence', 'agent', 'react', 'braid', 'inteligenta', 'inteligență', 'inteligencia', '人工智能', 'искусственный', 'künstliche', 'inteligência'],
  ton:      ['ton', 'blockchain', 'chain', 'network', 'rețea', 'retea', 'blockchain', '区块链', 'блокчейн', 'rede'],
  buy:      ['buy', 'purchase', 'swap', 'dedust', 'cumpara', 'cumpără', 'comprar', '购买', 'купить', 'kaufen', 'comprar'],
  quantum:  ['quantum', 'qubit', 'entropy', 'cuantic', 'kvantum', 'cuántico', '量子', 'квантовый', 'quanten'],
  security: ['security', 'audit', 'safe', 'kyc', 'securitate', 'seguridad', '安全', 'безопасность', 'sicherheit', 'segurança'],
  roadmap:     ['road', 'roadmap', 'plan', 'future', 'phase', 'parcurs', 'hoja de ruta', '路线图', 'дорожная', 'fahrplan', 'roteiro'],
  competition: ['compet', 'vs', 'fetch', 'fet', 'bittensor', 'tao', 'singularity', 'agix', 'ocean', 'asi', 'compara', 'vergleich', 'сравн', '对比', 'concurent'],
  rwa:         ['rwa', 'real world', 'real-world', 'asset', 'agricultural', 'land', 'activ', 'real', 'реальн', '真实', 'physic'],
  dcbm:        ['dcbm', 'buyback', 'stability', 'volatile', 'pid', 'stabilit', 'estabil', 'стабильн', '稳定', 'stabilität'],
  rav:         ['rav', 'reason', 'razon', 'protocol', 'protocol', 'протокол', '协议', 'protocolo'],
  braid:       ['braid', 'framework', 'graph', 'mermaid', 'recursive', 'рекурс', '递归'],
  wallet:      ['wallet', 'connect', 'tonkeeper', 'tonconnect', 'portofel', 'cartera', 'кошелёк', '钱包', 'brieftasche', 'carteira'],
  staking:     ['stak', 'hold', 'hodl', 'benefit', 'benefici', 'преимущест', '好处', 'vorteil', 'vantagem'],
  team:        ['team', 'department', 'echipa', 'equipo', 'команда', '团队', 'mannschaft', 'equipe', '200,000', '200000', '200k', 'task agent', 'tasking', 'task specialists'],
};

// --- FOLLOW-UP SUGGESTIONS by topic ---
export const FOLLOW_UP_BY_TOPIC: Record<string, string[]> = {
  price:       ['What drives CET price long-term?', 'How does DCBM stabilise price?', 'Where can I buy CET?'],
  competition: ['What is the RAV Protocol advantage?', 'Why TON over Ethereum?', 'How do task agents help CET AI?'],
  rwa:         ['What is the virtual land layer?', 'When is the virtual land layer pilot?', 'What proofs can I verify on IPFS + TON?'],
  mining:      ['What device is best for mining?', 'How long does mining last?', 'How does staking affect mining rewards?'],
  ai:          ['What is the BRAID Framework?', 'How does the RAV Protocol work?', 'What are the 200,000 task agents?'],
  ton:         ['How fast is TON?', 'Is the contract audited?', 'How do I connect my TON wallet?'],
  buy:         ['What is the contract address?', 'What slippage should I use?', 'How do I connect my TON wallet?'],
  security:    ['Who audited the contract?', 'Is KYC verified?', 'Can the supply be inflated?'],
  roadmap:     ['What is in Q2 2026?', 'When does the DAO launch?', 'What is the virtual land layer pilot?'],
  quantum:     ['What is Quantum OS?', 'How does entropy work?', 'What is the BRAID Framework?'],
  dcbm:        ['How does PID control work in DCBM?', 'How much does DCBM reduce volatility?', 'When does DCBM trigger?'],
  rav:         ['What is BRAID?', 'How does Gemini Reason?', 'How does Grok Act?'],
  braid:       ['What is the RAV Protocol?', 'How are BRAID graphs stored?', 'Can third parties build BRAID agents?'],
  wallet:      ['How do I buy CET after connecting?', 'Is Tonkeeper safe?', 'What is the contract address?'],
  staking:     ['What is the max staking bonus?', 'How does DAO voting work?', 'What is the DCBM mechanism?'],
  team:        ['How do agents collaborate?', 'What is the largest department?', 'How do agents learn from each other?'],
  default:     ['What makes CET unique?', 'How do I buy CET?', 'What is the total supply?'],
};

/** RAV telemetry milestones (ms) — tuned for mobile attention span; ~5.3s to completion. */
export const CET_AI_PHASE_MS = [580, 1280, 2080, 2880, 3780, 4380, 4980, 5280] as const;

export const CET_AI_SAFE_HTML_CONFIG = {
  kind: 'limited' as const,
  allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
  allowedAttributes: ['href', 'target', 'rel'],
};
