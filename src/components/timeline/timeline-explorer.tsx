"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStoryHref } from "@/lib/routes";
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

/**
 * Resolve the href for a node only when it actually has a story and the id
 * is a valid ASCII slug. This is the single guard that prevents
 * `/story/undefined/` and broken links for cancelled / no-story nodes.
 */
function nodeHref(node: TimelineNode): `/story/${string}` | null {
  return node.hasStory ? getStoryHref(node.storyId) : null;
}

export function TimelineExplorer({ nodes }: TimelineExplorerProps) {
  const firstStoryId = useMemo(
    () => nodes.find((node) => nodeHref(node) !== null)?.storyId ?? null,
    [nodes],
  );
  const [selectedId, setSelectedId] = useState<string | null>(firstStoryId);
  const [compact, setCompact] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  // Drag state lives in a ref so the wheel/pointer handlers can read it
  // without re-creating listeners on every render.
  const dragState = useRef<{ pointerId: number; startX: number; startScroll: number; moved: boolean } | null>(null);

  const years = useMemo(() => [...new Set(nodes.map((node) => node.year))], [nodes]);
  const selected = useMemo(
    () => nodes.find((node) => node.storyId === selectedId) ?? nodes.find((node) => nodeHref(node) !== null) ?? null,
    [nodes, selectedId],
  );
  const selectedHref = selected ? nodeHref(selected) : null;

  const selectNode = useCallback((node: TimelineNode) => {
    if (nodeHref(node) !== null) setSelectedId(node.storyId);
  }, []);

  function jumpToYear(year: number) {
    const target = document.getElementById(`timeline-year-${year}`);
    if (!target) return;
    // scrollIntoView respects scroll-margin-block-start on the target and
    // scroll-padding-top on <html>, so the year heading lands below the
    // sticky header instead of being hidden under it.
    target.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
  }

  // Wheel-to-horizontal: on the desktop track, translate vertical wheel
  // deltas into horizontal scroll so a mouse wheel can advance the
  // timeline. We do NOT hijack horizontal deltas (trackpads keep working)
  // and we never scroll the page from here.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const el: HTMLDivElement = track;
    function onWheel(event: WheelEvent) {
      // Only translate when the delta is predominantly vertical; let
      // trackpads (horizontal delta) use the native scrollbar.
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      // Only act on the desktop (horizontal) layout. When the track is
      // not itself scrollable (vertical mobile layout), do nothing.
      if (el.scrollWidth <= el.clientWidth) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pointer drag: let users drag the desktop track with mouse / touch. A
  // movement threshold separates a drag (scrolls, suppresses the Link
  // click) from a click (follows the story Link).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const el: HTMLDivElement = track;

    function onPointerDown(event: PointerEvent) {
      // Only drag with primary button / touch; ignore right-click etc.
      if (event.button !== 0 && event.pointerType === "mouse") return;
      if (el.scrollWidth <= el.clientWidth) return;
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: el.scrollLeft,
        moved: false,
      };
    }

    function onPointerMove(event: PointerEvent) {
      const state = dragState.current;
      if (!state || event.pointerId !== state.pointerId) return;
      const delta = event.clientX - state.startX;
      if (!state.moved && Math.abs(delta) < 6) return;
      state.moved = true;
      el.scrollLeft = state.startScroll - delta;
    }

    function onPointerUp(event: PointerEvent) {
      const state = dragState.current;
      if (!state || event.pointerId !== state.pointerId) return;
      dragState.current = null;
      // If a drag happened, capture the next click on the track so the
      // story Link underneath does not navigate (the user meant to scroll).
      if (state.moved) {
        const capture = (clickEvent: MouseEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          el.removeEventListener("click", capture, true);
        };
        el.addEventListener("click", capture, true);
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

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

      <div
        className={`timeline-track${compact ? " timeline-track--compact" : ""}`}
        ref={trackRef}
        tabIndex={0}
        aria-label="活動時間軸；寬度足夠時可水平捲動，窄寬則垂直閱讀"
      >
        {years.map((year) => {
          const yearNodes = nodes.filter((node) => node.year === year);
          return (
            <section className="timeline-year" id={`timeline-year-${year}`} key={year} aria-labelledby={`timeline-heading-${year}`}>
              <h2 id={`timeline-heading-${year}`}>民國 {year} 年 <small>{year + 1911}</small></h2>
              <ol>
                {yearNodes.map((node) => {
                  const type = nodeLabels[node.nodeType];
                  const href = nodeHref(node);
                  const isSelected = selected?.storyId === node.storyId && href !== null;
                  if (href) {
                    return (
                      <li key={node.storyId}>
                        <Link
                          className={`timeline-node timeline-node--${node.nodeType}${isSelected ? " is-selected" : ""}`}
                          data-selected={isSelected ? "" : undefined}
                          href={href}
                          onFocus={() => selectNode(node)}
                          onMouseEnter={() => selectNode(node)}
                        >
                          <span className="timeline-node__mark" aria-hidden="true">{type.icon}</span>
                          <span className="timeline-node__date">{node.month ? `${node.month}月` : "日期未詳"}</span>
                          <strong>{node.title}</strong>
                          {node.imageCount > 0 ? <small>{node.imageCount} 張照片</small> : null}
                          <span className="timeline-node__hint" aria-hidden="true">閱讀故事 →</span>
                          {isSelected ? <span className="visually-hidden">目前預覽</span> : null}
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={node.storyId}>
                      <div
                        className={`timeline-node timeline-node--${node.nodeType} timeline-node--static${isSelected ? " is-selected" : ""}`}
                        data-selected={isSelected ? "" : undefined}
                      >
                        <span className="timeline-node__mark" aria-hidden="true">{type.icon}</span>
                        <span className="timeline-node__date">{node.month ? `${node.month}月` : "日期未詳"}</span>
                        <strong>{node.title}</strong>
                        {node.imageCount > 0 ? <small>{node.imageCount} 張照片</small> : null}
                        <span className="timeline-node__hint timeline-node__hint--static">
                          {node.isCancelled ? "取消活動，尚無遊記" : "僅有活動紀錄"}
                        </span>
                        {node.note && node.isCancelled ? (
                          <small className="timeline-node__cancel-note">{node.note}</small>
                        ) : null}
                        {isSelected ? <span className="visually-hidden">目前預覽</span> : null}
                      </div>
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
            {selectedHref ? (
              <Link className="button button--primary" href={selectedHref}>閱讀完整故事</Link>
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