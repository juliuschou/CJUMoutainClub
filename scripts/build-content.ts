import { execFile } from "node:child_process";
import { access, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import type { Blockquote, Content, Heading, Image, Paragraph, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import sharp from "sharp";
import { unified } from "unified";
import { DECORATIVE_ASSETS, KNOWN_AUTHORS, STORY_OVERRIDES } from "../src/content/overrides";
import { STORY_MAP } from "../src/content/story-map";
import { isPhotoEvidence } from "../src/lib/evidence";
import type {
  ActivityRow,
  AfterwordData,
  BuildManifest,
  Evidence,
  PrefaceData,
  StoryMapEntry,
  StoryRecord,
  TimelineNode,
  TimelineNodeType,
} from "../src/lib/types";

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = process.cwd();
const STORIES_ROOT = path.join(PROJECT_ROOT, "docs", "stories");
const PREFACE_PATH = path.join(STORIES_ROOT, "前言", "前言.md");
const AFTERWORD_PATH = path.join(STORIES_ROOT, "後記", "後記.md");
const GENERATED_ROOT = path.join(PROJECT_ROOT, "src", "generated");
const MEDIA_ROOT = path.join(PROJECT_ROOT, "public", "media");
const CACHE_ROOT = path.join(PROJECT_ROOT, ".next", "content-cache");
const MEDIA_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".wmf"]);
const CANONICAL_STORIES_ROOT = realpath(STORIES_ROOT);
const parser = unified().use(remarkParse).use(remarkGfm);

type BuildOptions = {
  write?: boolean;
  clean?: boolean;
  log?: boolean;
};

type BuildResult = {
  stories: StoryRecord[];
  timeline: TimelineNode[];
  evidence: Evidence[];
  preface: PrefaceData;
  afterword: AfterwordData;
  manifest: BuildManifest;
};

