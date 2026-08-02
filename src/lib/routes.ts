/**
 * Centralized route helpers.
 *
 * Source hrefs are kept trailing-slash-less so they satisfy Next.js
 * `typedRoutes: true` (typed static routes are `/about`, `/timeline`, … and
 * dynamic routes are `/story/${SafeSlug<T>}`). `next.config.ts` sets
 * `trailingSlash: true`, so the static export rewrites these to the
 * trailing-slash form (`/timeline/`, `/story/{id}/`) required by the spec.
 *
 * `getStoryHref` only accepts the ASCII-slug shape enforced by the content
 * build (`/^[a-z0-9-]+$/` in `scripts/build-content.ts`). Any other value —
 * including `undefined`, empty, or a slug containing a path separator —
 * returns `null`, so callers can decide to render nothing instead of a
 * broken link such as `/story/undefined/`.
 */

const STORY_ID_PATTERN = /^[a-z0-9-]+$/;

/** Fixed top-level navigation routes, in header/footer order. */
export const ROUTES = {
  home: "/",
  timeline: "/timeline",
  preface: "/preface",
  afterword: "/afterword",
  about: "/about",
} as const;

/**
 * Returns a story route href for a valid ASCII slug, or `null` when the slug
 * is missing/invalid. The return type is the typed dynamic-route template
 * (`/story/${string}`) so it satisfies Next.js `typedRoutes: true` without a
 * cast at call sites; the `| null` keeps callers honest — they must guard
 * before rendering a Link, which is exactly the protection we want at the
 * timeline boundary (no `/story/undefined/`).
 */
export function getStoryHref(storyId: string | null | undefined): `/story/${string}` | null {
  if (typeof storyId !== "string" || storyId.length === 0) return null;
  if (!STORY_ID_PATTERN.test(storyId)) return null;
  return `/story/${storyId}`;
}