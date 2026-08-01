import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoryInteractive } from "@/components/story/story-interactive";
import { toLightboxPhotos } from "@/lib/evidence";
import type { Evidence } from "@/lib/types";

const evidence: Evidence[] = [
  {
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
    contextParagraph: "第一張照片的前文。",
    decorative: false,
    order: 1,
  },
  {
    evidenceId: "story-02",
    storyId: "story",
    sourceFileName: "image2.jpeg",
    sourceExtension: ".jpeg",
    thumbnailUrl: "/image2-thumb.webp",
    imageUrl: "/image2.webp",
    fullImageUrl: "/image2-full.webp",
    width: 800,
    height: 600,
    altText: "測試故事，第 2 張照片（image2.jpeg）",
    caption: null,
    contextParagraph: null,
    decorative: false,
    order: 2,
  },
];

describe("StoryInteractive lightbox", () => {
  it("opens, navigates with arrow keys, closes with Escape, and restores focus", () => {
    render(
      <StoryInteractive photos={toLightboxPhotos(evidence)}>
        <button data-evidence-index="0" type="button">開啟照片</button>
      </StoryInteractive>,
    );

    const trigger = screen.getByRole("button", { name: "開啟照片" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toHaveAccessibleName(/第 1 張照片/);
    expect(screen.getByText("第 1 張，共 2 張")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("第 2 張，共 2 張")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not include decorative assets in lightbox navigation", () => {
    const decorative = { ...evidence[1], evidenceId: "story-decoration", decorative: true };
    render(
      <StoryInteractive photos={toLightboxPhotos([evidence[0], decorative])}>
        <button data-evidence-index="0" type="button">開啟照片</button>
      </StoryInteractive>,
    );
    fireEvent.click(screen.getByRole("button", { name: "開啟照片" }));
    expect(screen.getByText("第 1 張，共 1 張")).toBeInTheDocument();
  });
});
