# `.claude` — Claude Code project configuration

This directory follows [Claude Code’s project layout](https://code.claude.com/docs/en/claude-directory): instructions, settings, rules, skills, and slash commands. Commit these files so the team shares the same agent behaviour.

## Files

| Path | Role |
|------|------|
| `CLAUDE.md` | Project instructions loaded every session (build/test commands, layout) |
| `settings.json` | Shared settings (`$schema` for editor validation; extend with permissions, hooks, env as needed) |
| `settings.local.json` | **Optional, gitignored** — personal overrides (create locally) |
| `rules/app-frontend.md` | Rules scoped to `app/**/*.{ts,tsx}` |
| `skills/*/SKILL.md` | Cognitive-style modules (YAML frontmatter for discovery) |
| `commands/prime.md` | Slash command **`/prime`** — loads all skills in order |

## Quick checks in Claude Code

| Command | Use |
|---------|-----|
| `/memory` | See which `CLAUDE.md` and rules loaded |
| `/skills` | List available skills |
| `/context` | Token usage breakdown |
| `/prime` | Run the Prime prompt (load four skills) |

## Skills (reference)

| Skill | Focus |
|-------|--------|
| `metacognition` | Scope, time, diversity, blast radius |
| `active_inference` | Beliefs, free energy, explore vs exploit |
| `tree_search` | LATS / DARS branching |
| `memory` | Associative retrieval and consolidation |

**Suggested use:** run `/prime` when starting a deep session so skill contracts stay in context.
