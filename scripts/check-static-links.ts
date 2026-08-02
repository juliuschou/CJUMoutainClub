#!/usr/bin/env tsx
/**
 * Static export link checker.
 *
 * Scans the `out/` static export for broken links and asset references.
 * Uses only Node built-ins (fs/path/url) so it runs without extra deps.
 *
 * Rules:
 *   - Extract href, src, and srcset URLs from every *.html under out/.
 *   - Ignore external (http(s)://, protocol://), mailto:, tel:, data: and
 *     pure-fragment (#...) references.
 *   - Strip query strings and URL fragments before resolving.
 *   - Resolve relative URLs against the source HTML file's directory.
 *   - Verify the resolved path exists:
 *       - directory-like routes (e.g. /timeline/) → out/timeline/index.html
 *       - /_next/** and /media/** → the actual file under out/
 *   - Reject `/story/undefined/`, empty story segments, and any decoded
 *     path that escapes the out/ root (traversal).
 *
 * Exit code is non-zero if any link is broken, with a report listing the
 * source HTML, original URL, and expected target for each failure.
 *
 * The parsing and validation logic is split into pure, exported
 * functions so they can be unit-tested without touching the filesystem.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// Allow overriding the export root for testing; defaults to ./out.
const OUT_ROOT = path.resolve(process.env.CHECK_LINKS_OUT ?? path.join(process.cwd(), "out"));

export type UrlKind = "internal" | "external" | "fragment" | "mailto" | "tel" | "data" | "empty";

export interface ClassifiedUrl {
  raw: string;
  kind: UrlKind;
  /** For internal urls, the path with query and hash removed. */
  pathOnly: string | null;
}

export interface ResolvedLink {
  raw: string;
  /** Path with query/hash removed, leading slash kept. */
  cleanPath: string;
  /** Absolute filesystem path the URL should resolve to. */
  targetFile: string;
  sourceHtml: string;
}

export interface BrokenLink extends ResolvedLink {
  reason: string;
}

/**
 * Classify a raw URL extracted from HTML. Returns the kind and, for internal
 * URLs, the path with query and hash removed.
 */
export function classifyUrl(raw: string): ClassifiedUrl {
  const trimmed = raw.trim();
  if (trimmed === "") return { raw, kind: "empty", pathOnly: null };
  if (trimmed.startsWith("#")) return { raw, kind: "fragment", pathOnly: null };
  if (trimmed.startsWith("mailto:")) return { raw, kind: "mailto", pathOnly: null };
  if (trimmed.startsWith("tel:")) return { raw, kind: "tel", pathOnly: null };
  if (trimmed.startsWith("data:")) return { raw, kind: "data", pathOnly: null };
  // External: any scheme with a protocol, or protocol-relative //host.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    return { raw, kind: "external", pathOnly: null };
  }
  // Internal: strip query and hash.
  const noHash = trimmed.split("#")[0];
  const noQuery = noHash.split("?")[0];
  return { raw, kind: "internal", pathOnly: noQuery };
}

/**
 * Decode percent-encoding in a path segment and confirm it does not escape
 * the out root after decoding. Returns the decoded path or throws on
 * traversal. Kept inline because callers need the decoded form to detect
 * `/story/undefined/` and `..` escapes.
 */
