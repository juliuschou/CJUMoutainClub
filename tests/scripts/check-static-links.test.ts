import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  classifyUrl,
  decodePath,
  extractHrefs,
  extractSrcset,
  extractSrcs,
  invalidStoryRoute,
  resolveTarget,
} from "@/../scripts/check-static-links";

const OUT_ROOT = path.resolve(process.cwd(), "out");

describe("classifyUrl", () => {
  it("classifies internal, fragment, mailto, tel, data and external urls", () => {
    expect(classifyUrl("/timeline/").kind).toBe("internal");
    expect(classifyUrl("/timeline/").pathOnly).toBe("/timeline/");
    expect(classifyUrl("/story/foo/?x=1#top").pathOnly).toBe("/story/foo/");
    expect(classifyUrl("#main-content").kind).toBe("fragment");
    expect(classifyUrl("mailto:a@b.com").kind).toBe("mailto");
    expect(classifyUrl("tel:+886").kind).toBe("tel");
    expect(classifyUrl("data:image/png;base64,xx").kind).toBe("data");
    expect(classifyUrl("https://example.com/").kind).toBe("external");
    expect(classifyUrl("//cdn.example.com/x").kind).toBe("external");
    expect(classifyUrl("").kind).toBe("empty");
  });

  it("strips query and hash from internal urls", () => {
    expect(classifyUrl("/about/?utm=1#section").pathOnly).toBe("/about/");
    expect(classifyUrl("/media/x.webp?v=2").pathOnly).toBe("/media/x.webp");
  });
});

describe("invalidStoryRoute", () => {
  it("flags /story/undefined/ and empty story segments", () => {
    expect(invalidStoryRoute("/story/undefined/")).toBe("/story/undefined/ link");
    expect(invalidStoryRoute("/story//")).toBe("empty story segment");
    expect(invalidStoryRoute("/story/")).toBe("empty story segment");
  });

  it("rejects story ids containing a slash", () => {
    expect(invalidStoryRoute("/story/foo/bar/")).toContain("slash");
  });

  it("accepts valid story ids and non-story paths", () => {
    expect(invalidStoryRoute("/story/87-05-wushan/")).toBeNull();
    expect(invalidStoryRoute("/timeline/")).toBeNull();
    expect(invalidStoryRoute("/media/x.webp")).toBeNull();
  });
});

describe("resolveTarget", () => {
  it("maps directory routes to index.html", () => {
    expect(resolveTarget("/timeline/", OUT_ROOT)?.targetFile).toBe(path.join(OUT_ROOT, "timeline", "index.html"));
    expect(resolveTarget("/", OUT_ROOT)?.targetFile).toBe(path.join(OUT_ROOT, "index.html"));
    expect(resolveTarget("/story/87-05-wushan/", OUT_ROOT)?.targetFile).toBe(
      path.join(OUT_ROOT, "story", "87-05-wushan", "index.html"),
    );
  });

  it("maps a no-trailing-slash route to index.html too", () => {
    expect(resolveTarget("/timeline", OUT_ROOT)?.targetFile).toBe(path.join(OUT_ROOT, "timeline", "index.html"));
  });

  it("keeps asset paths with extensions intact", () => {
    expect(resolveTarget("/media/foo.webp", OUT_ROOT)?.targetFile).toBe(path.join(OUT_ROOT, "media", "foo.webp"));
    expect(resolveTarget("/_next/static/chunks/a.js", OUT_ROOT)?.targetFile).toBe(
      path.join(OUT_ROOT, "_next", "static", "chunks", "a.js"),
    );
  });

  it("rejects traversal that escapes the out root", () => {
    expect(resolveTarget("/../etc/passwd", OUT_ROOT)).toBeNull();
    expect(resolveTarget("/media/../../etc/passwd", OUT_ROOT)).toBeNull();
  });
});

describe("decodePath", () => {
  it("decodes percent-encoded segments", () => {
    expect(decodePath("/story/%E9%A0%AD%E5%B5%99%E5%B1%B1/")).toBe("/story/頭嵙山/");
  });
});

describe("extractors", () => {
  it("extracts hrefs, srcs and srcset entries", () => {
    const html = `
      <a href="/timeline/">t</a>
      <a href='/story/foo/'>f</a>
      <img src="/media/a.webp" />
      <img srcset="/media/a.webp 1x, /media/b.webp 2x" />
    `;
    expect(extractHrefs(html)).toEqual(["/timeline/", "/story/foo/"]);
    expect(extractSrcs(html)).toContain("/media/a.webp");
    expect(extractSrcset(html)).toEqual(["/media/a.webp", "/media/b.webp"]);
  });

  it("ignores external and fragment hrefs only after classification", () => {
    const html = `<a href="https://x.com">x</a><a href="#top">t</a>`;
    const hrefs = extractHrefs(html);
    expect(hrefs).toEqual(["https://x.com", "#top"]);
    // classifyUrl is the gate; the extractor just collects.
    expect(classifyUrl(hrefs[0]).kind).toBe("external");
    expect(classifyUrl(hrefs[1]).kind).toBe("fragment");
  });
});