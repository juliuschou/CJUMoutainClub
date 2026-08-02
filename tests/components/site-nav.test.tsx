import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { SiteNav } from "@/components/site-nav";

const pathnameMock = vi.fn<() => string | null>();

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

afterEach(() => {
  pathnameMock.mockReset();
  document.body.innerHTML = "";
});

describe("SiteNav active state", () => {
  it("marks exactly one item active with aria-current on an exact trailing-slash match", () => {
    pathnameMock.mockReturnValue("/timeline/");
    render(<SiteNav />);
    const links = screen.getAllByRole("link");
    const active = links.filter((link) => link.getAttribute("aria-current") === "page");
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent("時間軸");
    expect(active[0]).toHaveAttribute("href", "/timeline");
  });

  it("matches the slash-less pathname form too", () => {
    pathnameMock.mockReturnValue("/about");
    render(<SiteNav />);
    const active = screen.getByRole("link", { name: "關於" });
    expect(active).toHaveAttribute("aria-current", "page");
  });

  it("does not mark any nav item active on a story page (no timeline match)", () => {
    pathnameMock.mockReturnValue("/story/87-05-wushan");
    render(<SiteNav />);
    const active = screen.queryByRole("link", { name: "時間軸" });
    expect(active?.getAttribute("aria-current")).toBeNull();
    expect(screen.getAllByRole("link").filter((l) => l.getAttribute("aria-current") === "page")).toHaveLength(0);
  });

  it("always renders the four fixed hrefs", () => {
    pathnameMock.mockReturnValue("/");
    render(<SiteNav />);
    for (const label of ["時間軸", "前言", "後記", "關於"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});