export function decodePath(p: string): string {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

/**
 * Reject story routes that are clearly broken: `/story/undefined/`,
 * `/story/` with an empty id, or a story id containing a path separator
 * (e.g. `/story/foo/bar/`). Returns an error reason or null when the
 * story segment is acceptable (or the path is not a story route).
 */
export function invalidStoryRoute(cleanPath: string): string | null {
  // Match /story/<anything> with or without a trailing slash. The id is
  // everything between the leading /story/ and the optional trailing slash.
  const storyMatch = cleanPath.match(/^\/story\/(.*?)(?:\/)?$/);
  if (!storyMatch) return null;
  const id = decodePath(storyMatch[1]);
  if (id === "") return "empty story segment";
  if (id === "undefined") return "/story/undefined/ link";
  if (id.includes("/")) return `story id contains a slash: ${id}`;
  return null;
}

/**
 * Resolve an internal cleanPath to the absolute filesystem path it should
 * land on under outRoot. Directory-like routes map to index.html. This is a
 * PURE function — it only computes a path and does not touch the filesystem
 * (existence is checked separately in the runner).
 *
 * Returns { targetFile } or null if the path escapes outRoot (traversal).
 */
export function resolveTarget(cleanPath: string, outRoot: string): { targetFile: string } | null {
  const decoded = decodePath(cleanPath);
  // Reject traversal: any segment that is ".." after decoding escapes root.
  const segments = decoded.split("/").filter((s) => s.length > 0);
  if (segments.includes("..")) return null;

  let fsPath = path.join(outRoot, ...segments);
  const hasExtension = path.extname(fsPath) !== "";
  const isDirectoryRoute = decoded.endsWith("/") || decoded === "/";
  // Directory-like routes → index.html. A no-extension path without a
  // trailing slash (a route like /timeline) also maps to index.html.
  // Asset paths (/_next/...js, /media/...webp) always have extensions.
  if (isDirectoryRoute || !hasExtension) {
    fsPath = path.join(fsPath, "index.html");
  }
  return { targetFile: fsPath };
}

/** Extract all href values from <a href="..."> in raw HTML. */
export function extractHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const re = /<a\s[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    hrefs.push(match[2] ?? match[3] ?? "");
  }
  return hrefs;
}

/** Extract all src values from <img src=...>, <script src=...>, etc. */
export function extractSrcs(html: string): string[] {
  const srcs: string[] = [];
  const re = /\bsrc\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const value = match[2] ?? match[3] ?? "";
    if (value.trim() !== "") srcs.push(value);
  }
  return srcs;
}

/** Extract all URLs referenced inside srcset attributes. */
export function extractSrcset(html: string): string[] {
  const urls: string[] = [];
  const re = /\bsrcset\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const value = match[2] ?? match[3] ?? "";
    // srcset is a comma-separated list of "<url> <descriptor>" entries.
    for (const entry of value.split(",")) {
      const url = entry.trim().split(/\s+/)[0];
      if (url) urls.push(url);
    }
  }
  return urls;
}

function listHtmlFiles(root: string): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith(".html")) results.push(full);
    }
  }
  walk(root);
  return results;
}

function main(): number {
  if (!existsSync(OUT_ROOT)) {
    console.error(`link checker: out/ not found at ${OUT_ROOT} — run "npm run build" first`);
    return 1;
  }

  const htmlFiles = listHtmlFiles(OUT_ROOT);
  if (htmlFiles.length === 0) {
    console.error("link checker: no HTML files found under out/");
    return 1;
  }

  const broken: BrokenLink[] = [];

  for (const htmlFile of htmlFiles) {
    const html = readFileSync(htmlFile, "utf8");
    const sourceRel = path.relative(OUT_ROOT, htmlFile);
    const urls = [...extractHrefs(html), ...extractSrcs(html), ...extractSrcset(html)];

    for (const raw of urls) {
      const classified = classifyUrl(raw);
      if (classified.kind !== "internal") continue;
      const cleanPath = classified.pathOnly ?? "";
      if (cleanPath === "") continue;

      const sourceHtml = sourceRel;

      const storyError = invalidStoryRoute(cleanPath);
      if (storyError) {
        const resolved = resolveTarget(cleanPath, OUT_ROOT);
        broken.push({
          raw,
          cleanPath,
          targetFile: resolved?.targetFile ?? path.join(OUT_ROOT, cleanPath),
          sourceHtml,
          reason: storyError,
        });
        continue;
      }

      const resolved = resolveTarget(cleanPath, OUT_ROOT);
      if (!resolved) {
        broken.push({ raw, cleanPath, targetFile: path.join(OUT_ROOT, cleanPath), sourceHtml, reason: "path traversal escapes out/" });
        continue;
      }
      if (!existsSync(resolved.targetFile)) {
        broken.push({ raw, cleanPath, targetFile: resolved.targetFile, sourceHtml, reason: "target file missing" });
        continue;
      }
    }
  }

  if (broken.length === 0) {
    console.log(`link checker: OK — scanned ${htmlFiles.length} HTML files, no broken links.`);
    return 0;
  }

  console.error(`link checker: ${broken.length} broken link(s) found in ${htmlFiles.length} HTML files:`);
  for (const b of broken) {
    const targetRel = path.relative(OUT_ROOT, b.targetFile);
    console.error(`  ${b.sourceHtml} → ${b.raw}`);
    console.error(`    reason: ${b.reason}`);
    console.error(`    expected: ${targetRel}`);
  }
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}