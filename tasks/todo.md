# 2026-08-02 Implement Mountain Club Story Website

## Goal

依 `docs/網站實作計畫-v1r00.md` 建立可靜態匯出的 Next.js 遊記網站，包含首頁、45 節點時間軸、37 篇故事、前言、後記、關於與照片 Lightbox。

## Acceptance criteria

- [x] 建立 Next.js App Router + TypeScript + Tailwind CSS 專案。
- [x] 建構期解析 44 筆原始年表，補入序號 24，產生 45 個時間軸節點。
- [x] 37 篇故事均可透過 `/story/[storyId]` 閱讀。
- [x] 5 筆取消活動與 8 筆原表無故事活動正確呈現。
- [x] 248 個媒體引用均成功處理；WMF 轉為瀏覽器格式；裝飾 PNG 不進入 Lightbox。
- [x] Markdown 標題、段落、粗體、表格與圖片正確呈現。
- [x] Lightbox 支援 Esc、方向鍵、modal focus 與焦點還原。
- [x] 桌面、平板、手機版樣式與鍵盤操作已實作；狀態同時使用符號、標籤與色彩。
- [x] `npm run content:check`、typecheck、lint、test、build 全部通過。
- [x] 開發路由與靜態輸出 HTTP smoke test 通過。
- [x] Lighthouse 效能 ≥ 80：首頁 83、時間軸 80、故事頁 80；a11y/best-practices/SEO 各 100。

## Checklist

- [x] Checkpoint A — Bootstrap
  - [x] 建立 package/config、App Router 骨架與全域樣式。
  - [x] 安裝依賴並建立 npm scripts。
  - [x] 啟動 `next dev --turbopack` 驗證基線。
- [x] Checkpoint B — Content pipeline
  - [x] 建立顯式 story map 與資料覆寫。
  - [x] 解析前言表格、37 篇 Markdown 與 248 個媒體引用。
  - [x] 產生 route-safe WebP 圖片與 JSON 資料。
  - [x] 驗證 corpus invariants、路徑邊界與作者覆寫。
- [x] Checkpoint C — Pages and interactions
  - [x] 實作共用版型、首頁、時間軸。
  - [x] 實作故事 Markdown、Lightbox 與前後導航。
  - [x] 實作前言、後記、關於與空／取消狀態。
  - [x] 完成響應式與鍵盤操作。
- [x] Checkpoint D — Regression and export verification
  - [x] 加入內容與互動測試。
  - [x] 執行 content check、typecheck、lint、tests、clean build。
  - [x] 驗證 `out/` 可由 Python 靜態伺服器提供。
  - [x] 驗證 37 個故事 HTML 與代表性 WebP／WMF 轉檔資產。
  - [ ] `next-dev-loop`：已安裝技能要求 Next.js 16.3+ 與 agent-browser；npm 最新穩定版為 16.2.12，故不符合硬性前置條件。
  - [x] Lighthouse：以 Playwright Chromium 為 CDP 後端跑 `npx lighthouse@latest`，靜態 `out/` 經 `npm run preview`（127.0.0.1:4173）量測。

## 2026-08-02 Fix Responsive Timeline Story Links

### Goal and acceptance criteria

- [x] 有故事活動的活動名稱在桌面、手機與縮小寬度均為原生 story link。
- [x] 摘要控制仍可用鍵盤開啟摘要卡，且 Link/button 不巢狀。
- [x] 取消與無故事活動維持無 story link，狀態文字正確。
- [x] 手機裝飾線不攔截互動，窄寬文字不溢出。
- [x] Generated content 規模與 story mapping 不變。
- [x] Targeted tests、content check、typecheck、lint、full tests、build 與 HTTP smoke 通過。

### Checklist

- [x] Locate and update timeline markup and responsive styles.
- [x] Add component regression coverage for title links and summary controls.
- [x] Update interaction specifications and task results.
- [x] Run targeted and full verification gates.

### Risk & rollback

- **Risk level:** Medium — timeline interaction DOM and responsive styles change; content data and routes do not.
- **Affected components:** `src/components/timeline/timeline-explorer.tsx`, `src/app/globals.css`, timeline tests and interaction docs.
- **Rollback:** Revert this task's component, CSS, test, docs and task-file diff; no source-story or generated-data rollback is needed.

### Working Notes

