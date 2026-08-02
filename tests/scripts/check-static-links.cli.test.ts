import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

const FIXTURE = path.resolve(process.cwd(), "tests/__fixtures__/out-fixture");

beforeAll(() => {
  rmSync(FIXTURE, { recursive: true, force: true });
  mkdirSync(path.join(FIXTURE, "timeline"), { recursive: true });
  mkdirSync(path.join(FIXTURE, "story", "87-05-wushan"), { recursive: true });
  mkdirSync(path.join(FIXTURE, "_next", "static"), { recursive: true });
  mkdirSync(path.join(FIXTURE, "media"), { recursive: true });

  writeFileSync(path.join(FIXTURE, "index.html"), "index");
  writeFileSync(path.join(FIXTURE, "timeline", "index.html"), "timeline");
  writeFileSync(path.join(FIXTURE, "story", "87-05-wushan", "index.html"), "wushan");
  writeFileSync(path.join(FIXTURE, "_next", "static", "app.js"), "app");
  writeFileSync(path.join(FIXTURE, "media", "ok.webp"), "ok");

  // A page with a good link, a broken link, an undefined story link, a
  // missing asset, and an external link (which should be ignored).
  writeFileSync(
    path.join(FIXTURE, "timeline", "index.html"),
    `<a href="/timeline/">good</a>
<a href="/missing-page/">bad</a>
<a href="/story/undefined/">ugly</a>
<a href="/story//">empty</a>
<img src="/media/missing.webp" />
<img src="/media/ok.webp" />
<img srcset="/_next/static/app.js 1x" />
<a href="https://example.com/">ext</a>
<a href="#fragment">frag</a>`,
  );
});

afterAll(() => {
  rmSync(FIXTURE, { recursive: true, force: true });
});

function runChecker(env: Partial<NodeJS.ProcessEnv> = {}) {
  try {
    const stdout = execFileSync(
      "npx",
      ["tsx", "scripts/check-static-links.ts"],
      {
        env: { ...process.env, CHECK_LINKS_OUT: FIXTURE, ...env },
        encoding: "utf-8",
      },
    );
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; status?: number };
    return { code: e.status ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

describe("check-static-links CLI", () => {
  it("exits non-zero and reports each broken link with source and target", () => {
    const result = runChecker();
    const combined = result.stdout + result.stderr;
    expect(result.code).not.toBe(0);
    expect(combined).toContain("/story/undefined/");
    expect(combined).toContain("/missing-page/");
    expect(combined).toContain("/media/missing.webp");
    expect(combined).toContain("empty story segment");
    // External and fragment links are ignored (no false positives for them).
    expect(combined).not.toContain("https://example.com/");
  });

  it("passes (exit 0) on a clean fixture with only valid links", () => {
    writeFileSync(
      path.join(FIXTURE, "timeline", "index.html"),
      `<a href="/timeline/">good</a>
<a href="/story/87-05-wushan/">wushan</a>
<img src="/media/ok.webp" />
<img srcset="/_next/static/app.js 1x" />`,
    );
    const result = runChecker();
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("OK");
  });
});