import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoryMarkdown } from "@/components/story/story-markdown";
import type { Evidence } from "@/lib/types";

const photo: Evidence = {
  evidenceId: "story-01",
  storyId: "story",
  sourceFileName: "image1.jpeg",
  sourceExtension: ".jpeg",
  thumbnailUrl: "/image1-thumb.webp",
  imageUrl: "/image1.webp",
  fullImageUrl: "/image1-full.webp",
  width: 800,
  height: 600,
  altText: "測試故事，第 1 張照片（image1.jpeg）",
  caption: null,
  contextParagraph: null,
  decorative: false,
  order: 1,
};

describe("StoryMarkdown", () => {
  it("renders GFM tables inside a scrollable region", () => {
    render(<StoryMarkdown evidence={[]} markdown={"| 早餐 | 午餐 |\n| --- | --- |\n| 麵包 | 飯糰 |"} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "可水平捲動的表格" })).toBeInTheDocument();
  });

  it("uses generated accessible image text and an explicit zoom button", () => {
    render(<StoryMarkdown evidence={[photo]} markdown="![image1.jpeg](/image1.webp)" />);
    expect(screen.getByRole("img", { name: photo.altText })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `放大檢視：${photo.altText}` })).toHaveAttribute("data-evidence-index", "0");
  });
});
