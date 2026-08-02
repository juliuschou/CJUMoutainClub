# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static website for the Chang Jung University Mountain Club alumni association's 10-year anniversary hiking-story collection. The site is built around three layers — **time** (the timeline interface), **story** (one card per activity), **evidence** (the activity photos). Content is sourced from historical Markdown under `docs/stories/` and transformed at build time into route-safe WebP + JSON.

The repo is a **Next.js 16 App Router** project (React 19, TypeScript, Tailwind 4) configured for **pure static export** (`output: "export"`, `trailingSlash: true`, `images.unoptimized`). There is no server runtime — everything in `out/` after `npm run build` is plain static files, deployed to Cloudflare Pages (`cjuobhiking`).

## Commands

| Task | Command |
| --- | --- |
| Dev server (builds content first, then `next dev --turbopack`) | `npm run dev` |
| Production build → static export to `out/` | `npm run build` (runs `content:clean` first) |
| Preview the static export locally | `npm run preview` (serves `out/` on 127.0.0.1:4173) |
| Regenerate derived content only | `npm run content:build` |
| Validate content without writing files (CI gate) | `npm run content:check` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit/component tests (Vitest) once | `npm run test` |
| Vitest watch mode | `npm run test:watch` |
| **Run a single Vitest test file** | `npx vitest run tests/lib/routes.test.ts` |
| **Run one Vitest test by name** | `npx vitest run -t "name fragment"` |
| Install Playwright browser (one-time) | `npx playwright install chromium` |
| E2E (responsive + link suite) | `npm run test:e2e` |
| Run E2E against a deployed URL | `BASE_URL=https://<project>.pages.dev npm run test:e2e` |
| Check broken links in `out/` | `npm run check:links` |
| Full static-export gate | `npm run verify:export` (= build + check:links) |
| Deploy to Cloudflare Pages | `npm run deploy` (builds first; requires `npx wrangler login`) |

The full CI-equivalent local gate, in order:

```bash
npm run content:check && npm run typecheck && npm run lint && npm test \
  && npm run build && npm run check:links && npm run test:e2e
```

Node ≥ 20.9.0 (`mise.toml` pins 26). WMF images require system **ImageMagick** (build prefers `magick` v7, falls back to `convert` v6); CI installs it via apt.

## The content-build boundary (most important thing to know)

Derived artifacts are **generated, never hand-edited**:

- `src/generated/*.json` (`stories`, `timeline`, `evidence`, `preface`, `afterword`, `manifest`) — produced by `scripts/build-content.ts`.
- `public/media/**/*.webp` — build-time WebP derivatives (thumb/display/full). `public/media/` is gitignored.

All of these are regenerated from three authoritative sources:

1. **`docs/stories/`** — original historical Markdown + photos. **Treat as read-only.** Never rewrite source Markdown or images. Year/month directories contain `<story>.md` + `images/`. `前言/前言.md` holds the activity table (44 rows); `後记/後记.md` holds publication info.
2. **`src/content/story-map.ts`** — the **only** mapping from activity-table sequence numbers to story directories. Uses explicit `sequenceNumber` ↔ `storyId` (ASCII slug like `94-07-daxueshan-orientation`) ↔ `sourceDirectory`. `source: "table"` (from the activity table) vs `"story-only"` (inserted, e.g. seq 24). **No fuzzy location matching** — every link is explicit here.
3. **`src/content/overrides.ts`** — non-derivable corrections: authors, location, summary, and the `DECORATIVE_ASSETS` set + `KNOWN_AUTHORS` list. Use this instead of stacking fragile regex heuristics.

`scripts/build-content.ts` orchestrates: parses the preface table → applies the map → applies overrides → parses each Markdown + extracts image refs → runs `sharp` (and ImageMagick for WMF) → emits JSON + WebP. It enforces **invariants** (activity-row count, media-file count, story count, etc.); any mismatch fails the build, keeping derived data consistent with sources. Output counts are recorded in `src/generated/manifest.json` — read it to see current data scale; don't copy stale numbers.