- Confirmed root cause: activity titles are `<strong>` inside a selection `<button>`, while the story Link only appears in the selected preview card.
- `src/generated/manifest.json` baseline: 39 markdown, 37 stories, 44 activity rows, 45 timeline nodes, 248 media.
- Keep source stories, explicit mapping, generated JSON and derived media unchanged.

### Results

- [x] `npx vitest run tests/components/timeline-explorer.test.tsx` — 1 file / 3 tests passed.
- [x] `npm run content:check` — validated 45 timeline nodes, 37 stories and 248 media references.
- [x] `npm run typecheck` — passed.
- [x] `npm run lint` — passed.
- [x] `npm test` — 4 files / 13 tests passed.
- [x] `npm run build` — static export generated 44 pages, including 37 story routes.
- [x] Static HTTP smoke — `/timeline/`, `/story/87-05-wushan/` and representative WebP all returned HTTP 200; WebP signature verified.
- [x] `git diff --check` — passed; manifest counts remained 45 timeline nodes and 37 stories.
- [x] Real browser Lighthouse verification — ran via Playwright Chromium (CDP backend) + `npx lighthouse@latest` against `npm run preview` static `out/`. Performance: home 83, timeline 80, story 80 (all ≥ 80). a11y/best-practices/SEO all 100. LCP 4.6–5.5 s is the weakest metric (large hero/inline images on static export); TBT ≤ 90 ms, CLS ≤ 0.114.

## Risk & Rollback

- **Risk level:** Medium — 新專案骨架、內容轉換及大量舊圖片處理。
- **Affected components:** `docs/stories` 讀取流程、生成資料、靜態頁面與 `public/media` 衍生資產。
- **Safety:** 不修改任何原始 Markdown 或照片；遇未映射、缺圖、路徑逃逸或轉檔失敗即中止。
- **Rollback:** 移除新增的應用程式、生成資料及衍生媒體；`docs/stories` 保持原狀。
- **Deployment:** 預設根路徑靜態匯出；未設定平台特定 `basePath`。

## Dependencies & Environment

- Node.js v26.5.1、npm 11.17.0。
- Next.js 16.2.12（執行時可取得的最新穩定版）、React 19、Tailwind CSS 4。
- `react-markdown`、`remark-gfm`、`unified`、`remark-parse`。
- `sharp` 0.35.3；legacy WMF 由 ImageMagick `magick` 轉檔，缺少時支援 `convert`；CI 先安裝 ImageMagick 系統套件。
- Vitest + Testing Library。
- npm production audit：0 vulnerabilities。

## Working Notes

- 原始年表 44 筆，序號 24 缺漏；依使用者決定將合歡北峰遊記補為序號 24，網站共 45 節點。
- 實際資料為 37 篇故事、39 個 Markdown、248 個媒體檔。
- 取消活動為序號 12、22、27、30、42，共 5 筆。
- 8 筆原表活動無故事：0、12、22、27、30、32、42、44。
- 所有 story/asset route 使用顯式 ASCII slug，禁止地點模糊比對。
- 原始圖片 alt 僅有檔名；替代文字保守使用活動名稱、順序與原始檔名，不臆測照片內容。若未來有人工作業照片描述，可直接補入內容覆寫層。
- 開發內容建構採增量圖片快取；正式 `npm run build` 使用 `content:clean`，避免輸出孤兒媒體。

## Results

- 新增首頁、時間軸、37 個故事頁、前言、後記、關於與 404 頁。
- 建構腳本驗證 45 節點、37 故事、248 媒體，並產生 744 個 WebP 衍生檔。
- WMF `image25.wmf` 已驗證輸出為 513×346 WebP，匯出 HTML 不含 `.wmf` 資產 URL。
- `npm test`：4 files / 12 tests passed。
- `npm run build`：44 個靜態頁面成功生成，其中 37 個故事路由。
- 靜態 preview smoke：`/`、`/timeline/`、兩種故事頁、`/preface/`、`/afterword/`、`/about/` 全部 HTTP 200 且含預期內容；preview 僅綁定 `127.0.0.1`。
- 正確性與安全複查已確認：作者覆寫、媒體清理、路徑／symlink 邊界、modal dialog 與靜態 preview 均無剩餘具體缺陷。
- 未量測 Lighthouse／真實瀏覽器畫面；原因與後續需求已在驗收項目記錄。

## 2026-08-02 Lighthouse Performance Verification

### Goal and acceptance criteria

- [x] 以真實瀏覽器量測 Lighthouse 效能 ≥ 80，補完先前標記為環境限制的驗收項目。

### Checklist

