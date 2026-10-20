# Formedible v0.5.1

Formedible now teaches AI coding agents how to use it, automatically.

## What's new

- **The Formedible agent skill ships with the component.** Installing `formedible-core` now also writes the Formedible agent skill (`SKILL.md`) to `.claude/skills/formedible/` and `.agents/skills/formedible/` in your project, so coding agents (Claude Code and the agents reading `.agents/skills/` — Codex, Amp, Cline, and others) immediately know the API, field types, and validation patterns. No extra command, no config; the skill updates whenever you re-run the install.
- **Agents that need it separately**: the same skill is installable on its own for ~79 agents via the open skills ecosystem:

  ```bash
  pnpm dlx skills add DimitriGilbert/Formedible
  ```

- Refreshed the skill's source provenance to the released v0.5 lineage and pointed all documentation source links at `main`.

## Installing

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json
```

No API changes; everything in [v0.5.0](https://github.com/DimitriGilbert/Formedible/releases/tag/v0.5.0) applies unchanged.
