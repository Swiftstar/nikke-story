# 地表紀事 / NIKKE CHRONICLE

以遊戲故事發生年代編排的繁體中文劇情考據 SPA。手機連續捲動、主脈絡直接閱讀、考據可展開，支援深淺色、人物／篇章搜尋、分類、事件分享與本機閱讀進度。

## 本機預覽

Node.js 22 以上，無 npm 套件依賴：

```sh
npm run dev
```

開啟 http://127.0.0.1:5173。資料透過 fetch 載入，請勿直接以 file:// 開啟 HTML。

```sh
npm run check
npm run build
```

靜態產物在 `dist/`。可直接架設於 GitHub Pages 的個人網站或專案子路徑；所有站內資源用相對路徑、事件用 hash 連結，重新整理不需要伺服器路由。

## GitHub Pages

Repository 是 [Swiftstar/nikke-story](https://github.com/Swiftstar/nikke-story)，主分支使用 `main`。Settings → Pages 的 Source 為 GitHub Actions。推送到 `main` 會執行 `.github/workflows/pages.yml`：檢查資料、建立 `dist`、部署到 https://swiftstar.github.io/nikke-story/ 。站內資源使用相對路徑，專案子路徑重新整理不需要額外路由。

## 內容狀態與考據規則

劇情來源限定為使用者指定的 BlablaLink 官方社群站（blablalink.com）。目前整理 114 則事件，涵蓋官方歷史概述、檔案館 Red Ash、Old Tales、Over Zone 與 Unbreakable Sphere，以及第 00–48 章已讀主幹。主線索引收到第 48 章。部分場景有選項，尚未遍歷全部分支，個別選項後續也仍有待讀部分，詳見 `data/main-story/reading-log.json`。先前僅由外站支持的段落不得改掛官方連結冒充已核對。

不要以活動推出日期排列歷史，不要虛構絕對年份。相對年代、重疊事件、跨期敘事必須標示；故事中的同時事件不應被假定為嚴格先後。OLD TALES II 的後日談尚待拆分細年表。地表戰爭到現代之間的空白與主線後續仍待補足。

`data/timeline.json` 保存年代、原創摘要、人物、因果、考據、整理者解讀與來源。新增內容時，先核對實際場景，再依事件發生時間插入 `events`；每則事件有固定 `id`，以維持分享網址與閱讀位置。新增資料須附 `sources`，並通過 `npm run check`。

`data/main-story/index.json` 是先前保存的官方站繁中主線索引；`sample-summary.md` 是已核對的第 00 章首場景筆記。未在 BlablaLink 取得依據的內容暫不收錄，名稱、用語與場景數以官方頁面為準。`npm run check` 會拒絕非 BlablaLink 網域的劇情來源。

第 01 章揭露的侵蝕時間已依角色調查前置於墜機以前；事故開場的對空武器說法不再被當作最終原因。閱讀紀錄只保存場景標題、網址與狀態，不保存完整劇本或帳號資料。後續請從官方章節目錄繼續，不依規律猜測場景網址。

第 02 章的「五年前封城」另列近代年代區段，放在現代主線之前；年數相對於該章任務當時，不換算為現實年份。第 02 章官方目錄為 `https://www.blablalink.com/shiftyspad/scene-list/main/list?id=3`。

`data/official-names.json` 保存已核對的官方繁中角色用語與出處。例如 Cinderella 使用「灰姑娘」，不得直接音譯成「仙杜瑞拉」。其他角色、部隊與專有名詞也必須查官方繁中圖鑑或場景，不能自行從英文回譯。不同型態、別名與身份須按場景區分。`npm run check` 會掃描上線正文，拒絕已列入表內的錯譯；尚未收錄的用語仍需人工核對，不代表已完成全角色與全專有名詞審校。

首圖 `assets/surface.svg` 是原創年代意象，不是遊戲截圖；卡片的關係示意也非遊戲畫面。不要改放官方立繪、遊戲截圖、背景圖、音樂或影片。

## 權利與上架界限

本專案是非官方、非營利的粉絲整理，公開時依（株）SHIFTUP《二次創作活動準則》：<https://policy.shiftup.co.kr/ip/zh-tw/index.html>

《勝利女神：妮姬》（GODDESS OF VICTORY: NIKKE）的世界觀、角色、名稱、圖像、音樂、影片及其他遊戲內容，權利歸 SHIFTUP 或相關授權提供方所有。本站與 SHIFTUP 沒有贊助、合作或從屬關係。網站標題、頁尾與權利聲明須維持這項標示。

上架到 GitHub Pages 或把連結分享給玩家時，維持以下界限：

- 免費供同好閱讀。不加廣告、打賞、販售或付費牆，也不把整理用於比賽或未獲許可的公開活動。
- 不以此 IP 製作、發行或營運遊戲。
- 不轉載完整劇本或官方圖像、音樂、影片。直接複製官方圖像（含僅改色、變形）不屬於準則所稱的二次創作。
- 摘要與解讀須和官方原文分開，並連結 BlablaLink 出處。
- 準則可不經預告變更。若權利人要求下架，刪除相關內容。準則疑問寄至 ugc@shiftup.co.kr；該信箱屬於 SHIFTUP，不是本專案信箱。

主題與閱讀位置只存於 localStorage，不需要帳號或後端。字型使用 Google Fonts，無網路時退回系統字型；SVG 與資料均為本機資產。
