import { describe, expect,it } from "vitest";

import { decideCetAiRavPlan, deriveCetAiResourceBudget } from "../../api/lib/reactBrain";

describe("api/lib/reactBrain", () => {
  it("derives budget from headers with clamping", () => {
    const req = new Request("https://example.com/api/chat", {
      headers: {
        "x-cet-ai-budget-ms": "50",
        "x-cet-ai-max-parallel": "9",
      },
    });
    const budget = deriveCetAiResourceBudget(req);
    expect(budget.budgetMs).toBe(500);
    expect(budget.maxParallel).toBe(4);
  });

  it("enables on-chain observer for price/pool queries", () => {
    const budget = { budgetMs: 4000, maxParallel: 2 };
    const plan = decideCetAiRavPlan({
      query: "Care e prețul CET/USD și TVL în pool pe DeDust?",
      conversationTurns: 0,
      hasGemini: true,
      hasGrok: true,
      hasClaude: false,
      budget,
    });
    expect(plan.useOnChain).toBe(true);
    expect(plan.agents.includes("onchain_observer")).toBe(true);
  });

  it("enables web retrieval for latest/news queries", () => {
    const budget = { budgetMs: 4000, maxParallel: 2 };
    const plan = decideCetAiRavPlan({
      query: "Ai știri recente azi despre Solaris CET? dă surse.",
      conversationTurns: 0,
      hasGemini: true,
      hasGrok: true,
      hasClaude: false,
      budget,
    });
    expect(plan.useWebRetrieval).toBe(true);
    expect(plan.agents.includes("web_retriever")).toBe(true);
  });

  it("switches to single-provider under urgency even when both keys exist", () => {
    const budget = { budgetMs: 8000, maxParallel: 2 };
    const plan = decideCetAiRavPlan({
      query: "Urgent: explică rapid RAV protocol.",
      conversationTurns: 0,
      hasGemini: true,
      hasGrok: true,
      hasClaude: false,
      budget,
    });
    expect(plan.providers.strategy).toBe("single");
  });

  it("chooses grok for swap/technical work when available", () => {
    const budget = { budgetMs: 1200, maxParallel: 1 };
    const plan = decideCetAiRavPlan({
      query: "Cum fac swap pe DeDust și ce verific înainte?",
      conversationTurns: 2,
      hasGemini: true,
      hasGrok: true,
      hasClaude: false,
      budget,
    });
    expect(plan.providers.strategy).toBe("single");
    if (plan.providers.strategy === "single") {
      expect(plan.providers.singleProvider).toBe("grok");
    }
  });
});
