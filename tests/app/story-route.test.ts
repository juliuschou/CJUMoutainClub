import { describe, expect, it } from "vitest";
import { dynamicParams, generateStaticParams } from "@/app/story/[storyId]/page";
import { stories } from "@/lib/stories";

describe("story route static params", () => {
  it("disables dynamic params so unknown story ids cannot render", () => {
    expect(dynamicParams).toBe(false);
  });

  it("exports exactly the 37 generated story ids", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(stories.length);
    expect(params.map((p) => p.storyId).sort()).toEqual(
      stories.map((s) => s.storyId).sort(),
    );
    expect(params).toHaveLength(37);
  });

  it("exports only valid ASCII-slug ids (no undefined / no slashes)", () => {
    const ids = generateStaticParams().map((p) => p.storyId);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
      expect(id).not.toContain("/");
    }
  });

  it("every exported id resolves to an existing story record", () => {
    const ids = new Set(stories.map((s) => s.storyId));
    for (const param of generateStaticParams()) {
      expect(ids.has(param.storyId)).toBe(true);
    }
  });
});