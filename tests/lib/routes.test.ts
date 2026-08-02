import { describe, expect, it } from "vitest";
import { ROUTES, getStoryHref } from "@/lib/routes";

describe("getStoryHref", () => {
  it("returns a slash-less story route for a valid ASCII slug", () => {
    expect(getStoryHref("87-05-wushan")).toBe("/story/87-05-wushan");
    expect(getStoryHref("95-09-teapot-mountain")).toBe("/story/95-09-teapot-mountain");
  });

  it("returns null for missing or empty ids (no /story/undefined/)", () => {
    expect(getStoryHref(undefined)).toBeNull();
    expect(getStoryHref(null)).toBeNull();
    expect(getStoryHref("")).toBeNull();
  });

  it("returns null for slugs that would break out of the story segment", () => {
    expect(getStoryHref("foo/bar")).toBeNull();
    expect(getStoryHref("foo/../bar")).toBeNull();
    expect(getStoryHref("foo?x=1")).toBeNull();
    expect(getStoryHref("foo#anchor")).toBeNull();
  });

  it("returns null for non-ASCII or otherwise invalid ids", () => {
    expect(getStoryHref("頭嵙山")).toBeNull();
    expect(getStoryHref("FOO")).toBeNull();
    expect(getStoryHref("foo_bar")).toBeNull();
    expect(getStoryHref(" ")).toBeNull();
  });
});

describe("ROUTES", () => {
  it("exposes the four fixed nav routes plus home, all slash-less", () => {
    expect(ROUTES.home).toBe("/");
    expect(ROUTES.timeline).toBe("/timeline");
    expect(ROUTES.preface).toBe("/preface");
    expect(ROUTES.afterword).toBe("/afterword");
    expect(ROUTES.about).toBe("/about");
  });
});