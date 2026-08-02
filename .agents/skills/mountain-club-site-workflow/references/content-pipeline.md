# Content Pipeline Reference

## Source of truth and provenance

- 原始典藏位於 `docs/stories/`：年度／月份／活動資料夾、同名 Markdown 和 `images/`。
- 建構流程只能讀取來源；不得因格式化、解析或圖片轉換而改寫來源。
- 只有在使用者明確要求加入或修正文獻時才改 `docs/stories/`，並保留既有目錄慣例、原文、檔名與來源說明。
- `docs/網站開發需求規格書-v1r00.md` 是需求與歷史基線；例行內容更新不應順手改規格。

## Explicit mapping

`src/content/story-map.ts` 是活動與故事關聯的唯一權威：

- `sequenceNumber`：時間軸排序與原表序號。
- `storyId`：穩定、唯一、ASCII kebab-case 路由 slug。
- `sourceDirectory`：相對於 `docs/stories/` 的精確目錄；無遊記活動為 `null`。
- `source`：`table` 或 `story-only`，不得靠地點／標題近似比對推導。

歷史缺號或新增補遺應明確標成 `story-only`，並在 UI 與 manifest warning 中保留 provenance。不要把缺號「修正」回原始前言表格，除非使用者明確要求更動史料來源。

## Manual metadata

`src/content/overrides.ts` 存放不能穩定自動解析的資料：

- 作者署名與別名
- 地點修正
- 人工摘要
- 裝飾性媒體
- 已確認、但不適合寫入通用 parser 的個案

先確認原始 Markdown 的證據，再新增 override。新增具名作者時，加一個 `tests/content/story-build.test.ts` 回歸斷言。

## Build commands

```bash
npm run content:check   # 驗證來源、映射、路徑與資料 invariants，不寫 generated JSON/media
npm run content:build   # 產生 JSON，重用未變更的 WebP 衍生檔
npm run content:clean   # 清除 public/media 後完整重建內容與圖片
npm run build           # content:clean + Next.js static export
```

`npm run content:check` 仍可能更新忽略的 `.next/content-cache` WMF raster cache；不得把這視為來源修改。

## Pipeline behavior

`scripts/build-content.ts`：

1. 掃描 year/month/story 目錄與前言、後記。
2. 使用 Markdown AST／GFM 解析 H1、日期 blockquote、段落、表格與圖片出現順序。
3. 解析前言活動表，跳過 separator 與重複表頭。
4. 將原表活動與 explicit story map 合併。
5. 用 paragraph blocks 取得摘要；作者採保守解析加 verified overrides。
6. 逐一驗證媒體存在，並對 canonical stories/story/images/file 路徑做 containment 檢查，拒絕 `..`、absolute path 與 symlink escape。
7. 依 Markdown occurrence 建立 evidence；不得依 `imageN` 數字排序。
8. 以 ImageMagick 將 WMF rasterize（優先使用 `magick`，缺少時支援 `convert`），再以 Sharp 產生 thumb/display/full WebP。
9. 將裝飾圖片保留為資產但排除於照片數量與 Lightbox。
10. 產生 previous/next story navigation、timeline、preface、afterword 與 manifest。

## Generated outputs

- `src/generated/stories.json`
- `src/generated/evidence.json`
- `src/generated/timeline.json`
- `src/generated/preface.json`
- `src/generated/afterword.json`
- `src/generated/manifest.json`
- `public/media/<storyId>/*-{thumb,display,full}.webp`

JSON 是 tracked build output，應審查 diff，但不手改。`public/media/` 是 ignored derivative，正式 build 使用 clean generation，避免孤兒檔。

## Corpus drift protocol

每次先讀 `src/generated/manifest.json`。目前觀測基線可能包含 39 Markdown、37 stories、44 source activities、45 timeline nodes、248 media、5 cancellations、7 no-image stories；這些只是當前資料結果，不是永久 skill 常數。

若資料規模有意改變：

1. 確認使用者要求與新增／移除來源。
2. 更新 `story-map.ts` 或 `overrides.ts`。
3. 更新 `scripts/build-content.ts` 中仍適用的明確 invariants；不要直接放寬所有檢查。
4. 更新 `tests/content/story-build.test.ts` 的預期與新個案。
5. 跑 `npm run content:clean`。
6. 審查全部 generated JSON、manifest warnings、故事前後導航與媒體數量。
7. 在 `tasks/todo.md` 記錄原因、舊值／新值和驗證結果。

## Accessibility content policy

原始圖片 alt 多為檔名，沒有可靠的視覺描述。不得臆測人物、地點或事件。保持保守的活動名稱／順序／來源檔名替代文字；若有人工作業提供 verified captions，再透過 override/data model 補入。明確裝飾圖片使用空 alt 並排除於 Lightbox。
