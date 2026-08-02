import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryInteractive } from "@/components/story/story-interactive";
import { StoryMarkdown } from "@/components/story/story-markdown";
import { toLightboxPhotos } from "@/lib/evidence";
import { ROUTES, getStoryHref } from "@/lib/routes";
import { getStory, stories } from "@/lib/stories";

type StoryPageProps = {
  params: Promise<{ storyId: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return stories.map((story) => ({ storyId: story.storyId }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { storyId } = await params;
  const story = getStory(storyId);
  if (!story) return { title: "找不到故事" };
  return {
    title: story.title,
    description: story.summary,
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { storyId } = await params;
  const story = getStory(storyId);
  if (!story) notFound();
  const previousStory = story.prevStoryId ? getStory(story.prevStoryId) : null;
  const nextStory = story.nextStoryId ? getStory(story.nextStoryId) : null;
  const previousHref = previousStory ? getStoryHref(previousStory.storyId) : null;
  const nextHref = nextStory ? getStoryHref(nextStory.storyId) : null;

  return (
    <div className="content-shell story-page">
      <Link className="back-link" href={ROUTES.timeline}>← 返回時間軸</Link>
      <header className="story-header">
        <p className="eyebrow">序號 {story.sequenceNumber} · {story.fullDateLabel} · 西元 {story.westernYear}</p>
        <h1>{story.title}</h1>
        <dl className="story-meta">
          <div><dt>原文日期</dt><dd>{story.rawDateLabel}</dd></div>
          <div><dt>地點</dt><dd>{story.location}</dd></div>
          <div><dt>作者</dt><dd>{story.authors.length > 0 ? story.authors.join("、") : "原文未明確署名"}</dd></div>
          <div><dt>參加人數</dt><dd>{story.attendees === null ? "未記載" : `${story.attendees} 人`}</dd></div>
          <div><dt>照片</dt><dd>{story.photoCount > 0 ? `${story.photoCount} 張` : "無留存照片"}</dd></div>
        </dl>
        {story.note && story.source !== "story-only" ? <p className="activity-note"><strong>活動年表備註：</strong>{story.note}</p> : null}
        {story.source === "story-only" && story.note ? (
          <p className="activity-note"><strong>典藏註記：</strong>{story.note}</p>
        ) : null}
      </header>

      {story.evidence.length === 0 ? (
        <p className="story-no-photos">本篇原始資料沒有留存照片，以下保留可辨識的遊記文字。</p>
      ) : null}

      <StoryInteractive photos={toLightboxPhotos(story.evidence)}>
        <StoryMarkdown evidence={story.evidence} markdown={story.contentMarkdown} />
      </StoryInteractive>

      <nav className="story-pagination" aria-label="前後故事">
        {previousHref ? (
          <Link href={previousHref}>
            <span>← 上一篇</span><strong>{previousStory?.title}</strong>
          </Link>
        ) : <span />}
        {nextHref ? (
          <Link href={nextHref}>
            <span>下一篇 →</span><strong>{nextStory?.title}</strong>
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}
