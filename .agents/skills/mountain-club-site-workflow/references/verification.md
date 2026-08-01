# Verification Reference

## Targeted checks first

依變更範圍先跑最小測試：

- Corpus／mapping／author／navigation：`tests/content/story-build.test.ts`
- Timeline selection、取消與無故事狀態：`tests/components/timeline-explorer.test.tsx`
- Markdown GFM table、圖片按鈕與 alt：`tests/components/story-markdown.test.tsx`
- Lightbox 開關、方向鍵、Esc、focus、decorative exclusion：`tests/components/evidence-lightbox.test.tsx`

範例：

```bash
npx vitest run tests/content/story-build.test.ts
npx vitest run tests/components/evidence-lightbox.test.tsx
```

## Full static-export gate

完成前依序執行：

```bash
npm run content:check
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

任何一步失敗就停止新增功能，保存 failing command／test／error，修正後從 targeted test 重跑。

## Inspect generated output

- 讀 `src/generated/manifest.json`，確認變化符合任務。
- 審查 `src/generated/*.json` diff，避免未預期的 slug、sequence、author、summary 或 navigation 漂移。
- 確認故事頁數與目前 manifest story count 一致。
- 確認 `public/media/` 有對應衍生檔，且 `out/` 的 `src`／`href` 不含 `.wmf` URL。
- 若圖片或映射變更，至少檢查一篇多照片故事、一篇無照片故事與受影響故事。

## Static preview and HTTP smoke

`next.config.ts` 使用 `output: 'export'` 與 `trailingSlash: true`。建構後：

```bash
npm run preview
```

Preview 只綁定 `127.0.0.1:4173`。等待 server ready，不要用固定 sleep。檢查：

- `/`
- `/timeline/`
- 一篇照片豐富故事，例如 `/story/92-10-hehuan-north-peak/`
- 一篇無照片故事，例如 `/story/87-00-yangmingshan/`
- `/preface/`
- `/afterword/`
- `/about/`
- 受影響的 `/media/<storyId>/<file>.webp`

對 HTML 路由確認 HTTP 200 與一個穩定內容 marker；對媒體確認 HTTP 200 和 WebP file signature。使用本工作階段追蹤的 background task ID 停止 preview，不要以寬泛 `pkill` 或未知 PID 終止程序。

HTTP smoke 只證明靜態伺服器可提供預期輸出；它不等同於真實瀏覽器互動、console、layout 或 Lighthouse 驗證。

## Conditional Next.js runtime verification

只有以下條件全部成立才使用 `next-dev-loop`：

1. `package.json`／installed Next.js 版本為 16.3+。
2. `next dev` 使用 Turbopack。
3. `agent-browser --version` 存在且版本至少 0.31.1。
4. `/_next/mcp` 的 `tools/list` 包含 `get_compilation_issues`。

成立時依 `next-dev-loop` skill 做：

- `get_routes`
- `get_compilation_issues`
- server/browser errors
- representative DOM interactions
- React-level boundary/render checks
- 同一個 worktree-scoped agent-browser session 與 teardown

若不成立，停止該 skill 路徑並精確回報缺少的版本／工具。不要用 HTTP smoke 冒充 browser verification。

截至 2026-08-02，本專案安裝 Next.js 16.2.12，且工作環境未提供 agent-browser；每次仍應重新檢查，不要把這項狀態永久視為真。

## Browser and Lighthouse matrix

有 Chromium／browser driver 時，至少驗證：

- 桌面、平板、手機 viewport。
- Timeline click、Tab、Enter/Space、year jump、density toggle。
- Cancelled/no-story preview 不出現錯誤 story link。
- Story image open、左右切換、Esc 關閉、focus restore。
- GFM table horizontal scroll。
- No-photo story state。
- Console 無錯誤、圖片無 404。
- Lighthouse performance 目標與 accessibility 結果。

沒有工具或安裝權限時，在 `tasks/todo.md` 和最終回報列出：未執行項目、原因、需要的工具及可重跑命令。不得標示為通過。

## Final report template

- **Changed:** source／mapping／overrides／UI／tests／generated outputs。
- **Verified:** command → observed result。
- **Static smoke:** routes and media checked。
- **Manifest:** expected old/new values or “unchanged”。
- **Unavailable:** browser、Next MCP、Lighthouse or other skipped checks with reason。
- **Operational:** config changes, build/preview commands, deployment/basePath assumptions。
