"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { TimelineNode } from "@/lib/types";

type TimelineExplorerProps = {
  nodes: TimelineNode[];
};

const nodeLabels = {
  major: { icon: "◆", label: "重要活動" },
  normal: { icon: "●", label: "一般活動" },
  cancelled: { icon: "×", label: "取消活動" },
  "photo-rich": { icon: "▣", label: "照片豐富" },
} as const;

export function TimelineExplorer({ nodes }: TimelineExplorerProps) {
  const [selectedId, setSelectedId] = useState(nodes[0]?.storyId ?? "");
  const [compact, setCompact] = useState(false);
  const years = useMemo(() => [...new Set(nodes.map((node) => node.year))], [nodes]);
  const selected = nodes.find((node) => node.storyId === selectedId) ?? nodes[0];

  function jumpToYear(year: number) {
    document.getElementById(`timeline-year-${year}`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  return (
    <div className="timeline-explorer">
      <div className="timeline-toolbar card" aria-label="時間軸控制">
        <div className="year-navigation" aria-label="年份快速跳轉">
          {years.map((year) => (
            <button key={year} type="button" onClick={() => jumpToYear(year)}>
              民國 {year} 年
            </button>
          ))}
        </div>
        <button
          className="density-toggle"
          type="button"
          aria-pressed={compact}
          onClick={() => setCompact((value) => !value)}
        >
          {compact ? "展開詳細間距" : "收合為全年總覽"}
        </button>
      </div>

      <div className="timeline-legend" aria-label="時間軸圖例">
        {Object.entries(nodeLabels).map(([type, item]) => (
          <span key={type} className={`legend-item legend-item--${type}`}>
            <span aria-hidden="true">{item.icon}</span>{item.label}
          </span>
        ))}
      </div>

      <div className={`timeline-track${compact ? " timeline-track--compact" : ""}`} tabIndex={0} aria-label="活動時間軸，可水平捲動">
        {years.map((year) => {
          const yearNodes = nodes.filter((node) => node.year === year);
          return (
            <section className="timeline-year" id={`timeline-year-${year}`} key={year} aria-labelledby={`timeline-heading-${year}`}>
              <h2 id={`timeline-heading-${year}`}>民國 {year} 年 <small>{year + 1911}</small></h2>
              <ol>
                {yearNodes.map((node) => {
                  const type = nodeLabels[node.nodeType];
                  return (
                    <li key={node.storyId}>
                      <button
                        aria-label={`${node.rawDateLabel}，${node.title}，${type.label}${node.imageCount ? `，${node.imageCount} 張照片` : ""}`}
                        aria-pressed={selected?.storyId === node.storyId}
                        className={`timeline-node timeline-node--${node.nodeType}`}
                        onClick={() => setSelectedId(node.storyId)}
                        type="button"
                      >
                        <span className="timeline-node__mark" aria-hidden="true">{type.icon}</span>
                        <span className="timeline-node__date">{node.month ? `${node.month}月` : "日期未詳"}</span>
                        <strong>{node.title}</strong>
                        {node.imageCount > 0 ? <small>{node.imageCount} 張照片</small> : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      {selected ? (
        <section className="story-preview card" aria-live="polite" aria-labelledby="selected-story-title">
          <div className="story-preview__content">
            <p className="eyebrow">序號 {selected.sequenceNumber} · {nodeLabels[selected.nodeType].label}</p>
            <h2 id="selected-story-title">{selected.title}</h2>
            <dl className="story-preview__meta">
              <div><dt>時間</dt><dd>{selected.rawDateLabel}</dd></div>
              <div><dt>地點</dt><dd>{selected.location || "原表未記載"}</dd></div>
              <div><dt>人數</dt><dd>{selected.attendees === null ? "未記載" : `${selected.attendees} 人`}</dd></div>
            </dl>
            <p>{selected.summary}</p>
            {selected.note && selected.source !== "story-only" ? <p className={`activity-note${selected.isCancelled ? " activity-note--cancelled" : ""}`}>
              <strong>{selected.isCancelled ? "取消原因" : "年表備註"}：</strong>{selected.note}
            </p> : null}
            {selected.source === "story-only" && selected.note ? (
              <p className="activity-note"><strong>典藏註記：</strong>{selected.note}</p>
            ) : null}
            {selected.hasStory ? (
              <Link className="button button--primary" href={`/story/${selected.storyId}`}>閱讀完整故事</Link>
            ) : (
              <p className="no-story-label">原始典藏未附遊記全文</p>
            )}
          </div>
          {selected.thumbnailUrls.length > 0 ? (
            <div className="story-preview__photos" aria-label="照片預覽">
              {selected.thumbnailUrls.map((url, index) => (
                <Image
                  alt={`${selected.title}照片預覽 ${index + 1}`}
                  height={220}
                  key={url}
                  sizes="(max-width: 760px) 33vw, 180px"
                  src={url}
                  width={220}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
