# 長榮大學登山社校友會遊記網站

將長榮大學（原長榮管理學院）登山社校友會 10 週年紀念遊記總集，轉化為一個以**時間軸為骨架、故事卡為內容單位、照片為敘事證據**的靜態網站。

使用者在網站上沿著時間前進，每到一個活動節點，就打開一張可獨立閱讀的故事卡，並透過照片直接感受當時的山行經歷。

## 設計理念

參考 [Anne Frank Timeline](https://www.annefrank.org/en/anne-frank/the-timeline/) 與本專案 `docs/` 目錄下的 UI 研究文件，提出「時間證據卡（Timeline Evidence Cards）」概念：

> 以時間控制故事節奏，以故事卡承載每個事件，並讓照片成為推動故事前進的核心證據。

### 三層架構

| 層次 | 概念 | 使用者問題 | 本專案對應 |
| --- | --- | --- | --- |
| 時間層 | 時間是敘事介面 | 接下來發生什麼？ | 民國 86–95 年活動時間軸 |
| 故事層 | 每個事件是獨立故事卡 | 這個活動發生了什麼？ | 每篇遊記 Markdown |
| 證據層 | 史料是故事的一部分 | 我們怎麼知道？ | 活動照片（`images/` 目錄） |

## 技術棧

- **框架：** [Next.js](https://nextjs.org/) 16（App Router）+ [React](https://react.dev/) 19
- **語言：** [TypeScript](https://www.typescriptlang.org/)
- **樣式：** [Tailwind CSS](https://tailwindcss.com/) 4
- **內容處理：** [remark](https://github.com/remarkjs/remark) / [unified](https://github.com/unifiedjs/unified) + [sharp](https://sharp.pixelplumbing.com/) 圖片處理
- **測試：** [Vitest](https://vitest.dev/) + Testing Library + jsdom；[Playwright](https://playwright.dev/) 響應式與連結驗收
- **CI：** GitHub Actions（內容檢查、型別、Lint、測試、靜態連結與瀏覽器驗證）
- **輸出：** 純靜態匯出（`output: "export"`），可直接放在任何靜態主機上。

## 資料來源

原始史料置於 `docs/stories/`，依年份與月份分目錄存放：

```
docs/stories/
├── 前言/前言.md          # 含活動年表（44 筆活動紀錄）
├── 後記/後記.md          # 出版資訊、作者群
├── 87年/05月/烏山/
│   ├── 烏山.md           # 該篇遊記 Markdown
│   └── images/           # 該篇遊記的活動照片
├── ...
└── 95年/
```

- **44 筆**原始活動年表紀錄 + 補入序號 24 = **45 個時間軸節點**
- **37 篇**遊記 Markdown
- **248 個**媒體引用（JPEG / PNG / WMF），其中 WMF 會在建構期轉為瀏覽器可顯示格式

> `docs/stories/` 為史料來源，**請勿直接修改**；不可從原始檔推導的訂正，一律透過 `src/content/` 下的顯式映射與覆寫檔處理。

## 內容建構流程

由 `scripts/build-content.ts` 在建構期統一解析，產生路由安全的 WebP 圖片與 JSON 資料：

1. 解析 `前言.md` 中的活動年表表格 → 44 筆活動紀錄。
2. 依 `src/content/story-map.ts` 的顯式映射，將年表序號對應到 `docs/stories/` 中的遊記目錄。
3. 套用 `src/content/overrides.ts` 中的非推導式訂正（摘要、作者、地點、裝飾圖標記等）。
4. 解析每篇 Markdown、抽取圖片引用，以 `sharp` 產生縮圖／顯示／全解析度三組 WebP。
5. 輸出至 `src/generated/`：`stories.json`、`timeline.json`、`evidence.json`、`preface.json`、`afterword.json`、`manifest.json`。

建構過程含多項不變量檢查（活動筆數、媒體檔數、故事數等），任一不符即建構失敗，確保衍生資料與來源一致。

## 目錄結構

```
.
├── docs/                    # 需求規格書、實作計畫、原始史料（stories/）
├── scripts/
│   └── build-content.ts     # 內容建構腳本
├── src/
│   ├── app/                 # Next.js App Router 路由（首頁、時間軸、故事、前言、後記、關於）
│   ├── components/          # UI 元件（時間軸、故事卡、Lightbox 等）
│   ├── content/             # 顯式 story map、站點導覽、非推導式覆寫
│   ├── generated/           # 建構期產生的 JSON（勿手動編輯）
│   ├── lib/                 # 型別與資料讀取輔助函式
│   └── ...
├── public/media/            # 建構期產生的 WebP 圖片（勿手動編輯）
├── tests/                   # Vitest 測試
├── tasks/                   # 工作紀錄與教訓筆記
├── .github/workflows/       # GitHub Actions 驗證流程
├── playwright.config.ts     # 瀏覽器驗收設定
└── next.config.ts
```

## 開始使用

### 環境需求

- **Node.js ≥ 20.9.0**
- 處理 WMF 圖片時需系統已安裝 [ImageMagick](https://imagemagick.org/)；建構流程優先使用 ImageMagick 7 的 `magick`，並支援 ImageMagick 6 的 `convert`。Ubuntu CI 會在驗證前安裝此系統套件。

### 安裝

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

會先執行 `content:build` 重新產生衍生資料，再以 Turbopack 啟動 `next dev`，預設位於 http://localhost:3000。

### 生產建構與預覽

```bash
npm run build      # 清潔並重新產生內容後靜態匯出至 out/
npm run preview    # 以靜態伺服器預覽 out/（http://127.0.0.1:4173）
```

## 常用指令

| 指令 | 說明 |
| --- | --- |
| `npm run content:build` | 解析史料並產生 `src/generated/` 與 `public/media/` |
| `npm run content:clean` | 先清除媒體輸出再重新建構 |
| `npm run content:check` | 只驗證不寫檔（CI 用） |
| `npm run typecheck` | TypeScript 型別檢查 |
| `npm run lint` | ESLint 檢查 |
| `npm run test` | 執行 Vitest 測試一次 |
| `npm run test:watch` | 監看模式執行測試 |
| `npm run check:links` | 掃描 `out/` 的 HTML、圖片與故事連結 |
| `npm run test:e2e` | 執行 Playwright 響應式與連結驗收 |
| `npm run verify:export` | 建構靜態網站並執行連結檢查 |
| `npm run deploy` | 重新建構並部署至 Cloudflare Pages |

## 路由總覽

| 路徑 | 內容 |
| --- | --- |
| `/` | 首頁（精選故事入口） |
| `/timeline/` | 45 節點互動時間軸 |
| `/story/[storyId]/` | 單篇遊記故事卡 |
| `/preface/` | 前言與指導老師的話 |
| `/afterword/` | 後記與出版資訊 |
| `/about/` | 關於本網站 |

故事卡的 `storyId` 為 ASCII slug（如 `94-07-daxueshan-orientation`），對應 `src/content/story-map.ts` 中的映射。

## 響應式與互動

- **手機／平板（< 1024px）：** 使用垂直時間軸，頁首品牌列與導覽列可換列，導覽項目保留至少 44px 觸控區。
- **桌面（≥ 1024px）：** 使用可水平滾動、觸控板與拖曳的時間軸；頁面本身不會因時間軸內容而產生水平捲動。
- **故事節點：** 有遊記的節點整張卡片是單一原生連結；取消或沒有遊記的活動則維持非互動狀態。
- **鍵盤與無障礙：** 導覽提供目前頁面狀態，故事卡可用鍵盤操作，照片 Lightbox 支援 Escape、方向鍵、焦點管理與焦點還原。

## 測試

單元與元件測試涵蓋內容建構、Markdown 呈現、時間軸互動、導覽與 Lightbox 無障礙行為：

```bash
npm run test
```

執行瀏覽器驗收前，先安裝 Playwright Chromium：

```bash
npx playwright install chromium
npm run test:e2e
```

完整的靜態輸出驗證可依序執行：

```bash
npm run content:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check:links
npm run test:e2e
```

## 部署

本專案設定為純靜態匯出（`output: "export"`，`trailingSlash: true`，圖片未最佳化），建構後 `out/` 目錄可直接部署至任何靜態檔案伺服器。圖片已於建構期轉為 WebP，無需伺服器端圖片處理。

### Cloudflare Pages（預設）

本專案已設定 `npm run deploy`，會重新建構後以 [Wrangler](https://developers.cloudflare.com/pages/functions/wrangler-cli/) 上傳 `out/` 至 Cloudflare Pages 專案 `cjuobhiking`，正式網址為 <https://cjuobhiking.pages.dev/>。

首次部署前需完成以下準備：

1. 安裝相依套件（已含 `wrangler` devDependency）：`npm install`
2. 登入 Cloudflare 帳號（瀏覽器授權一次即可）：`npx wrangler login`
3. 建立 Pages 專案（僅首次需要）：
   ```bash
   npx wrangler pages project create cjuobhiking --production-branch=main
   ```

之後每次更新內容，只需一行即可重新建構並部署：

```bash
npm run deploy
```

> 上述指令等同於 `npm run build && wrangler pages deploy out --project-name=cjuobhiking --branch=main --commit-dirty=true`。

### 其他靜態主機

`out/` 目錄為標準靜態檔案，亦可部署至 GitHub Pages、Netlify、Vercel 或任何靜態檔案伺服器。

## CI 驗證

`.github/workflows/verify.yml` 會在推送至 `main` 或建立 Pull Request 時執行：

1. 安裝 Node.js、Playwright Chromium 與 ImageMagick。
2. 執行 `content:check`、型別檢查、Lint 與 Vitest。
3. 建構靜態輸出並執行 `check:links`。
4. 以 Playwright 驗證不同視窗尺寸下的響應式版面、導覽 active state、故事連結與 404 行為。

若要在本機重現 CI 的主要檢查，可直接執行上方「測試」章節的完整驗證指令。正式部署至 Cloudflare Pages 不屬於 CI 自動流程，需另外執行 `npm run deploy`。

## 授權

本網站內容（遊記文字與活動照片）為長榮大學登山社校友會 10 週年紀念遊記總集之數位典藏，版權屬原作者與校友會所有。
