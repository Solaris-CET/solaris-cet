---
name: solaris-perfect-loops
description: Use this skill when working on SOLARIS CET to enforce perfect Grok working loops, avoid previous mistakes like missing docs, half-solutions, unclear API routing, dangling threads, and poor cost control. Trigger words include perfect loops, boil the ocean, agent loop, research loop, build loop.
---

# SOLARIS CET - Perfect Grok Loops & Rules

## Core Philosophy (NEVER BREAK)
"Boil the ocean. The marginal completeness is near zero with AI. Do the whole thing. Do it right. Do it with tests. Do it with documentation. Do it so well that I am genuinely impressed, not politely satisfied. Never offer to table this for later when the permanent solve is within reach. Never leave a dangling thread when tying it off takes five more minutes. Never present a workaround when the real fix exists. The standard isn't good enough. It's 'holy shit, that's done.' Search before building. Test before shipping. Ship the complete thing."

## The 5 Mandatory Loops (use in this order)

### 1. Research Loop (always first for new features)
- Understand the real user pain from solar installer workflow (DC/AC/ACM checklists, photos, reports)
- Study existing checklist examples from user
- Identify exact inputs and desired outputs
- Check previous mistakes in global.md and grok.md before starting
- Only after full understanding → move to Build Loop

### 2. Build Loop (for every feature)
1. Plan the complete solution in detail (architecture, files, prompts)
2. Write clean, production-ready code
3. Test on real user data / photos / checklists
4. Fix all issues found
5. Document everything (update global.md, grok.md, prompts/)
6. Optimize for cost and speed
7. Only then mark as done

### 3. Optimization Loop (after every important feature)
- Measure token usage and cost
- Find ways to use cheaper models (DeepSeek for heavy work)
- Reduce context where possible
- Improve speed without losing quality
- Update rules in grok.md if better pattern found

### 4. Agent Loop (how Grok works with other models)
- Grok Heavy (you) = Manager: always plans, reviews quality, makes final decisions, updates docs
- DeepSeek V4 Pro = Main Worker: heavy coding, photo analysis, checklist processing, data extraction
- Claude = Only for high-quality writing or complex reasoning when DeepSeek is not enough
- Kimi = Only for very long context (many photos + long documents)
- Rule: Never do heavy work yourself if DeepSeek can do it cheaper and well. Always review worker output strictly.

### 5. Feedback Loop (every time user tests)
- User tests → gives feedback
- Analyze what went wrong or could be better
- Update global.md or grok.md immediately with new rule
- Improve the prompt or code in next iteration
- Never ignore feedback or say "we can fix later"

## Strict Rules to Avoid Previous Mistakes

- ALWAYS create/update global.md and grok.md when making important decisions
- NEVER give half-solutions or "this is a starting point"
- NEVER leave dangling threads
- NEVER use workaround when real fix exists
- ALWAYS specify exactly which API/model to use and why
- ALWAYS think about cost from the beginning (prefer DeepSeek for volume)
- ALWAYS test with real user photos and checklists before claiming done
- ALWAYS update the instructions in the Grok project when loops or rules change
- If something is unclear → ask user for clarification instead of guessing

## API Routing Rules (imprinted)

- Planning, architecture, final review, quality gate → Grok Heavy
- Heavy coding, photo understanding, checklist filling, data extraction → DeepSeek V4 Pro (main worker)
- Beautiful professional writing, complex reasoning → Claude (backup)
- Very long context (20+ photos + long docs) → Kimi

## How to Use This Skill
When user says "use perfect loops" or "follow the loops", activate this skill and strictly follow all 5 loops + core philosophy in every response and every piece of code you generate for SOLARIS CET.