When changing content:
- New/changed source story → `docs/stories/` (only if explicitly requested).
- Sequence/slug/source-dir/source-type change → `src/content/story-map.ts` + update `tests/content/story-build.test.ts`.
- Author/location/summary/decorative-image change → `src/content/overrides.ts`.
- Then `npm run content:build` and **review the generated-JSON diff** before committing.

## Architecture

### App Router routes (`src/app/`)
- `/` — home (featured story, `FEATURED_STORY_ID` in `src/content/site.ts`)
- `/timeline/` — interactive 45-node timeline
- `/story/[storyId]/` — single story card (`storyId` = ASCII slug)
- `/preface/`, `/afterword/`, `/about/`

### Data access layer (`src/lib/`)
- `types.ts` — all shared types (`StoryRecord`, `TimelineNode`, `Evidence`, `BuildManifest`, etc.). **Start here** when understanding data shape.
- `stories.ts`, `timeline.ts`, `evidence.ts`, `preface.ts`, `afterword.ts`, `manifest.ts` — read the generated JSON and provide typed accessors.
- `routes.ts` — centralized route helpers. `ROUTES` holds trailing-slash-less hrefs (satisfies `typedRoutes: true`); `next.config.ts`'s `trailingSlash: true` rewrites them to the trailing-slash form at export. `getStoryHref(storyId)` returns `null` for missing/invalid slugs — **callers must guard**; this prevents `/story/undefined/` at the timeline boundary.

### Components (`src/components/`)
- Server Components by default. **Client Components are kept narrow**: `timeline/timeline-explorer.tsx` (timeline interaction), `story/story-interactive.tsx` (story client wrapper), `evidence-lightbox.tsx` (Lightbox), and anything needing browser APIs/focus.
- `story/story-markdown.tsx` renders Markdown (remark → react-markdown + remark-gfm) and image evidence.
- Responsive layout, focus management, reduced-motion, and forced-colors live in `src/app/globals.css`.

### Existing contracts to preserve
- Timeline nodes with a story render as a single native link; cancelled / no-story nodes stay non-interactive (never produce a broken link).
- Decorative images (in `DECORATIVE_ASSETS`) do **not** enter the Lightbox.
- Lightbox: Escape, arrow keys, modal focus trap, and focus restoration on close.
- Tables scroll horizontally; mobile timeline is readable; status is conveyed by symbol + label + color (not color alone).
- Story `storyId` slugs must match `/^[a-z0-9-]+$/` (enforced in the build).

## Testing layout

- `tests/**/*.test.{ts,tsx}` — Vitest (jsdom, setup in `tests/setup.ts`). Mirrors `src/`: `app/`, `components/`, `content/`, `lib/`, `scripts/`. `tests/scripts/build-content.test.ts` and `tests/content/story-build.test.ts` pin content-build invariants — **update these when the map or overrides change**.
- `tests/e2e/responsive-links.spec.ts` — Playwright, Chromium only. Per-test viewport emulation covers the responsive matrix; runs against `npm run preview` (or `BASE_URL`).
- `tests/__fixtures__/` and `test-results/` are gitignored.
- `scripts/check-static-links.ts` is dependency-free (Node built-ins only); its parsing/validation logic is exported as pure functions for unit testing.

## CI (`.github/workflows/verify.yml`)

Runs on push/PR to `main`: installs Node 20.19, Playwright Chromium, and ImageMagick, then `content:check` → typecheck → lint → vitest → build → `check:links` → `test:e2e`. **Deploy to Cloudflare Pages is NOT automated** — run `npm run deploy` manually.

## Workflow skill

This repo has a project skill, `mountain-club-site-workflow` (`.agents/skills/...`, surfaced as `/mountain-club-site-workflow`). It encodes the boundaries above in more detail and points to `references/content-pipeline.md` and `references/verification.md`. Reach for it when adding/revising stories, mappings, metadata, generated content, or release verification. Related installed skills: `nextjs-app-router-patterns`, `vercel-react-best-practices`, `next-dev-loop`, `dataviz`.

## Task tracking

`tasks/todo.md` holds the active checklist and `tasks/lessons.md` holds post-mortem lessons (per the global workflow guidelines). Non-trivial work should update `tasks/todo.md` with testable acceptance criteria and a verification story.