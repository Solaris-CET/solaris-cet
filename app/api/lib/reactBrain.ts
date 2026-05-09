export type CetAiResourceBudget = {
  budgetMs: number;
  maxParallel: number;
};

export type CetAiProviderPlan =
  | { strategy: "dual"; useGemini: true; useGrok: true }
  | {
      strategy: "single";
      useGemini: boolean;
      useGrok: boolean;
      useClaude: boolean;
      singleProvider: "gemini" | "grok" | "claude";
    };

export type CetAiRavPhase = "plan" | "observe" | "synthesize" | "verify";

export type CetAiRavPlan = {
  budget: CetAiResourceBudget;
  providers: CetAiProviderPlan;
  useOnChain: boolean;
  useWebRetrieval: boolean;
  agentCount: number;
  agents: Array<
    | "router"
    | "curated_retriever"
    | "web_retriever"
    | "onchain_observer"
    | "reasoner"
    | "actor"
    | "verifier"
    | "consensus_engine"
    | "hallucination_guard"
  >;
  phases: CetAiRavPhase[];
  temperature: number;
};

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function parseHeaderInt(
  headerValue: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!headerValue) return fallback;
  const parsed = Number.parseInt(headerValue, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return clampInt(parsed, min, max);
}

export function deriveCetAiResourceBudget(req: Request): CetAiResourceBudget {
  const budgetMs = parseHeaderInt(req.headers.get("x-cet-ai-budget-ms"), 3500, 500, 20000);
  const maxParallel = parseHeaderInt(req.headers.get("x-cet-ai-max-parallel"), 2, 1, 4);
  return { budgetMs, maxParallel };
}

type QuerySignals = {
  wantsLiveData: boolean;
  wantsSwapFlow: boolean;
  wantsWeb: boolean;
  urgent: boolean;
  technical: boolean;
};

function getSignals(query: string): QuerySignals {
  const q = query.toLowerCase();
  const wantsSwapFlow = /(swap|schimb|buy|cump[aă]r|sell|v[âa]nd|dedust|ston\.fi|liquidity|pool|tvl)/i.test(
    q,
  );
  const wantsLiveData = wantsSwapFlow || /(price|pre[tț]|usd|ton\/usd|chart|volum|volume|market cap|cap)/i.test(q);
  const wantsWeb = /(azi|astăzi|today|latest|recent|știri|stiri|news|link|surse|sources|citeaz)/i.test(q);
  const urgent = /(rapid|repede|urgent|asap|imediat)/i.test(q);
  const technical = /(api|endpoint|typescript|vite|react|node|edge runtime|prompt|llm|agent|protocol)/i.test(q);
  return { wantsLiveData, wantsSwapFlow, wantsWeb, urgent, technical };
}

export function decideCetAiRavPlan(args: {
  query: string;
  conversationTurns: number;
  hasGemini: boolean;
  hasGrok: boolean;
  hasClaude: boolean;
  budget: CetAiResourceBudget;
}): CetAiRavPlan {
  const signals = getSignals(args.query);
  const longQuery = args.query.trim().length >= 380;
  const multiTurn = args.conversationTurns > 0;

  const useOnChain = signals.wantsLiveData;
  const useWebRetrieval = signals.wantsWeb;

  const canDual = args.hasGemini && args.hasGrok && args.budget.maxParallel >= 2;
  const preferDual = canDual && args.budget.budgetMs >= 2200 && !signals.urgent && !longQuery;

  let providers: CetAiProviderPlan;
  if (preferDual) {
    providers = { strategy: "dual", useGemini: true, useGrok: true };
  } else {
    const singleProvider: "gemini" | "grok" | "claude" =
      args.hasClaude && (signals.technical || multiTurn || longQuery)
        ? "claude"
        : args.hasGrok && (signals.technical || multiTurn || signals.wantsSwapFlow)
          ? "grok"
          : args.hasGemini
            ? "gemini"
            : args.hasGrok
              ? "grok"
              : "claude";
    providers = {
      strategy: "single",
      singleProvider,
      useGemini: singleProvider === "gemini",
      useGrok: singleProvider === "grok",
      useClaude: singleProvider === "claude",
    };
  }

  const agents: CetAiRavPlan["agents"] = ["router", "curated_retriever"];
  if (useWebRetrieval) agents.push("web_retriever");
  if (useOnChain) agents.push("onchain_observer");
  agents.push("reasoner", "actor", "verifier");

  if (preferDual) {
    agents.push("consensus_engine", "hallucination_guard");
  }

  const phases: CetAiRavPhase[] = ["plan", "observe", "synthesize", "verify"];

  const temperature = signals.technical ? 0.2 : 0.3;

  return {
    budget: args.budget,
    providers,
    useOnChain,
    useWebRetrieval,
    agentCount: agents.length,
    agents,
    phases,
    temperature,
  };
}

/**
 * RAV v2 Consensus Heuristic
 * Reconciles dual-provider outputs by prioritizing factual DeDust/TON data
 * and penalizing specific "hallucination markers".
 */
export function synthesizeConsensus(args: {
  geminiReply: string;
  grokReply: string;
  onChainContext?: { cetPriceUsd: string; tonPriceUsd: string } | null;
}): string {
  const { geminiReply, grokReply, onChainContext } = args;

  // If no on-chain data to anchor to, we perform a linguistic synthesis
  if (!onChainContext) {
    return `${geminiReply.trim()}\n\n${grokReply.trim()}`;
  }

  const cetPrice = parseFloat(onChainContext.cetPriceUsd);
  const tonPrice = parseFloat(onChainContext.tonPriceUsd);

  const scoreReply = (text: string) => {
    let score = 0;
    // Check for correct price mentions if they exist in text
    const mentions = text.match(/\$\d+\.\d+/g) || [];
    for (const m of mentions) {
      const val = parseFloat(m.slice(1));
      if (Math.abs(val - cetPrice) < 0.001 || Math.abs(val - tonPrice) < 0.05) {
        score += 10;
      } else {
        score -= 5; // Penalty for wrong prices
      }
    }

    // Penalize common hallucination patterns
    if (/9,000,000/.test(text)) score -= 20; // It's 9,000 not 9M
    if (/Ethereum|Solana|BSC/i.test(text) && !/TON/i.test(text)) score -= 15;

    return score;
  };

  const gScore = scoreReply(geminiReply);
  const xScore = scoreReply(grokReply);

  // If one is significantly better anchored, use it as primary
  if (gScore > xScore + 10) return geminiReply;
  if (xScore > gScore + 10) return grokReply;

  // Otherwise, default to the dual structure but prepend the verified data
  return `[Verified] CET: $${onChainContext.cetPriceUsd} | TON: $${onChainContext.tonPriceUsd}\n\n${geminiReply.trim()}\n\n${grokReply.trim()}`;
}
