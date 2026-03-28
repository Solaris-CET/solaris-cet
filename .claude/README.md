# `.claude` — project agent context

This folder holds **skills** (cognitive-style modules) and a **prime** command used to load them in a fixed order at session start.

| Path | Role |
|------|------|
| `skills/metacognition/SKILL.md` | Self-monitoring: scope, time, diversity, blast radius |
| `skills/active_inference/SKILL.md` | Belief updates, free energy, goal-directed vs exploratory action |
| `skills/tree_search/SKILL.md` | LATS / DARS for branching search and recovery from low diversity |
| `skills/memory/SKILL.md` | Associative retrieval and consolidation patterns |
| `commands/prime` | Ordered list of skills to load before tasks |

**Suggested use:** run or paste the contents of `commands/prime` when starting a long session so all contracts stay in context.

Skills use YAML frontmatter so Cursor (and similar tools) can discover them by `name` and `description`.