type ImageReference = {
  alt: string;
  relativeUrl: string;
  fileName: string;
  contextParagraph: string | null;
};

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Content validation failed: ${message}`);
  }
}

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n?/g, "\n");
}

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function pathIsWithin(basePath: string, candidatePath: string) {
  const relativePath = path.relative(basePath, candidatePath);
  return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

async function resolveStoryImage(storyDirectory: string, relativeUrl: string) {
  const normalizedUrl = relativeUrl.replaceAll("\\", "/");
  invariant(!path.isAbsolute(normalizedUrl) && normalizedUrl.startsWith("images/"), `Unexpected image URL: ${relativeUrl}`);

  const [canonicalStoriesRoot, canonicalStoryDirectory] = await Promise.all([
    CANONICAL_STORIES_ROOT,
    realpath(storyDirectory),
  ]);
  invariant(pathIsWithin(canonicalStoriesRoot, canonicalStoryDirectory), `Story directory escapes source root: ${storyDirectory}`);

  const imagesDirectory = await realpath(path.join(canonicalStoryDirectory, "images"));
  invariant(pathIsWithin(canonicalStoryDirectory, imagesDirectory), `Images directory escapes its story: ${storyDirectory}`);

  const sourcePath = await realpath(path.resolve(canonicalStoryDirectory, normalizedUrl));
  invariant(pathIsWithin(imagesDirectory, sourcePath), `Image escapes its story directory: ${relativeUrl}`);
  return sourcePath;
}

async function walkFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
}

function parseTree(markdown: string): Root {
  return parser.parse(normalizeMarkdown(markdown)) as Root;
}

function parseYearMonth(sourceDirectory: string) {
  const [yearPart, monthPart] = sourceDirectory.split("/");
  const year = Number.parseInt(yearPart, 10);
  const parsedMonth = Number.parseInt(monthPart, 10);
  invariant(Number.isInteger(year), `Invalid year directory: ${sourceDirectory}`);
  invariant(Number.isInteger(parsedMonth), `Invalid month directory: ${sourceDirectory}`);
  return { year, month: parsedMonth === 0 ? null : parsedMonth };
}

function fullDateLabel(year: number, month: number | null) {
  return month === null ? `民國${year}年（月份不明）` : `民國${year}年${month}月`;
}

function parseActivityRows(markdown: string): ActivityRow[] {
  const rows: ActivityRow[] = [];
  for (const line of normalizeMarkdown(markdown).split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    if (cells.length !== 5 || !/^\d+$/.test(cells[0])) continue;

    const sequenceNumber = Number.parseInt(cells[0], 10);
    const rawDateLabel = cells[1].replace(/\s+/g, " ").trim();
    const yearMatch = rawDateLabel.match(/(\d{2,3})年/);
    const monthMatch = rawDateLabel.match(/年\s*(\d{1,2})月/);
    invariant(yearMatch, `Activity ${sequenceNumber} has no ROC year`);
    const attendees = cells[3] === "" ? null : Number.parseInt(cells[3], 10);
    invariant(attendees === null || Number.isInteger(attendees), `Activity ${sequenceNumber} has invalid attendees`);

    rows.push({
      sequenceNumber,
      rawDateLabel,
      year: Number.parseInt(yearMatch[1], 10),
      month: monthMatch ? Number.parseInt(monthMatch[1], 10) : null,
      location: cells[2],
      attendees,
      note: cells[4] || null,
      isCancelled: attendees === 0,
    });
  }
  return rows;
}

function extractPreface(markdown: string, activities: ActivityRow[]): PrefaceData {
  const tree = parseTree(markdown);
  const teacherMessage: string[] = [];
  let inTeacherSection = false;

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 2) {
      const heading = toString(node);
      inTeacherSection = heading === "指導老師的話";
      continue;
    }
    if (inTeacherSection && node.type === "paragraph") {
      const text = toString(node).trim();
      if (text) teacherMessage.push(text);
    }
  }

  return {
    title: "遊記總集 — 前言",
    teacherMessage,
    activities,
    sourceMarkdown: normalizeMarkdown(markdown).replace(/<style>\s*<\/style>\s*/g, ""),
  };
}

function splitNames(value: string) {
  return value
    .split("、")
    .map((name) => name.replace(/[，,。\s]+$/g, "").trim())
    .filter(Boolean);
}

function extractAfterword(markdown: string): AfterwordData {
  const lines = normalizeMarkdown(markdown).split("\n");
  const subtitleLine = lines.find((line) => line.trim() && !line.startsWith("#"))?.trim() ?? "";
  const subtitleParts = subtitleLine.split(/\s{2,}/).filter(Boolean);
  const publication = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .map((item) => {
      const separatorIndex = item.search(/[：:]/);
      return separatorIndex === -1
        ? { label: item, value: "" }
        : { label: item.slice(0, separatorIndex).trim(), value: item.slice(separatorIndex + 1).trim() };
    });
  const publicationMap = new Map(publication.map((item) => [item.label, item.value]));
  const subtitleIndex = lines.findIndex((line) => line.trim() === subtitleLine);
  const paragraphs = lines
    .slice(subtitleIndex + 1)
    .filter((line) => line.trim() && !line.startsWith("-") && !line.startsWith("#"))
    .map((line) => line.trim());

  return {
    title: "後記",
    subtitle: subtitleParts[0] ?? subtitleLine,
    author: subtitleParts[1] ?? null,
    paragraphs,
    publication,
    writers: splitNames(publicationMap.get("撰文") ?? ""),
    photographers: splitNames(publicationMap.get("攝影") ?? ""),
    sourceMarkdown: normalizeMarkdown(markdown),
  };
}

function isImageOnlyParagraph(node: Content): node is Paragraph {
  return node.type === "paragraph" && node.children.length > 0 && node.children.every((child) => child.type === "image");
}

function isMetadataParagraph(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return true;
  if (/^民國\d{2,3}年/.test(compact)) return true;
  if (compact.length < 100 && /(資料時間|作者|撰稿|圖片|攝影|圖文|\d{2,4}[年/.]\d{1,2})/.test(compact)) return true;
  if (compact === "接下頁") return true;
  return false;
}

function extractSummary(tree: Root, fallback: string) {
  for (const node of tree.children) {
    if (node.type !== "paragraph" || isImageOnlyParagraph(node)) continue;
    const text = toString(node).replace(/【接下頁】/g, "").replace(/\s+/g, " ").trim();
    if (isMetadataParagraph(text) || text.length < 28) continue;
    return text.length > 150 ? `${text.slice(0, 147).trimEnd()}…` : text;
  }
  return fallback;
}

function extractImageReferences(tree: Root): ImageReference[] {
  const references: ImageReference[] = [];
  let previousParagraph: string | null = null;

  for (const node of tree.children) {
    if (node.type === "paragraph") {
      const images = node.children.filter((child): child is Image => child.type === "image");
      if (images.length > 0) {
        for (const image of images) {
          references.push({
            alt: image.alt ?? "",
            relativeUrl: image.url,
            fileName: path.basename(image.url),
            contextParagraph: previousParagraph,
          });
        }
        continue;
      }
      const text = toString(node).replace(/【接下頁】/g, "").replace(/\s+/g, " ").trim();
      if (!isMetadataParagraph(text) && text.length >= 20) previousParagraph = text;
    }
  }

  return references;
}

function firstHeading(tree: Root, fallback: string) {
  const heading = tree.children.find(
    (node): node is Heading => node.type === "heading" && node.depth === 1,
  );
  return heading ? toString(heading).trim() : fallback;
}

function firstDateBlockquote(tree: Root, fallback: string) {
  const blockquote = tree.children.find((node): node is Blockquote => node.type === "blockquote");
  return blockquote ? toString(blockquote).trim() : fallback;
}

function inferAuthors(markdown: string) {
  const lines = normalizeMarkdown(markdown).split("\n");
  const candidates = lines.filter((line, index) => {
    const compact = line.replace(/[*#_]/g, "").trim();
    return (
      compact.length > 0 &&
      compact.length < 100 &&
      (index < 14 || index >= lines.length - 10 || /(撰稿|作者|紀述|圖文|文[：:／/])/.test(compact))
    );
  });

  return KNOWN_AUTHORS.filter((author) => candidates.some((line) => line.includes(author)));
}

function cleanStoryMarkdown(markdown: string) {
  return normalizeMarkdown(markdown)
    .replace(/^# .+\n+/, "")
    .replace(/^>\s*民國[^\n]+\n+/m, "")
    .replace(/<style>\s*<\/style>\s*/g, "")
    .replace(/【接下頁】/g, "")
    .trim();
}

async function outputsAreFresh(sourcePath: string, outputPaths: string[]) {
  if (!(await Promise.all(outputPaths.map(pathExists))).every(Boolean)) return false;
  const [sourceStats, ...outputStats] = await Promise.all([stat(sourcePath), ...outputPaths.map((outputPath) => stat(outputPath))]);
  return outputStats.every((output) => output.mtimeMs >= sourceStats.mtimeMs);
}

async function rasterInput(sourcePath: string, evidenceId: string) {
  if (path.extname(sourcePath).toLowerCase() !== ".wmf") return sourcePath;
  await mkdir(CACHE_ROOT, { recursive: true });
  const outputPath = path.join(CACHE_ROOT, `${evidenceId}.png`);
  if (!(await outputsAreFresh(sourcePath, [outputPath]))) {
    await execFileAsync("magick", [sourcePath, outputPath]);
  }
  invariant(await pathExists(outputPath), `ImageMagick did not convert ${sourcePath}`);
  return outputPath;
}

async function inspectAndProcessImage(
  sourcePath: string,
  storyId: string,
  order: number,
  write: boolean,
) {
  const orderLabel = String(order).padStart(2, "0");
  const evidenceId = `${storyId}-${orderLabel}`;
  const inputPath = await rasterInput(sourcePath, evidenceId);
  const metadata = await sharp(inputPath).rotate().metadata();
  invariant(metadata.width && metadata.height, `Could not read dimensions for ${sourcePath}`);

  const storyMediaDirectory = path.join(MEDIA_ROOT, storyId);
  const thumbnailName = `${orderLabel}-thumb.webp`;
  const displayName = `${orderLabel}-display.webp`;
  const fullName = `${orderLabel}-full.webp`;
  const thumbnailPath = path.join(storyMediaDirectory, thumbnailName);
  const displayPath = path.join(storyMediaDirectory, displayName);
  const fullPath = path.join(storyMediaDirectory, fullName);

  if (write && !(await outputsAreFresh(sourcePath, [thumbnailPath, displayPath, fullPath]))) {
    await mkdir(storyMediaDirectory, { recursive: true });
    await Promise.all([
      sharp(inputPath)
        .rotate()
        .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 76 })
        .toFile(thumbnailPath),
      sharp(inputPath)
        .rotate()
        .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(displayPath),
      sharp(inputPath)
        .rotate()
        .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 88 })
        .toFile(fullPath),
    ]);
  }

  return {
    evidenceId,
    width: metadata.autoOrient?.width ?? metadata.width,
    height: metadata.autoOrient?.height ?? metadata.height,
    thumbnailUrl: `/media/${storyId}/${thumbnailName}`,
    imageUrl: `/media/${storyId}/${displayName}`,
    fullImageUrl: `/media/${storyId}/${fullName}`,
  };
}

function rewriteImageUrls(markdown: string, evidence: Evidence[]) {
  const byFileName = new Map(evidence.map((item) => [item.sourceFileName, item.imageUrl]));
  return markdown.replace(/!\[([^\]]*)\]\(images\/([^)]+)\)/g, (match, alt: string, fileName: string) => {
    const imageUrl = byFileName.get(fileName);
    invariant(imageUrl, `No generated image URL for ${fileName}`);
    return `![${alt}](${imageUrl})`;
  });
}

function nodeTypeFor(activity: ActivityRow, imageCount: number): TimelineNodeType {
  if (activity.isCancelled) return "cancelled";
  if (/(會員大會|交接典禮|老師慶生|十週年|10週年)/.test(`${activity.note ?? ""} ${activity.location}`)) {
    return "major";
  }
  if (imageCount >= 10) return "photo-rich";
  return "normal";
}

async function buildStory(
  entry: StoryMapEntry,
  activity: ActivityRow,
  write: boolean,
): Promise<StoryRecord> {
  invariant(entry.sourceDirectory, `Story ${entry.storyId} has no source directory`);
  const storyDirectory = path.join(STORIES_ROOT, entry.sourceDirectory);
  const storyName = path.basename(storyDirectory);
  const markdownPath = path.join(storyDirectory, `${storyName}.md`);
  invariant(await pathExists(markdownPath), `Missing story Markdown: ${markdownPath}`);

  const sourceMarkdown = await readFile(markdownPath, "utf8");
  const normalizedMarkdown = normalizeMarkdown(sourceMarkdown);
  const tree = parseTree(normalizedMarkdown);
  const { year, month } = parseYearMonth(entry.sourceDirectory);
  const title = firstHeading(tree, storyName);
  invariant(title === storyName, `Story title does not match directory: ${entry.storyId}`);
  const dateLabel = firstDateBlockquote(tree, fullDateLabel(year, month));
  const override = STORY_OVERRIDES[entry.storyId];
  const references = extractImageReferences(tree);
  const evidence: Evidence[] = [];

  for (const [index, reference] of references.entries()) {
    const sourcePath = await resolveStoryImage(storyDirectory, reference.relativeUrl);
    const image = await inspectAndProcessImage(sourcePath, entry.storyId, index + 1, write);
    const decorative = DECORATIVE_ASSETS.has(`${entry.storyId}/${reference.fileName}`);
    evidence.push({
      ...image,
      storyId: entry.storyId,
      sourceFileName: reference.fileName,
      sourceExtension: path.extname(reference.fileName).toLowerCase(),
      altText: decorative ? "" : `${title}，第 ${index + 1} 張照片（${reference.fileName}）`,
      caption: null,
      contextParagraph: reference.contextParagraph,
      decorative,
      order: index + 1,
    });
  }

  const summary = override?.summary ?? extractSummary(tree, activity.note ?? title);
  const authors = override?.authors ?? inferAuthors(normalizedMarkdown);
  const cleanedMarkdown = cleanStoryMarkdown(normalizedMarkdown);
  const contentMarkdown = rewriteImageUrls(cleanedMarkdown, evidence);

  return {
    storyId: entry.storyId,
    sequenceNumber: entry.sequenceNumber,
    source: entry.source,
    title,
    year,
    month,
    yearLabel: `${year}年`,
    monthLabel: month === null ? "月份不明" : `${month}月`,
    fullDateLabel: fullDateLabel(year, month),
    rawDateLabel: dateLabel,
    westernYear: year + 1911,
    location: override?.location ?? (activity.location || title),
    authors: [...authors],
    attendees: activity.attendees,
    note: activity.note,
    isCancelled: false,
    hasStory: true,
    summary,
    contentMarkdown,
    evidence,
    imageIds: evidence.map((item) => item.evidenceId),
    assetCount: evidence.length,
    photoCount: evidence.filter(isPhotoEvidence).length,
    prevStoryId: null,
    nextStoryId: null,
  };
}

function syntheticActivityForStoryOnly(entry: StoryMapEntry): ActivityRow {
  invariant(entry.sourceDirectory, `Story-only entry ${entry.storyId} requires a directory`);
  const { year, month } = parseYearMonth(entry.sourceDirectory);
  const title = path.basename(entry.sourceDirectory);
  return {
    sequenceNumber: entry.sequenceNumber,
    rawDateLabel: month === null ? `${year}年` : `${year}年${month}月`,
    year,
    month,
    location: title,
    attendees: null,
    note: `原始活動年表缺少序號 ${entry.sequenceNumber}，依現存遊記補入。`,
    isCancelled: false,
  };
}

function activityForEntry(entry: StoryMapEntry, activityBySequence: Map<number, ActivityRow>) {
  const activity = entry.source === "story-only"
    ? syntheticActivityForStoryOnly(entry)
    : activityBySequence.get(entry.sequenceNumber);
  invariant(activity, `Missing activity for ${entry.storyId}`);
  return activity;
}

function validateMap(activityRows: ActivityRow[]) {
  invariant(activityRows.length === 44, `Expected 44 source activity rows, found ${activityRows.length}`);
  const expectedSequences = [...Array.from({ length: 24 }, (_, index) => index), ...Array.from({ length: 20 }, (_, index) => index + 25)];
  invariant(
    JSON.stringify(activityRows.map((row) => row.sequenceNumber)) === JSON.stringify(expectedSequences),
    "Source activity sequence set changed",
  );
  invariant(STORY_MAP.length === 45, `Expected 45 mapped timeline slots, found ${STORY_MAP.length}`);
  invariant(new Set(STORY_MAP.map((entry) => entry.storyId)).size === STORY_MAP.length, "Story IDs are not unique");
  invariant(STORY_MAP.every((entry) => /^[a-z0-9-]+$/.test(entry.storyId)), "Story IDs must be ASCII slugs");
  invariant(activityRows.filter((row) => row.isCancelled).length === 5, "Expected five cancelled activities");
  invariant(STORY_MAP.filter((entry) => entry.sourceDirectory === null).length === 8, "Expected eight table entries without stories");
}

export async function buildContent(options: BuildOptions = {}): Promise<BuildResult> {
  const write = options.write ?? true;
  const clean = options.clean ?? false;
  const log = options.log ?? true;
  const allFiles = await walkFiles(STORIES_ROOT);
  const markdownFiles = allFiles.filter((file) => path.extname(file).toLowerCase() === ".md");
  const mediaFiles = allFiles.filter((file) => MEDIA_EXTENSIONS.has(path.extname(file).toLowerCase()));
  const prefaceMarkdown = await readFile(PREFACE_PATH, "utf8");
  const afterwordMarkdown = await readFile(AFTERWORD_PATH, "utf8");
  const activities = parseActivityRows(prefaceMarkdown);

  validateMap(activities);
  invariant(markdownFiles.length === 39, `Expected 39 Markdown files, found ${markdownFiles.length}`);
  invariant(mediaFiles.length === 248, `Expected 248 media files, found ${mediaFiles.length}`);

  const mappedDirectories = STORY_MAP.flatMap((entry) => (entry.sourceDirectory ? [entry.sourceDirectory] : []));
  invariant(mappedDirectories.length === 37, `Expected 37 mapped story directories, found ${mappedDirectories.length}`);
  invariant(new Set(mappedDirectories).size === 37, "Story directories are mapped more than once");

  if (write) {
    if (clean) await rm(MEDIA_ROOT, { recursive: true, force: true });
    await mkdir(MEDIA_ROOT, { recursive: true });
  }

  const activityBySequence = new Map(activities.map((activity) => [activity.sequenceNumber, activity]));
  const storyEntries = STORY_MAP.filter((entry) => entry.sourceDirectory);
  const stories: StoryRecord[] = [];

  for (let index = 0; index < storyEntries.length; index += 4) {
    const batch = storyEntries.slice(index, index + 4);
    const batchStories = await Promise.all(
      batch.map((entry) => buildStory(entry, activityForEntry(entry, activityBySequence), write)),
    );
    stories.push(...batchStories);
  }

  invariant(stories.length === 37, `Expected 37 stories, found ${stories.length}`);
  invariant(stories.reduce((sum, story) => sum + story.assetCount, 0) === 248, "Story asset count must equal 248");
  invariant(stories.filter((story) => story.assetCount === 0).length === 7, "Expected seven stories without images");

  for (const [index, story] of stories.entries()) {
    story.prevStoryId = stories[index - 1]?.storyId ?? null;
    story.nextStoryId = stories[index + 1]?.storyId ?? null;
  }

  const storyById = new Map(stories.map((story) => [story.storyId, story]));
  const timeline: TimelineNode[] = STORY_MAP.map((entry) => {
    const story = storyById.get(entry.storyId);
    const activity = activityForEntry(entry, activityBySequence);
    const title = story?.title ?? (activity.location || "未命名活動");
    const summary = story?.summary ?? activity.note ?? "原始年表僅留存活動紀錄，未附遊記。";
    return {
      storyId: entry.storyId,
      sequenceNumber: entry.sequenceNumber,
      source: entry.source,
      year: story?.year ?? activity.year,
      month: story?.month ?? activity.month,
      fullDateLabel: story?.fullDateLabel ?? fullDateLabel(activity.year, activity.month),
      rawDateLabel: story?.rawDateLabel ?? activity.rawDateLabel,
      title,
      location: story?.location ?? (activity.location || title),
      attendees: activity.attendees,
      note: activity.note,
      isCancelled: activity.isCancelled,
      hasStory: Boolean(story),
      imageCount: story?.photoCount ?? 0,
      nodeType: nodeTypeFor(activity, story?.photoCount ?? 0),
      summary,
      thumbnailUrls: story?.evidence.filter(isPhotoEvidence).slice(0, 3).map((item) => item.thumbnailUrl) ?? [],
    };
  });

  const evidence = stories.flatMap((story) => story.evidence);
  const extensionCounts = mediaFiles.reduce(
    (counts, file) => {
      const extension = path.extname(file).toLowerCase();
      if (extension === ".jpeg" || extension === ".jpg") counts.jpeg += 1;
      if (extension === ".png") counts.png += 1;
      if (extension === ".wmf") counts.wmf += 1;
      return counts;
    },
    { jpeg: 0, png: 0, wmf: 0 },
  );

  const manifest: BuildManifest = {
    sourceCounts: {
      markdownFiles: markdownFiles.length,
      storyFiles: stories.length,
      activityRows: activities.length,
      timelineNodes: timeline.length,
      mediaFiles: mediaFiles.length,
      jpegFiles: extensionCounts.jpeg,
      pngFiles: extensionCounts.png,
      wmfFiles: extensionCounts.wmf,
      cancelledActivities: activities.filter((activity) => activity.isCancelled).length,
      storiesWithoutImages: stories.filter((story) => story.assetCount === 0).length,
    },
    warnings: STORY_MAP
      .filter((entry) => entry.source === "story-only")
      .map((entry) => `序號 ${entry.sequenceNumber} 不在原始活動年表中，已依現存遊記補入時間軸。`),
  };

  invariant(extensionCounts.jpeg === 239, `Expected 239 JPEG files, found ${extensionCounts.jpeg}`);
  invariant(extensionCounts.png === 8, `Expected 8 PNG files, found ${extensionCounts.png}`);
  invariant(extensionCounts.wmf === 1, `Expected 1 WMF file, found ${extensionCounts.wmf}`);
  invariant(timeline.length === 45, `Expected 45 timeline nodes, found ${timeline.length}`);

  const preface = extractPreface(prefaceMarkdown, activities);
  const afterword = extractAfterword(afterwordMarkdown);

  if (write) {
    const generatedStories = stories.map((story) => {
      const { evidence, ...generatedStory } = story;
      void evidence;
      return generatedStory;
    });
    await mkdir(GENERATED_ROOT, { recursive: true });
    await Promise.all([
      writeFile(path.join(GENERATED_ROOT, "stories.json"), `${JSON.stringify(generatedStories, null, 2)}\n`),
      writeFile(path.join(GENERATED_ROOT, "timeline.json"), `${JSON.stringify(timeline, null, 2)}\n`),
      writeFile(path.join(GENERATED_ROOT, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`),
      writeFile(path.join(GENERATED_ROOT, "preface.json"), `${JSON.stringify(preface, null, 2)}\n`),
      writeFile(path.join(GENERATED_ROOT, "afterword.json"), `${JSON.stringify(afterword, null, 2)}\n`),
      writeFile(path.join(GENERATED_ROOT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    ]);
  }

  if (log) {
    console.log(
      `Validated ${timeline.length} timeline nodes, ${stories.length} stories, and ${evidence.length} media references${write ? " (generated output written)" : ""}.`,
    );
  }

  return { stories, timeline, evidence, preface, afterword, manifest };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  buildContent({
    write: !process.argv.includes("--check"),
    clean: process.argv.includes("--clean"),
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
