# 架構地圖

範圍：五故事離線 HTML 與 Windows WebView2。不是伺服器遊戲；登入是本機檔案選擇。
精確入口順序和領域檔案清單在 maintenance/project.json。context.ps1 按領域輸出短索引。

## 執行路徑

    Windows Program.cs → 固定 virtual host → portal.html
    瀏覽器單檔 Cthulhu-Play.html → 內嵌同一份 portal 來源
    portal.js → HubStore → 選故事
      長篇：Chronicles + Theatre（劇院）+ Pressure
      原作：srcdoc iframe → index.html/app.js → Fog + Pressure
    引擎結果 → controller 保存／render → FieldUI + Cinema 呈現

原作 engine.js 同時包含共享 CoC 核心、建角，以及霧港故事資料／狀態機。
長篇不是另一套骰子規則：chronicles-engine.js 使用 Fog 的能力、檢定與戰鬥工具。
兩個 controller 有獨立事件綁定，不可只改 portal.js 就宣稱原作同步。

## 責任表

| 領域 | 入口與責任 | 重要相依 |
|---|---|---|
| 核心規則 | engine.js / Fog：百分骰、等級、SAN、傷勢、角色、原作操作與驗證 | 無 DOM；可注入 RNG |
| 長篇引擎 | chronicles-engine.js / Chronicles：三章、地點、證物、推論、戰鬥、終局、驗證 | Fog、ChroniclesData |
| 劇本資料 | chronicles-data.js 工廠；四個 story-*.js；chronicles-branches.js 支線 | 工廠先載入、支線後掛上 |
| 結局解密 | story-recaps.js / StoryRecaps | 按各故事與結局呈現 |
| 劇院擴充 | theatre-engine.js / Theatre：機關、對話、特殊遭遇，擴充 Chronicles 驗證 | 完整 Chronicles，Pressure 前 |
| 危機層 | pressure-data.js + pressure-engine.js / Pressure | 載入時包裝三個引擎操作 |
| 檔案室儲存 | hub-store.js / HubStore：profile 與故事歸屬驗證 | 兩種引擎驗證器 |
| UI controller | portal.js、app.js：事件、dialog、持有 state、保存、render | 在全部需要的模組後載入 |
| 共用視覺 | FieldUI：圖／危機／行動；Cinema：HUD、面板、骰子結果、顯示偏好 | 不承擔遊戲行動或 RNG |
| Windows | desktop/Program.cs、App.config、app.manifest | WebView2、DPI、視窗、匯出對話框 |
| 維護 | maintenance/*、AGENTS.md、docs/* | PowerShell 5.1，無額外 npm 工具鏈 |

## 為何順序不可任意換
Theatre 擴充 Chronicles，Pressure 保存當時的方法後包裝 act / travel / combat 等方法。
Pressure 必須看到完整的 Theatre，才能攔截劇院行動。重載包裝檔可能重複計時。
HubStore 使用最終驗證器。controller 必須最後初始化。
CSS 順序：style → field-ui → portal（外層）→ cinematic；最後一層覆寫是現有設計，不能只看 style.css 判斷生效樣式。

## 一次行動的資料流
1. controller 從按鈕讀取既定 action ID。
2. 原引擎檢查條件、執行檢定、修改狀態並記錄。
3. Pressure wrapper 比較行動前後時間與章節，結算階段／隨機事件。
4. controller 保存及重繪，Cinema 比較實際 roll 紀錄、呈現動畫。
5. 略過動畫、讀筆記、開地圖不構成遊戲行動。

不要在 UI 添加第二次時間推進或為動畫另擲一次骰。注意查詢輔助函式目前可能初始化記憶／危機欄位，並非全數純函式。

## 建置路徑
build.ps1 → build-portal.ps1：
先將 index.html 的 JS/CSS/霧港圖片內嵌成 Fogharbor-Original.html，
再編碼為 legacy-source.js；最後內嵌 portal 的腳本、樣式及五張 PNG，
輸出兩份相同內容的五故事 HTML。

desktop/build-desktop.ps1 先建 HTML，再用系統 csc 編譯 Windows x64 殼，複製來源與素材到 content。
正常 app 導航固定來源 https://app.cthulhu.example/portal.html。
不要改這個來源，否則 WebView2 會使用不同儲存空間。

## 新增故事的最小修改面
- 一個 story-*.js：資料工廠輸入、場景 ID、NPC、技能、推論、終局。
- portal.html 與 maintenance/project.json：宣告相同順序；測試入口同步載入。
- 圖片、FieldUI 名称、build-portal 圖片 key、劇本库入口及故事年表。
- story-recaps 結局解密；Pressure 主題／事件；hub-store 所用故事清單。
- 若新增場景／欄位超過 validate 的上限，要設計遷移與對應測試。
不是把一個 story 檔丟進資料夾就會自動加入遊戲。

## 延後的重構
先補契約與驗證，再逐步拆分 controller、整理 CSS 與把純規則從原作資料拆開。
不在例行 UI 修正時同時改模組系統、儲存格式與框架。詳見本次稽核報告。
