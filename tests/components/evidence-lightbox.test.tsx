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
  it("opens the dialog with aria-modal, moves focus to the close button, and reports position", () => {
    render(
      <StoryInteractive photos={toLightboxPhotos(evidence)}>
        <button data-evidence-index="0" type="button">開啟照片</button>
      </StoryInteractive>,
    );

    const trigger = screen.getByRole("button", { name: "開啟照片" });
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName(/第 1 張照片/);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("第 1 張，共 2 張")).toBeInTheDocument();
    // Focus moves into the modal (to the close button).
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "關閉照片檢視器" }));
  });

  it("navigates forward with ArrowRight and stops at the last image", () => {
    render(
      <StoryInteractive photos={toLightboxPhotos(evidence)}>
        <button data-evidence-index="0" type="button">開啟照片</button>
      </StoryInteractive>,
    );
    fireEvent.click(screen.getByRole("button", { name: "開啟照片" }));

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("第 2 張，共 2 張")).toBeInTheDocument();

    // Beyond the last image: the counter must not go out of range.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("第 2 張，共 2 張")).toBeInTheDocument();
  });

  it("navigates backward with ArrowLeft and stops at the first image", () => {
    render(
      <StoryInteractive photos={toLightboxPhotos(evidence)}>
        <button data-evidence-index="1" type="button">開啟照片</button>
      </StoryInteractive>,
    );
    fireEvent.click(screen.getByRole("button", { name: "開啟照片" }));
    expect(screen.getByText("第 2 張，共 2 張")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("第 1 張，共 2 張")).toBeInTheDocument();

    // Before the first image: stays at 1.
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("第 1 張，共 2 張")).toBeInTheDocument();
  });

  it("restores focus to the triggering photo button after Escape closes the dialog", async () => {
    render(
      <StoryInteractive photos={toLightboxPhotos(evidence)}>
        <button data-evidence-index="0" type="button">開啟照片</button>
      </StoryInteractive>,
    );
    const trigger = screen.getByRole("button", { name: "開啟照片" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Focus restoration runs in requestAnimationFrame; flush it before asserting.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    expect(document.activeElement).toBe(trigger);
  });

  it("wraps Tab focus within the modal (Tab on last focusable returns to first)", () => {
    render(
      <StoryInteractive photos={toLightboxPhotos(evidence)}>
        <button data-evidence-index="0" type="button">開啟照片</button>
      </StoryInteractive>,
    );
    fireEvent.click(screen.getByRole("button", { name: "開啟照片" }));

    const focusable = screen.getAllByRole("button");
    // The last focusable button inside the dialog is the "下一張 →" button.
    const last = focusable[focusable.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(window, { key: "Tab" });
    // First focusable inside the dialog is the close button.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "關閉照片檢視器" }));
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