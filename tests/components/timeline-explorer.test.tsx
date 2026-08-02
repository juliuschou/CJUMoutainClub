import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimelineExplorer } from "@/components/timeline/timeline-explorer";
import type { TimelineNode } from "@/lib/types";

const nodes: TimelineNode[] = [
  {
    storyId: "founding",
    sequenceNumber: 0,
    source: "table",
    year: 86,
    month: 5,
    fullDateLabel: "民國86年5月",
    rawDateLabel: "86年5月14日",
    title: "成立校友會",
    location: "成立校友會",
    attendees: null,
    note: null,
    isCancelled: false,
    hasStory: false,
    imageCount: 0,
    nodeType: "normal",
    summary: "成立校友會。",
    thumbnailUrls: [],
  },
  {
    storyId: "cancelled",
    sequenceNumber: 12,
    source: "table",
    year: 90,
    month: 7,
    fullDateLabel: "民國90年7月",
    rawDateLabel: "90年7月28~29日",
    title: "大克山",
    location: "大克山",
    attendees: 0,
    note: "因颱風取消",
    isCancelled: true,
    hasStory: false,
    imageCount: 0,
    nodeType: "cancelled",
    summary: "因颱風取消",
    thumbnailUrls: [],
  },
  {
    storyId: "story",
    sequenceNumber: 13,
    source: "table",
    year: 90,
    month: 10,
    fullDateLabel: "民國90年10月",
    rawDateLabel: "90年10月13~14日",
    title: "頭嵙山",
    location: "頭嵙山",
    attendees: 9,
    note: null,
    isCancelled: false,
    hasStory: true,
    imageCount: 3,
    nodeType: "normal",
    summary: "一段山行故事。",
    thumbnailUrls: [],
  },
];

describe("TimelineExplorer", () => {
  it("renders story nodes as a single Link whose whole card is one hit area", () => {
    render(<TimelineExplorer nodes={nodes} />);
    // The story node is a link whose accessible name covers date, title and photo count.
    const storyLink = screen.getByRole("link", { name: /頭嵙山/ });
    expect(storyLink).toHaveAttribute("href", "/story/story");
    // Date and photo count live inside the same anchor (same hit area).
    expect(storyLink).toHaveTextContent("10月");
    expect(storyLink).toHaveTextContent("3 張照片");
    // No nested interactive elements inside the link.
    expect(storyLink.querySelector("button, a")).toBeNull();
  });

  it("initially selects the first valid story and shows its preview", () => {
    render(<TimelineExplorer nodes={nodes} />);
    // First valid story is 頭嵙山 (founding has no story).
    expect(screen.getByRole("heading", { name: "頭嵙山" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "閱讀完整故事" })).toHaveAttribute("href", "/story/story");
  });

  it("updates the preview on focus of a story card", () => {
    render(<TimelineExplorer nodes={nodes} />);
    const storyLink = screen.getByRole("link", { name: /頭嵙山/ });
    fireEvent.focus(storyLink);
    // Selected marker exposed as non-color cue.
    expect(storyLink.getAttribute("data-selected")).toBe("");
    expect(screen.getByText("目前預覽")).toBeInTheDocument();
  });

  it("does not create a link for cancelled or no-story nodes", () => {
    render(<TimelineExplorer nodes={nodes} />);
    // No-story founding node has no anchor.
    expect(screen.queryByRole("link", { name: /成立校友會/ })).not.toBeInTheDocument();
    // Cancelled node has no anchor and shows its reason.
    expect(screen.queryByRole("link", { name: /大克山/ })).not.toBeInTheDocument();
    expect(screen.getByText("因颱風取消")).toBeInTheDocument();
  });

  it("never produces an undefined story route", () => {
    const { container } = render(<TimelineExplorer nodes={nodes} />);
    expect(container.querySelector('a[href="/story/undefined/"]')).toBeNull();
    expect(container.querySelector('a[href="/story/undefined"]')).toBeNull();
  });

  it("keeps year-jump and density controls keyboard-operable as buttons", () => {
    render(<TimelineExplorer nodes={nodes} />);
    expect(screen.getByRole("button", { name: /民國 86 年/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /民國 90 年/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /收合為全年總覽/ })).toBeInTheDocument();
  });

  it("does not mark story-card selection with aria-pressed", () => {
    render(<TimelineExplorer nodes={nodes} />);
    const storyLink = screen.getByRole("link", { name: /頭嵙山/ });
    fireEvent.focus(storyLink);
    expect(storyLink.getAttribute("aria-pressed")).toBeNull();
  });
});