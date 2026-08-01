import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { preface } from "@/lib/preface";
import { timeline } from "@/lib/timeline";

export const metadata: Metadata = {
  title: "前言與活動年表",
};

export default function PrefacePage() {
  const nodeBySequence = new Map(timeline.map((node) => [node.sequenceNumber, node]));
  const supplementalStories = timeline.filter((node) => node.source === "story-only");

  return (
    <section className="content-shell preface-page">
      <PageHeader
        eyebrow="遊記總集前言"
        title="把山誼留在文字與照片裡"
        description="原始遊記總集的指導老師寄語，以及民國 86 至 95 年的完整活動年表。"
      />

      <article className="preface-message card">
        <p className="eyebrow">指導老師的話</p>
        {preface.teacherMessage.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p className="source-note">原始 Markdown 未附規格中提到的手寫圖片，因此本頁呈現現有可辨識文字並保留此資料缺口。</p>
      </article>

      <section aria-labelledby="activity-table-title">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">原始史料</p>
            <h2 id="activity-table-title">活動年表</h2>
          </div>
          <p>共 {preface.activities.length} 筆原表紀錄</p>
        </div>
        <div className="table-scroll card" tabIndex={0} aria-label="活動年表，可水平捲動">
          <table className="activity-table">
            <thead>
              <tr><th>序號</th><th>活動時間</th><th>活動地點</th><th>人數</th><th>備註／狀態</th></tr>
            </thead>
            <tbody>
              {preface.activities.map((activity) => {
                const node = nodeBySequence.get(activity.sequenceNumber);
                const location = activity.location || node?.title || "未記載";
                return (
                  <tr className={activity.isCancelled ? "is-cancelled" : undefined} key={activity.sequenceNumber}>
                    <td>{activity.sequenceNumber}</td>
                    <td>{activity.rawDateLabel}</td>
                    <td>
                      {node?.hasStory ? <Link href={`/story/${node.storyId}`}>{location}</Link> : location}
                    </td>
                    <td>{activity.attendees === null ? "—" : activity.attendees}</td>
                    <td>
                      {activity.isCancelled ? <span className="status-label status-label--cancelled">× 已取消</span> : null}
                      {activity.note ? <span>{activity.note}</span> : "—"}
                      {!node?.hasStory && !activity.isCancelled ? <small>未附遊記</small> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {supplementalStories.map((story) => (
        <aside className="card historical-gap" key={story.storyId}>
          <p className="eyebrow">原表缺號補遺</p>
          <h2>序號 {story.sequenceNumber} · {story.title}</h2>
          <p>{story.note} 網站保留原表 {preface.activities.length} 筆的原貌，並將這篇現存遊記列為補遺節點。</p>
          <Link className="button button--primary" href={`/story/${story.storyId}`}>閱讀補入故事</Link>
        </aside>
      ))}

      <section className="empty-source-sections" aria-labelledby="empty-source-title">
        <h2 id="empty-source-title">原書其他段落</h2>
        <p>「編者的話」、「作者的話」與「照片集錦」在現有 Markdown 中只有標題，沒有可呈現的內容或圖片。本網站不自行補寫，將缺口如實記錄。</p>
      </section>
    </section>
  );
}