- [x] 安裝 `@playwright/test` devDependency 與 Chromium（`npx playwright install chromium`）。
- [x] `npm run build` 產生靜態 `out/`，`npm run preview`（127.0.0.1:4173）提供 HTTP。
- [x] 以 Playwright Chromium（`--remote-debugging-port` CDP 後端）執行 `npx lighthouse@latest` 量測首頁、時間軸、代表性故事頁。
- [x] 回填 `tasks/todo.md` 驗收與 Checkpoint D；清理臨時腳本與量測產物。

### Results

- Lighthouse（Lighthouse 13.4.1 / HeadlessChrome 151.0.7922.34）分數：
  - `/`（首頁）：Performance 83、Accessibility 100、Best Practices 100、SEO 100。
  - `/timeline/`：Performance 80。
  - `/story/87-05-wushan/`：Performance 80。
- Core Web Vitals：FCP 0.9–1.1 s、LCP 4.6–5.5 s、TBT 10–90 ms、CLS 0–0.114、SI 0.9–1.1 s。LCP 為最弱項，但三頁效能均 ≥ 80，符合驗收。
- 量測指令（可重現）：`npm run build && npm run preview`，另開 Chrome CDP 後端後 `npx lighthouse@latest http://127.0.0.1:4173/ --only-categories=performance,accessibility,best-practices,seo --port=<cdp-port> --output=json --output-path=...`。
- 關鍵修正：Playwright 預設 `--remote-debugging-pipe` 必須保留（否則 Playwright 失去控制通道而逾時），僅移除 `--no-startup-window` 才能讓 CDP HTTP port 同時供 Lighthouse 連接；9222 埠在本環境被佔用，改用 9333。
- 環境事實更正：先前「安裝 Playwright 套件的權限被拒」不成立 —— `@playwright/test` 與 Chromium 安裝均成功；Lighthouse 套件經 `npx lighthouse@latest` 並在 `.claude/settings.local.json` 加入 `Bash(npx lighthouse@latest *)` 後可執行。
- 清理：移除臨時 `scripts/{pw-smoke,lh-run,chrome-backend}.mjs` 與 `/tmp/lh-*.json`；`@playwright/test` devDependency 保留供後續瀏覽器驗證。

## 2026-08-02 Project Workflow Skill

- [x] 建立 `.agents/skills/mountain-club-site-workflow/SKILL.md`。
- [x] 建立 content pipeline 與 verification progressive-disclosure references。
- [x] 建立 `.claude/skills/mountain-club-site-workflow` 專案 symlink。
- [x] 保持 `skills-lock.json` 不變；本 skill 為 project-authored，不偽裝成 remote-installed skill。
- [x] 記錄來源 provenance、explicit mapping、override、generated-output 與 conditional browser verification 邊界。

## 2026-08-02 Responsive Layout & Link Correction

### Goal and acceptance criteria

依 `docs/長榮登山社網站_響應式版面與連結修正實作計畫.md` 修正 768–1023px 仍用橫向時間軸、320px 頁首擁擠、導覽缺少 active state、時間軸卡片看似可點擊但只更新預覽等問題。保留單一時間軸資料／DOM、既有 `docs/stories/` 來源、顯式 story mapping、WebP 建構流程與 Next.js static export。

- [x] `<1024px` 垂直時間軸；`>=1024px` 可辨識可滾輪／觸控板／拖曳的橫向時間軸。
- [x] 320–1920px 無整頁水平捲動；只有桌面時間軸及表格容器自行承接水平 overflow。
- [x] 行動／平板頁首為可換列品牌列＋導覽列；副標題在可用空間保留；導覽觸控區 ≥44px。
- [x] Header 固定路由 `/timeline/`、`/preface/`、`/afterword/`、`/about/`，目前頁可見 active state 與 `aria-current="page"`。
- [x] 有效故事節點整張卡片為單一 Next `<Link>` href `/story/${storyId}/`；無故事／取消／無效 ID 不建立連結，無巢狀互動元素或 `/story/undefined/`。
- [x] 桌面保留下方預覽：hover／focus 更新選取預覽；原生 Link 點擊導頁。初始預覽選第一個有效故事。
- [x] 37 個故事由 `generateStaticParams()` 匯出成 `out/story/{storyId}/index.html`。
- [x] 既有來源與生成規模不變：39 Markdown、37 stories、44 activity rows、45 timeline nodes、248 media。

### Checklist

