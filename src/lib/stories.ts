import evidenceData from "@/generated/evidence.json";
import storiesData from "@/generated/stories.json";
import type { Evidence, StoryRecord } from "@/lib/types";

type GeneratedStoryRecord = Omit<StoryRecord, "evidence">;

const generatedStories = storiesData as GeneratedStoryRecord[];
const evidence = evidenceData as Evidence[];
const evidenceByStory = new Map<string, Evidence[]>();

for (const item of evidence) {
  const storyEvidence = evidenceByStory.get(item.storyId);
  if (storyEvidence) storyEvidence.push(item);
  else evidenceByStory.set(item.storyId, [item]);
}

export const stories: StoryRecord[] = generatedStories.map((story) => ({
  ...story,
  evidence: evidenceByStory.get(story.storyId) ?? [],
}));

const storyById = new Map(stories.map((story) => [story.storyId, story]));

export function getStory(storyId: string) {
  return storyById.get(storyId) ?? null;
}
