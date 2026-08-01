# 2026-08-02 Install Project Skills

- [x] Confirm and inspect trusted sources for the three approved skills
- [x] Install project-local skill artifacts under `.claude/skills/`
- [x] Verify skill files, metadata, and referenced support files
- [x] Verify Claude Code discovery/loadability where supported
- [x] Review diff and document results

## Acceptance criteria

- `nextjs-app-router-patterns`, `vercel-react-best-practices`, and `next-dev-loop` are installed locally from trusted sources.
- No Next.js app, package files, speculative hooks, or permissions are added.
- Installation contents and verification evidence are documented.

## Risk & Rollback

- Risk: skill artifacts may include commands or assumptions that do not fit this empty repository.
- Mitigation: inspect artifacts before accepting them; defer hooks and app commands.
- Rollback: remove only the three installed skill directories.

## Dependencies & Environment

- Node.js/npm tooling available through `npx`.
- No existing application scripts or package manifest.

## Working Notes

- User approved Vercel's published `vercel-react-best-practices` as the React best-practices skill.
- Sources: `wshobson/agents`, `vercel-labs/agent-skills`, and `vercel/next.js`.
- Repository has no commits or remotes.

## Results

- Installed project-local skills with `npx skills add`:
  - `nextjs-app-router-patterns` from `wshobson/agents`
  - `vercel-react-best-practices` from `vercel-labs/agent-skills` (the approved published name for the requested React skill)
  - `next-dev-loop` from `vercel/next.js`
- The installer created canonical artifacts under `.agents/skills/` and Claude Code symlinks under `.claude/skills/`.
- `skills-lock.json` records source paths and computed hashes.
- Installer security assessments reported App Router: Safe/Low Risk, React: Safe/Low Risk, and dev loop: Safe/Medium Risk.
- `npx skills list` reports all three as project skills for Claude Code.
- No Next.js app, package manifest, settings, hooks, permissions, commit, or remote was added.
- Runtime dev-loop verification is deferred because this repository has no app or `next dev` command yet.
