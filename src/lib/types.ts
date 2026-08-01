export type StorySource = "table" | "story-only";

export type TimelineNodeType = "major" | "normal" | "cancelled" | "photo-rich";

export interface StoryMapEntry {
  sequenceNumber: number;
  storyId: string;
  sourceDirectory: string | null;
  source: StorySource;
}

export interface ActivityRow {
  sequenceNumber: number;
  rawDateLabel: string;
  year: number;
  month: number | null;
  location: string;
  attendees: number | null;
  note: string | null;
  isCancelled: boolean;
}

export interface Evidence {
  evidenceId: string;
  storyId: string;
  sourceFileName: string;
  sourceExtension: string;
  thumbnailUrl: string;
  imageUrl: string;
  fullImageUrl: string;
  width: number;
  height: number;
  altText: string;
  caption: string | null;
  contextParagraph: string | null;
  decorative: boolean;
  order: number;
}

export interface LightboxPhoto {
  evidenceId: string;
  sourceFileName: string;
  fullImageUrl: string;
  width: number;
  height: number;
  altText: string;
  contextParagraph: string | null;
}

export interface StoryRecord {
  storyId: string;
  sequenceNumber: number;
  source: StorySource;
  title: string;
  year: number;
  month: number | null;
  yearLabel: string;
  monthLabel: string;
  fullDateLabel: string;
  rawDateLabel: string;
  westernYear: number;
  location: string;
  authors: string[];
  attendees: number | null;
  note: string | null;
  isCancelled: boolean;
  hasStory: true;
  summary: string;
  contentMarkdown: string;
  evidence: Evidence[];
  imageIds: string[];
  assetCount: number;
  photoCount: number;
  prevStoryId: string | null;
  nextStoryId: string | null;
}

export interface TimelineNode {
  storyId: string;
  sequenceNumber: number;
  source: StorySource;
  year: number;
  month: number | null;
  fullDateLabel: string;
  rawDateLabel: string;
  title: string;
  location: string;
  attendees: number | null;
  note: string | null;
  isCancelled: boolean;
  hasStory: boolean;
  imageCount: number;
  nodeType: TimelineNodeType;
  summary: string;
  thumbnailUrls: string[];
}

export interface PrefaceData {
  title: string;
  teacherMessage: string[];
  activities: ActivityRow[];
  sourceMarkdown: string;
}

export interface PublicationItem {
  label: string;
  value: string;
}

export interface AfterwordData {
  title: string;
  subtitle: string;
  author: string | null;
  paragraphs: string[];
  publication: PublicationItem[];
  writers: string[];
  photographers: string[];
  sourceMarkdown: string;
}

export interface SourceCounts {
  markdownFiles: number;
  storyFiles: number;
  activityRows: number;
  timelineNodes: number;
  mediaFiles: number;
  jpegFiles: number;
  pngFiles: number;
  wmfFiles: number;
  cancelledActivities: number;
  storiesWithoutImages: number;
}

export interface BuildManifest {
  sourceCounts: SourceCounts;
  warnings: string[];
}
