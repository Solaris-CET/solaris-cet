# Graphify on Windows — SOLARIS CET notes

**Upstream:** https://github.com/Graphify-Labs/graphify

## Commands (canonical)

```bash
python -m pip install graphifyy
npm run graphify:install    # once per clone — Cursor + agents + Claude skills
npm run graphify:build      # code-only merged graph → graphify-out/graph.json
npm run graphify:prime -- "<topic>"
npm run graphify:update     # after code edits (AST-only)
```

## Do not run manually

| Command | Why it fails |
|---------|----------------|
| `graphify .` | ~59 docs need LLM key |
| `graphify extract app` | mixed docs/images trigger LLM |
| `graphify extract app/api/lib` | often **0 TS nodes** on Windows subfolder scan |

Use `npm run graphify:build` — merges `survey-engine/src`, `app/api`, `app/src`, `contracts`.

## Full graph (docs + wiki)

Set `DEEPSEEK_API_KEY` or `GEMINI_API_KEY`, then:

```bash
python -m graphify . --no-viz --wiki
```

## Agent rule

Query graph **before** blind Grep/Read. Skill: `.agents/skills/graphify/SKILL.md`