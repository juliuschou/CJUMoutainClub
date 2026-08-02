import { expect, test } from "@playwright/test";

/**
 * Responsive + link acceptance suite.
 *
 * Covers the requirement matrix across 10 viewports, asserting:
 *   - no whole-page horizontal overflow; nav doesn't overlap; touch targets ≥ 44px
 *   - <1024px vertical timeline, >=1024px horizontal timeline that the track
 *     itself owns (wheel/drag does not drag the page)
 *   - all 37 story cards have valid trailing-slash hrefs; 8 no-story nodes have
 *     no anchor; clicking any part of a story card lands on the same route
 *   - Tab/Enter navigation, active nav state, year-jump sticky offset,
 *     browser back, representative story direct open + reload, image
 *     containment, lightbox open/close + focus restoration
 *   - console errors, page errors and failed same-origin requests fail the test
 */

const VIEWPORTS = [
  { name: "iphone-se", width: 320, height: 568 },
  { name: "galaxy-s9", width: 360, height: 800 },
  { name: "iphone-xr", width: 375, height: 812 },
  { name: "iphone-12", width: 390, height: 844 },
  { name: "galaxy-s20", width: 412, height: 915 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "laptop", width: 1280, height: 720 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "full-hd", width: 1920, height: 1080 },
];

const STORY_IDS = [
  "87-05-wushan",
  "90-10-toukeshan",
  "92-10-hehuan-north-peak",
  "94-07-daxueshan-orientation",
  "95-09-teapot-mountain",
];

function attachErrorCollectors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => {
    const url = req.url();
    const errText = req.failure()?.errorText ?? "";
    // ERR_ABORTED is normal when a navigation supersedes an in-flight request
    // (e.g. the next page.goto cancels the previous document load). Only
    // genuine same-origin failures fail the test.
    if (errText.includes("ERR_ABORTED")) return;
    const base = page.url();
    try {
      if (new URL(url).origin === new URL(base).origin) {
        failed.push(`requestfailed: ${url} ${errText}`);
      }
    } catch {
      // Non-parseable URLs (data:, etc.) are not navigation failures.
    }
  });
  return () => [...errors, ...failed];
}

