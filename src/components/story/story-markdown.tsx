import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isPhotoEvidence } from "@/lib/evidence";
import type { Evidence } from "@/lib/types";

type StoryMarkdownProps = {
  markdown: string;
  evidence: Evidence[];
};

export function StoryMarkdown({ markdown, evidence }: StoryMarkdownProps) {
  const evidenceByUrl = new Map(evidence.map((item) => [item.imageUrl, item]));
  const photos = evidence.filter(isPhotoEvidence);
  const photoIndex = new Map(photos.map((item, index) => [item.evidenceId, index]));

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="table-scroll" tabIndex={0} role="region" aria-label="可水平捲動的表格">
            <table>{children}</table>
          </div>
        ),
        img: ({ src, alt }: ComponentPropsWithoutRef<"img">) => {
          if (typeof src !== "string") return null;
          const item = evidenceByUrl.get(src);
          if (!item) return null;
          if (item.decorative) {
            return (
              <span className="story-decoration" aria-hidden="true">
                <Image alt="" height={item.height} src={item.imageUrl} width={item.width} />
              </span>
            );
          }
          const index = photoIndex.get(item.evidenceId);
          if (index === undefined) return null;
          return (
            <span className="story-photo">
              <button
                aria-label={`放大檢視：${item.altText}`}
                className="story-photo__button"
                data-evidence-index={index}
                type="button"
              >
                <Image
                  alt={item.altText || alt || ""}
                  height={item.height}
                  loading="lazy"
                  sizes="(max-width: 820px) 100vw, 780px"
                  src={item.imageUrl}
                  width={item.width}
                />
                <span className="story-photo__hint" aria-hidden="true">放大檢視 ↗</span>
              </button>
            </span>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