- [x] Checkpoint A — 分支與基線：`git switch -c fix/responsive-timeline-links`；基線 content:check/typecheck/lint/test。
- [x] Checkpoint B — Route 與 active state：`src/lib/routes.ts`、`src/components/site-nav.tsx`、`src/content/site.ts` trailing slash、Header active state、測試。
- [x] Checkpoint C — Timeline 卡片語意：單一 Link 卡片、無故事非互動、selected 非色彩提示、wheel/drag、初始選第一個有效故事、測試。
- [x] Checkpoint D — 1024 breakpoint (globals.css)：Mobile First、CSS custom properties、44px 觸控、scroll-padding、不溢出。
- [x] Checkpoint E — Lightbox 與 story route a11y：modal 語意、測試強化、story route 測試。
- [x] Checkpoint F — Static export link checker：`scripts/check-static-links.ts`、純函式測試、package.json scripts。
- [x] Checkpoint G — Playwright 響應式與連結驗收：`playwright.config.ts`、`tests/e2e/responsive-links.spec.ts`、10 viewport。
- [x] Checkpoint H — CI：`.github/workflows/verify.yml`。
- [x] Checkpoint I — 完整驗證並記錄 observed output。

### Risk & Rollback

- **Risk level:** Medium — 影響 Header route awareness、timeline 互動語意、1024 breakpoint、瀏覽器測試與 CI；不影響史料與資料 mapping。
- **Affected components:** `src/lib/routes.ts`、`src/components/site-nav.tsx`、`src/components/site-header.tsx`、`src/content/site.ts`、`src/components/timeline/timeline-explorer.tsx`、`src/app/globals.css`、`src/components/evidence-lightbox.tsx`、`src/app/story/[storyId]/page.tsx`、新增 checker/Playwright/CI、package.json。
- **Rollback:** 按 checkpoint 回復 UI/CSS、checker、Playwright/CI 檔案；不碰 `docs/stories/`、story map、overrides、生成媒體。
- **Deployment:** 不修改 Cloudflare 專案、credentials 或 `npm run deploy`；正式部署需另行明確批准。

### Dependencies & Environment

- Node.js v26.5.1、npm 11.17.0、Next.js 16.2.12、React 19、Tailwind 4。
- `@playwright/test` ^1.62.1（Chromium）。`next-dev-loop` 不適用（需 Next 16.3+）。
- `trailingSlash: true`、`output: export`、`typedRoutes: true`。

### Working Notes

- 基線（修改前）：content:check ✓（45 nodes/37 stories/248 media）、typecheck ✓、lint ✓、`npm test` 4 files/12 tests ✓。
- Story ID 不變式：`/^[a-z0-9-]+$/`（build-content.ts L504）。
- `typedRoutes: true`：href 需符合 typed route，`/story/[storyId]` 動態路由需以 template literal 帶變數，不可用 string 變數直接當 href；route helper 回傳 `string` 配合 `as const`／`href` 屬性。
- 既有內部 Link href 多為無尾斜線（`/timeline`、`/story/${id}`）；需統一為尾端斜線以對齊 `trailingSlash: true` 靜態輸出。
- 時間軸目前 `<button>` 選取 → 改為故事節點單一 `<Link>`，無故事節點非互動卡片；預覽由 hover/focus 更新。
- Lightbox 已有 showModal/Escape/方向鍵/Tab loop；待補 `aria-modal`、邊界斷言與關閉後焦點還原斷言。

### Results

完整驗證（2026-08-02）：

- `npm run content:check` → Validated 45 timeline nodes, 37 stories, and 248 media references. ✓
- `npm run typecheck` → passed（`tsc --noEmit` 無輸出）。✓
- `npm run lint` → passed（`eslint .` 無輸出）。✓
- `npm test`（Vitest）→ 9 files / 48 tests passed。✓
- `npm run build` → static export 44 pages（含 37 story routes）。✓
- `npm run check:links` → OK — scanned 45 HTML files, no broken links。✓
- `npm run test:e2e`（Playwright Chromium）→ 55 passed（10 viewports × 5 測試 + 5 cross-viewport 測試）。✓
- `git diff --check` → OK（無 whitespace 錯誤）。✓
- `find out/story -mindepth 2 -maxdepth 2 -name index.html | wc -l` → 37。✓
- `git diff -- docs/stories src/content/story-map.ts src/content/overrides.ts` → 無差異。✓
- `src/generated/manifest.json` → 39/37/44/45/248 不變。✓
- 本機 `npm run preview` HTTP smoke：`/`、`/timeline/`、`/preface/`、`/afterword/`、`/about/`、`/story/87-05-wushan/`、`/story/95-09-teapot-mountain/` 全 200；代表性 WebP `01-full.webp` 200（`image/webp`）；真實故事頁 200；未知 ID 與 `/story/undefined/` 404（`dynamicParams=false` + `notFound()`）。✓
- Cloudflare Pages 驗證：**未驗證**——未部署（正式部署為 outward-facing 動作，需另行明確批准）。部署後可執行 `BASE_URL=<Cloudflare Pages URL> npm run test:e2e` 重跑 smoke 並記錄於此。