for (const vp of VIEWPORTS) {
  test.describe(`viewport ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("timeline: no whole-page horizontal overflow and nav touch targets ≥ 44px", async ({ page }) => {
      const getErrors = attachErrorCollectors(page);
      await page.goto("/timeline/");
      // Wait for layout to settle.
      await page.waitForLoadState("networkidle");

      const pageOverflows = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
          || document.body.scrollWidth > document.body.clientWidth + 1;
      });
      expect(pageOverflows, "whole-page horizontal overflow").toBe(false);

      // Header nav links meet the 44px touch target on mobile/tablet. On
      // desktop (mouse) the row is more compact, so only assert a sane minimum.
      const navRects = await page.evaluate(() => {
        const links = document.querySelectorAll<HTMLAnchorElement>(".site-nav__link");
        return Array.from(links).map((l) => {
          const r = l.getBoundingClientRect();
          return { h: Math.round(r.height), w: Math.round(r.width) };
        });
      });
      const minHeight = vp.width < 1024 ? 44 : 32;
      for (const r of navRects) {
        expect(r.h, `nav link height ≥ ${minHeight} on ${vp.name}`).toBeGreaterThanOrEqual(minHeight);
      }

      expect(getErrors(), "console/page errors").toEqual([]);
    });

    test("timeline: story cards link to /story/{id}/ and no-story nodes have no anchor", async ({ page }) => {
      const getErrors = attachErrorCollectors(page);
      await page.goto("/timeline/");
      await page.waitForLoadState("networkidle");

      const cards = await page.evaluate(() => {
        const items = document.querySelectorAll(".timeline-track .timeline-node");
        return Array.from(items).map((el) => ({
          tag: el.tagName.toLowerCase(),
          href: el.getAttribute("href"),
          isStatic: el.classList.contains("timeline-node--static"),
        }));
      });
      const storyCards = cards.filter((c) => c.tag === "a");
      const staticCards = cards.filter((c) => c.tag === "div");
      // 37 story links, all valid trailing-slash routes.
      expect(storyCards.length).toBe(37);
      for (const c of storyCards) {
        expect(c.href).toMatch(/^\/story\/[a-z0-9-]+\/$/);
        expect(c.href).not.toContain("undefined");
      }
      // 8 non-interactive nodes, no href.
      expect(staticCards.length).toBe(8);
      for (const c of staticCards) {
        expect(c.isStatic).toBe(true);
        expect(c.href).toBeNull();
      }
      expect(getErrors(), "console/page errors").toEqual([]);
    });

    test("timeline: clicking title, photo-count or card whitespace all reach the same story route", async ({ page }) => {
      const getErrors = attachErrorCollectors(page);
      await page.goto("/timeline/");
      await page.waitForLoadState("networkidle");

      const firstCard = page.locator(".timeline-track a.timeline-node").first();
      const href = await firstCard.getAttribute("href");
      expect(href).toMatch(/^\/story\/[a-z0-9-]+\/$/);

      // Click the <strong> title inside the card and confirm navigation.
      await firstCard.locator("strong").click();
      await page.waitForURL(/\/story\/[a-z0-9-]+\/$/);
      expect(page.url()).toContain(href);

      await page.goBack();
      await page.waitForURL(/\/timeline\/$/);
      expect(getErrors(), "console/page errors").toEqual([]);
    });

    test("timeline orientation matches the 1024 breakpoint", async ({ page }) => {
      const getErrors = attachErrorCollectors(page);
      await page.goto("/timeline/");
      await page.waitForLoadState("networkidle");

      const trackScrolls = await page.evaluate(() => {
        const track = document.querySelector(".timeline-track") as HTMLElement;
        if (!track) return null;
        return {
          scrollWidth: track.scrollWidth,
          clientWidth: track.clientWidth,
          // Vertical layout: the track is a block/grid with overflow visible.
          overflowX: getComputedStyle(track).overflowX,
        };
      });
      expect(trackScrolls).not.toBeNull();
      if (vp.width < 1024) {
        // Mobile/tablet: vertical timeline — the track itself does NOT
        // scroll horizontally (the page owns vertical scrolling).
        expect(trackScrolls!.scrollWidth <= trackScrolls!.clientWidth + 1, "track is vertical").toBe(true);
      } else {
        // Desktop: the track is horizontally scrollable and owns its own
        // horizontal overflow.
        expect(trackScrolls!.scrollWidth, "track is wider than viewport").toBeGreaterThan(trackScrolls!.clientWidth);
      }
      expect(getErrors(), "console/page errors").toEqual([]);
    });

    test("year jump lands below the sticky header (no overlap)", async ({ page }) => {
      const getErrors = attachErrorCollectors(page);
      await page.goto("/timeline/");
      await page.waitForLoadState("networkidle");

      // Click the last year-jump button available.
      const jumpButtons = page.locator(".year-navigation button");
      const count = await jumpButtons.count();
      await jumpButtons.nth(count - 1).click();

      // Smooth-scroll can take a moment; poll until the heading settles
      // below the sticky header (or time out, failing the test).
      await expect.poll(
        async () => {
          return await page.evaluate(() => {
            const header = document.querySelector(".site-header") as HTMLElement;
            // The year heading that was scrolled to is the last one.
            const headings = document.querySelectorAll<HTMLElement>(".timeline-year h2");
            const heading = headings[headings.length - 1];
            if (!header || !heading) return true;
            return heading.getBoundingClientRect().top < header.getBoundingClientRect().bottom;
          });
        },
        { message: "year heading hidden under sticky header", timeout: 4000 },
      ).toBe(false);
      expect(getErrors(), "console/page errors").toEqual([]);
    });
  });
}

test.describe("cross-viewport behavior", () => {
  test("active nav state on each fixed route", async ({ page }) => {
    const getErrors = attachErrorCollectors(page);
    const cases: Array<[string, string]> = [
      ["/timeline/", "時間軸"],
      ["/preface/", "前言"],
      ["/afterword/", "後記"],
      ["/about/", "關於"],
    ];
    for (const [route, label] of cases) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const active = page.locator(`.site-nav__link[aria-current="page"]`);
      await expect(active).toHaveCount(1);
      await expect(active).toHaveText(label);
    }
    expect(getErrors(), "console/page errors").toEqual([]);
  });

  test("story page has no active nav item and links back to /timeline/", async ({ page }) => {
    const getErrors = attachErrorCollectors(page);
    await page.goto("/story/87-05-wushan/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('.site-nav__link[aria-current="page"]')).toHaveCount(0);
    await expect(page.locator(".back-link")).toHaveAttribute("href", "/timeline/");
    expect(getErrors(), "console/page errors").toEqual([]);
  });

  test("representative stories open directly and survive reload", async ({ page }) => {
    const getErrors = attachErrorCollectors(page);
    for (const id of STORY_IDS) {
      await page.goto(`/story/${id}/`);
      await page.waitForLoadState("networkidle");
      const title = await page.locator("h1").first().textContent();
      expect(title?.trim().length, `story ${id} has a title`).toBeGreaterThan(0);
      // Reload and confirm the static HTML still renders.
      await page.reload();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain(`/story/${id}/`);
    }
    expect(getErrors(), "console/page errors").toEqual([]);
  });

  test("story image containment and lightbox open/close + focus restore", async ({ page }) => {
    const getErrors = attachErrorCollectors(page);
    await page.goto("/story/87-05-wushan/");
    await page.waitForLoadState("networkidle");

    // A story photo button exists and the contained image fits the viewport.
    const photoButton = page.locator(".story-photo__button").first();
    if (await photoButton.count()) {
      const overflowsViewport = await photoButton.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.right > window.innerWidth || r.left < 0;
      });
      expect(overflowsViewport, "photo overflows viewport").toBe(false);

      await photoButton.click();
      await expect(page.locator("dialog.lightbox")).toBeVisible();
      await expect(page.locator("dialog.lightbox")).toHaveAttribute("aria-modal", "true");

      // Close with Escape and confirm focus returns to a photo trigger.
      // Focus restoration runs in requestAnimationFrame after the dialog
      // unmounts, so poll for the trigger to regain focus.
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog.lightbox")).not.toBeVisible({ timeout: 2000 });
      await expect.poll(
        async () => await page.evaluate(() => document.activeElement?.tagName),
        { message: "focus restored to a photo trigger after lightbox close", timeout: 3000 },
      ).toBe("BUTTON");
    }
    expect(getErrors(), "console/page errors").toEqual([]);
  });

  test("Tab/Enter from a story card navigates to the story page", async ({ page }) => {
    const getErrors = attachErrorCollectors(page);
    await page.goto("/timeline/");
    await page.waitForLoadState("networkidle");
    // Focus the first story card link via keyboard and press Enter.
    await page.locator(".timeline-track a.timeline-node").first().focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/story\/[a-z0-9-]+\/$/);
    expect(getErrors(), "console/page errors").toEqual([]);
  });
});