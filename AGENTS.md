# 接手入口：調查員檔案室

本檔適用於 fogharbor 專案。先看本檔及 docs/STATE.md，再依任務讀取局部程式；不要把全部劇本、產物與歷史一次塞進上下文。

## 五分鐘接手
1. 執行 git status --short；保留不是自己建立的修改及未追蹤檔案。
2. 讀 docs/STATE.md。它只記「目前狀態、未完事項、最近驗證」，不是追加式日誌。
3. 執行 powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/context.ps1 -Area overview。
4. 按任務選 ui / rules / stories / pressure / saves / dialogue / desktop / build / tests / maintenance。
   同一指令加 -Area ui -Symbols 可列出相關檔案與函式名稱；預設輸出上限 14,000 字元。
5. 先讀 docs/CONTRACTS.md 中相關契約，再用 rg 尋找實際函式。文件是導航，程式與當次測試才是事實。

## 必須維持的邊界
- portal.html + portal.js：五故事檔案室／長篇。index.html + app.js：霧港原作。
- engine.js 為 Fog；chronicles-engine.js 為 Chronicles。Theatre 與 Pressure 會在載入時包裝引擎，順序有意義；以 maintenance/project.json 和入口 HTML 核對。
- 規則及狀態由引擎處理；Cinema 只呈現既有檢定，不重新擲骰、不推進時間。部分查詢目前有延遲初始化副作用，詳見契約。
- 保留單一遊戲頁面捲動。彈窗只讓正文捲動；關閉鈕和底部操作入口可到達。兩個遊戲入口及原作 iframe 都要確認。
- storage key、存檔版本、virtual host 不可悄悄改名。變更資料模型須明確驗證及遷移，不得清空玩家存檔。
- AI 對話預設離線；provider 只能產生文字，不能決定骰子或直接改狀態。

## 不可編輯的產物
legacy-source.js、Cthulhu-Play.html、Fogharbor-Play.html、Fogharbor-Original.html、desktop/dist、desktop/vendor。
改來源後重建。不要讀取測試 profile、使用者備份、套件 DLL、base64 HTML 來理解架構。
不要順手執行 normalize-traditional.ps1；它是歷史批次工具。

## 驗證與交付
- 架構快檢：powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/check.ps1
- 維護工具自測：powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/tests.ps1
- 完整建置／驗證：powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/verify.ps1
- 若要交付壓縮包，加 -Package。打包要求同一份來源及產物的通過紀錄。
- 使用 Windows PowerShell 5.1、.NET Framework 4.7.2+、WebView2；遊戲無 Node 依賴。
- 受限沙箱可能阻擋 WebView2 本機頁面啟動。依當前工具權限流程在正常 Windows 環境重跑，不能把卡住當成通過。
- TEST-REPORT.md 的歷史數字不是目前驗證證據。缺組、空結果、逾時或 pass 不為布林 true 均失敗。
- 如果只改文件，跑架構快檢即可；改動維護指令則加維護工具自測。遊戲、桌面或建置變更跑完整驗證。

## 上下文即將用完／交接
覆寫 docs/STATE.md：目標、已完成、尚未完成、下一個具體指令、涉及檔案、當次驗證、已知限制。
控制在 3,000 字元內，不抄對話，不複製整份測試輸出。長期設計放 ARCHITECTURE / CONTRACTS，歷史看 git log。
只提交本任務涉及的檔案；記錄限制，不能因為測試很多就宣稱所有劇情或實機環境都已驗收。
