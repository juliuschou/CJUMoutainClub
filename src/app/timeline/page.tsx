import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TimelineExplorer } from "@/components/timeline/timeline-explorer";
import { timeline } from "@/lib/timeline";

export const metadata: Metadata = {
  title: "活動時間軸",
  description: "從民國 86 年到 95 年，沿著 45 個活動節點閱讀長榮登山社校友會的山行故事。",
};

export default function TimelinePage() {
  return (
    <section className="content-shell timeline-page">
      <PageHeader
        eyebrow="民國 86–95 年"
        title="活動時間軸"
        description="選擇年份與活動節點，打開當時留下的故事、照片與年表備註。叉號代表取消活動；序號 24 是依現存遊記補入的歷史缺號。"
      />
      <TimelineExplorer nodes={timeline} />
    </section>
  );
}