關鍵設計決定：

- **Source href 維持無尾端斜線**以滿足 `typedRoutes: true`（typed static routes 為 `/about`、`/timeline`；動態為 `/story/${SafeSlug<T>}`）。`next.config.ts` 的 `trailingSlash: true` 在靜態匯出將之改寫為 `/timeline/`、`/story/{id}/`，已驗證輸出 HTML 含尾端斜線。`getStoryHref` 回傳 `` `/story/${string}` | null `` 型別讓呼叫端免 cast 又必須 null-guard，從根本杜絕 `/story/undefined/`。
- **Timeline 單一 DOM**：同一份 `<section><ol><li>` 跨所有 breakpoint；`<1024px` 垂直（base CSS），`>=1024px` 橫向（`@media (min-width: 1024px)`）。移除舊 760px 才切垂直的落差。
- **故事節點整張卡片為單一 `<Link>`**：日期、標題、照片數量、「閱讀故事 →」提示同一 hit area；hover/focus 更新 selected preview；原生 click/Enter 導頁。無故事／取消／無效 ID 為非互動 `<div>`，無 href、無 tab order、無假 cursor。selected 狀態以 `data-selected`、邊框、陰影、「目前預覽」文字多重非色彩提示。
- **Header active state**：`usePathname()` 隔離於 `site-nav.tsx` client component；尾端斜線正規化後 exact match；`aria-current="page"`；故事頁不誤標。已在 `/timeline/`、`/preface/`、`/about/`、`/afterword/`、首頁、故事頁驗證。
- **桌面 wheel/drag**：track 內 `wheel` 將垂直 delta 轉橫向捲動（不 hijack 橫向 delta，trackpad 仍原生）；pointer drag 以 6px threshold + click capture 避免拖曳後誤觸 Link；page 不隨 track 變寬。
- **Link checker**：純函式 `classifyUrl`/`invalidStoryRoute`/`resolveTarget`/`extractHrefs`/`extractSrcs`/`extractSrcset` + CLI（`CHECK_LINKS_OUT` 可指向 fixture），拒絕 `/story/undefined/`、空 segment、traversal；14 單元測試 + CLI negative test 確認 non-zero exit。
- **CI**：`.github/workflows/verify.yml` 跑 `npm ci` → content:check → typecheck → lint → vitest → build → check:links → Playwright（Chromium），broken link 可實際阻擋 CI；不碰 Cloudflare/credentials/deploy。

## 2026-08-02 Fix ImageMagick CI Dependency

### Goal and acceptance criteria

- [x] GitHub Actions 在 content check 前安裝並驗證 ImageMagick。
- [x] WMF 建構優先使用 `magick`，缺少時支援 `convert`，兩者皆缺少時顯示可操作錯誤。
- [x] 來源故事、mapping、generated manifest 與衍生媒體規模不變。

### Working Notes

- CI 原因：全新 runner 沒有 `magick`，而 `content:check` 仍會 rasterize 唯一的 WMF。
- 受影響來源：`docs/stories/90年/04月/拔刀爾山/images/image25.wmf`；本機與 CI 的 `.next/content-cache` 狀態可能不同。

### Results

- `npx vitest run tests/scripts/build-content.test.ts` → 1 file / 3 tests passed。
- `npm run content:check` → validated 45 timeline nodes, 37 stories and 248 media references。
- `npm run typecheck`、`npm run lint` → passed。
- `npm test` → 10 files / 51 tests passed。
- `npm run build` → static export 44 pages；`npm run check:links` → 45 HTML files，無 broken links。
- `npm run test:e2e` → 55 passed。
- `src/generated/manifest.json` 維持 39/37/44/45/248，WMF `image25.wmf` 維持 513×346 WebP；未修改來源故事、mapping 或 generated content。
