import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveStats } from "@/components/archive-stats";
import { PageHeader } from "@/components/page-header";
import { manifest } from "@/lib/manifest";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "關於本站",
};

export default function AboutPage() {
  const counts = manifest.sourceCounts;
  return (
    <section className="content-shell about-page">
      <PageHeader
        eyebrow="About the archive"
        title="以時間控制故事節奏，讓照片成為山行證據"
        description="本站將紙本遊記轉為時間證據卡：時間回答接下來發生什麼，故事說明活動經過，照片保留當時存在過的痕跡。"
      />

      <div className="concept-grid">
        <article className="card"><span>01</span><h2>時間層</h2><p>從民國 86 年成立校友會，走到 95 年十週年活動。年份與活動順序構成閱讀介面。</p></article>
        <article className="card"><span>02</span><h2>故事層</h2><p>每篇 Markdown 是一張可獨立閱讀的故事卡，保留原始段落、表格、子章節與署名差異。</p></article>
        <article className="card"><span>03</span><h2>證據層</h2><p>照片依原文出現順序嵌回閱讀流程，可放大連續瀏覽，也保留無照片與史料缺口。</p></article>
      </div>

      <section className="about-data" aria-labelledby="data-title">
        <div>
          <p className="eyebrow">Data notes</p>
          <h2 id="data-title">資料來源與校驗</h2>
          <p>網站完全由 `docs/stories/` 的 Markdown 與媒體檔在建構時產生，不需要後端或資料庫。原始檔不會被轉換流程修改。</p>
          <p>原始活動表有 44 筆並缺少序號 24；現存「合歡北峰－天巒池縱走」遊記正好位於時間缺口，因此補入網站，形成 45 個節點。這項補遺在時間軸與前言頁都有明確標示。</p>
          <ul>
            {manifest.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
        <ArchiveStats vertical items={[
          { value: counts.activityRows, label: "筆原始年表紀錄" },
          { value: counts.timelineNodes, label: "個網站時間軸節點" },
          { value: counts.storyFiles, label: "篇遊記 Markdown" },
          { value: counts.mediaFiles, label: "個媒體檔" },
          { value: counts.cancelledActivities, label: "筆取消活動" },
        ]} />
      </section>

      <section className="technology-note card">
        <h2>技術方式</h2>
        <p>Next.js App Router + TypeScript + Tailwind CSS。內容與圖片在建構期解析、轉為 route-safe WebP 與結構化 JSON，再以靜態匯出部署。互動只保留在時間軸與 Lightbox，以降低瀏覽器負擔。</p>
        <Link className="button button--primary" href={ROUTES.timeline}>開始閱讀時間軸</Link>
      </section>
    </section>
  );
}
