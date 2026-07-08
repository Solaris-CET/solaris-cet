

<!-- stash-context -->
## Stash

This repo uses [Stash](https://joinstash.ai) for shared agent sessions.
Your coding agent has the `stash` CLI on its PATH. Run `stash --help` to see commands.

**Before starting work, use Stash to check for relevant context.** When you need to understand
why something was built a certain way, what's been tried before, or what teammates are working on,
search Stash first — it has the full session record and human decisions across the team.

### What a Skill is

A Skill is a *special folder* — one containing a SKILL.md — holding related artifacts
(pages, files, tables) that shares like any folder and gains a public URL when
published. Use one when you're publishing a *collection* of related things together — a
project writeup with its supporting files, a research thread with its sources, a session
transcript frozen as a page plus the files it produced.

A Skill is **not** a wrapper to slap on every single file you happen to share. One-item Skills
clutter Discover and defeat the model. Pick the right tool:

- Share a single file or a folder/project → `stash upload <path> --json`, hand over `app_url` (no Skill).
- Publishing a curated bundle → `stash upload <path> --skill "<title>" --json`.
- Creating a fresh skill → `stash skills create "<name>" --public --json`.
- Share a coding session → `stash share <session_id>`.

Run `stash prompts agent-guidance` to reprint this rule mid-session.

### Browsing Stash

Use `stash vfs` when you want to browse Stash like a filesystem without mounting anything into the OS:
- `stash vfs ls /`
- `stash vfs "find / -maxdepth 3 -type f"`
- `stash vfs "rg 'query' /"`
- `stash vfs "cat '/files/README.md' | sed -n '1,80p'"`

Common reads:
- `stash search "<query>" --json` — full-text search across files, sessions, and connected sources
- `stash vfs "ls /"` — browse your files, sessions, tables, skills, and connected sources
- `stash vfs "cat '/sessions/_index.jsonl'"` — recent sessions
- `stash sessions agents` — who's been active

Common writes:
- `stash share --title "..."` — share this session as a public Skill
- `stash read <url>` — read a public Skill URL

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
