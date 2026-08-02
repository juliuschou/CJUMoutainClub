import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the static export.
 *
 * By default the suite runs against the local static preview (`npm run
 * preview` serving out/ on 127.0.0.1:4173). Set BASE_URL to re-run the same
 * smoke tests against a deployed Cloudflare Pages URL:
 *
 *   BASE_URL=https://<project>.pages.dev npm run test:e2e
 *
 * Only Chromium is configured so broken-link gating stays fast in CI; the
 * responsive matrix is covered by per-test viewport emulation, not by
 * launching multiple browsers.
 */
const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start the static preview server automatically unless BASE_URL points
  // elsewhere (e.g. a deployed Cloudflare URL).
  ...(process.env.BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run preview",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});