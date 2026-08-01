import { describe, expect, it } from "vitest";
import evidence from "@/generated/evidence.json";
import manifest from "@/generated/manifest.json";
import stories from "@/generated/stories.json";
import timeline from "@/generated/timeline.json";
import { STORY_MAP } from "@/content/story-map";

describe("generated story corpus", () => {
  it("preserves source counts and inserts the historical sequence gap", () => {
    expect(manifest.sourceCounts).toMatchObject({
      markdownFiles: 39,
      storyFiles: 37,
      activityRows: 44,
      timelineNodes: 45,
      mediaFiles: 248,
      cancelledActivities: 5,
      storiesWithoutImages: 7,
    });
    expect(timeline).toHaveLength(45);
    expect(timeline.find((node) => node.sequenceNumber === 24)).toMatchObject({
      storyId: "92-10-hehuan-north-peak",
      source: "story-only",
      hasStory: true,
    });
  });

  it("maps every story exactly once with stable ASCII slugs", () => {
    const mappedDirectories = STORY_MAP.filter((entry) => entry.sourceDirectory);
    expect(mappedDirectories).toHaveLength(37);
    expect(new Set(mappedDirectories.map((entry) => entry.sourceDirectory)).size).toBe(37);
    expect(new Set(stories.map((story) => story.storyId)).size).toBe(37);
    expect(stories.every((story) => /^[a-z0-9-]+$/.test(story.storyId))).toBe(true);
  });

  it("keeps cancellations and no-story records distinct", () => {
    expect(timeline.filter((node) => node.isCancelled).map((node) => node.sequenceNumber)).toEqual([12, 22, 27, 30, 42]);
    expect(timeline.filter((node) => !node.hasStory).map((node) => node.sequenceNumber)).toEqual([0, 12, 22, 27, 30, 32, 42, 44]);
  });

  it("preserves all inline assets and excludes decorative art from photo counts", () => {
    const assetCount = stories.reduce((sum, story) => sum + story.assetCount, 0);
    const decorative = evidence.filter((item) => item.decorative);
    expect(assetCount).toBe(248);
    expect(evidence).toHaveLength(248);
    expect(decorative).toHaveLength(1);
    expect(decorative[0]).toMatchObject({
      storyId: "92-09-malabanshan",
      sourceFileName: "image65.png",
      altText: "",
    });
  });

  it("preserves verified author credits that need manual normalization", () => {
    expect(stories.find((story) => story.storyId === "89-09-jiali")?.authors).toEqual(["周其昌"]);
    expect(stories.find((story) => story.storyId === "90-12-teacher-birthday")?.authors).toEqual(["黃春燕"]);
    expect(stories.find((story) => story.storyId === "94-12-taimali")?.authors).toEqual(["Blue（藍怡秋）"]);
    expect(stories.find((story) => story.storyId === "95-09-teapot-mountain")?.authors).toEqual(["謝婷夙"]);
  });

  it("generates valid previous and next story navigation", () => {
    expect(stories[0].prevStoryId).toBeNull();
    expect(stories.at(-1)?.nextStoryId).toBeNull();
    for (let index = 1; index < stories.length; index += 1) {
      expect(stories[index].prevStoryId).toBe(stories[index - 1].storyId);
      expect(stories[index - 1].nextStoryId).toBe(stories[index].storyId);
    }
  });
});
