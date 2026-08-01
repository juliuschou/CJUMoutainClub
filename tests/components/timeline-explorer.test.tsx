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
  it("updates the evidence card from keyboard-operable node buttons", () => {
    render(<TimelineExplorer nodes={nodes} />);
    fireEvent.click(screen.getByRole("button", { name: /頭嵙山/ }));
    expect(screen.getByRole("heading", { name: "頭嵙山" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "閱讀完整故事" })).toHaveAttribute("href", "/story/story");
  });

  it("shows cancellation reason without creating a story link", () => {
    render(<TimelineExplorer nodes={nodes} />);
    fireEvent.click(screen.getByRole("button", { name: /大克山/ }));
    expect(screen.getAllByText("因颱風取消")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "閱讀完整故事" })).not.toBeInTheDocument();
    expect(screen.getByText("原始典藏未附遊記全文")).toBeInTheDocument();
  });
});
