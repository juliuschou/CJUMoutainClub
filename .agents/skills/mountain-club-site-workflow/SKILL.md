---
name: mountain-club-site-workflow
description: >
  Use when adding or revising this repository's mountain-club source stories,
  story mappings or metadata, Next.js UI and interactions, generated content,
  tests, static export, or release verification. Preserve docs/stories
  provenance, route non-derivable corrections through the explicit mapping and
  override files, regenerate derived artifacts, and report browser/runtime gaps
  honestly.
---

# Mountain Club Site Workflow

維護長榮登山社校友會靜態遊記網站時，使用這個工作流程。它補充專案中的 Next.js、React 與 runtime skills，專注於本專案的資料來源、映射、生成物和驗證邊界。

## 開始前

1. 執行 `git status --short`，不要假設工作樹乾淨。
2. 讀取 `src/generated/manifest.json` 取得目前資料規模；不要從本 skill 複製舊數字。
3. 將任務分類為：
   - 原始內容／照片更新
   - 故事映射／人工後設資料修正
   - UI／互動變更
   - 驗證／發佈
4. 非單純變更先更新 `tasks/todo.md`，列出可測試的驗收標準與驗證命令。

## 不可違反的邊界

- `docs/stories/` 是史料來源。除非使用者明確要求新增或修正文獻，否則視為唯讀；建構流程不得改寫來源 Markdown 或圖片。
- 活動與遊記只能透過 `src/content/story-map.ts` 的明確序號／ASCII slug／來源目錄映射，不使用地點模糊比對。
- 無法可靠推導的作者、地點、摘要與裝飾圖片分類放在 `src/content/overrides.ts`，不要堆疊脆弱 regex。
- 不直接編輯 `src/generated/*.json` 或 `public/media/**/*.webp`；它們由 `scripts/build-content.ts` 產生。
- 保持 Server Components 為預設，僅讓時間軸、Lightbox、焦點與瀏覽器 API 留在窄小的 Client Components。
- 不宣稱未實際執行的瀏覽器、Lighthouse、Next MCP 或無障礙檢查。

## 選擇工作流程

### 1. 原始內容或照片更新

先讀 [`references/content-pipeline.md`](references/content-pipeline.md)。確認來源路徑、Markdown 結構、媒體引用及 provenance，再跑 `npm run content:check`。任何資料規模變化必須是有意且同步反映在映射、驗證與測試中。

### 2. 映射或後設資料修正

- 序號、slug、來源目錄、`table`／`story-only` 來源：修改 `src/content/story-map.ts`。
- 作者、地點、摘要或裝飾性媒體：修改 `src/content/overrides.ts`。
- 更新 `tests/content/story-build.test.ts` 的具體回歸案例。
- 執行 `npm run content:build` 並審查 generated JSON diff。

### 3. UI 或互動變更

先使用專案已安裝的 `nextjs-app-router-patterns` 與 `vercel-react-best-practices`；時間軸或其他資料視覺化變更也使用 `dataviz`。

主要責任區：

- 路由與 Server Components：`src/app/`
- 時間軸：`src/components/timeline/timeline-explorer.tsx`
- Markdown／圖片：`src/components/story/story-markdown.tsx`
- Story client wrapper：`src/components/story/story-interactive.tsx`
- Lightbox：`src/components/evidence-lightbox.tsx`
- 響應式、focus、reduced-motion、forced-colors：`src/app/globals.css`

保持既有契約：鍵盤可操作節點、取消／無故事狀態不產生錯誤連結、表格可捲動、裝飾圖片不進 Lightbox、modal focus 可恢復、手機時間軸可閱讀。

### 4. 驗證或發佈

讀 [`references/verification.md`](references/verification.md)，先跑受影響區域的 targeted tests，再跑完整 static-export gate。`next-dev-loop` 只在其硬性前置條件全部成立時使用；否則執行靜態 HTTP smoke，並清楚記錄未涵蓋的 browser/Lighthouse 驗證。

## 完成與回報

回報必須包含：

- 哪些來源、映射、生成資料、頁面或互動行為改變。
- 實際執行的命令與結果。
- `src/generated/manifest.json` 是否出現預期變化。
- 靜態輸出與代表性路由／媒體是否通過。
- 任何因版本、工具或權限未執行的檢查，以及後續可執行的精確命令。
