# 維護指令與交接流程

所有指令從專案根目錄執行；Windows PowerShell 5.1 即可。
可選 Node runner 不是本流程必要條件；不需另裝 npm、框架或雲端服務。

## 少量上下文開始
    powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/context.ps1 -Area overview
    powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/context.ps1 -Area ui -Symbols

context 指令列出目前狀態、領域責任、原始檔大小、測試入口及選配的函式名稱。
預設上限 14,000 字元；-MaxChars 可調整至 1,000–24,000。
不讀取生成 HTML、PNG、vendor、dist 或玩家存檔，也不自動把整份劇本附入輸出。
被截斷會明確標示；這是字元預算，不是假定模型 tokenizer 的精確 token 數。
要找具體實作，再用 rg 在列出的檔案內搜尋。

## 日常檢查
    powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/check.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/tests.ps1

check 驗證：登錄檔存在、入口 JS/CSS 順序、未登錄的根目錄程式檔、文檔長度與本機文件連結、生成檔 Git 排除。
新增／刪除／搬動模組時同時更新 project.json。docs/STATE.md 不超過 3,000 字元。
check 不宣稱理解任意 JavaScript 相依或偵測所有隱性副作用；它核對明確登錄的契約。
tests 驗證維護工具自身：載入順序與錯誤輸入、測試報告缺組／空組／失敗／非法型別、C# 退出判定。

## 完整驗證与打包
    powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/verify.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File maintenance/verify.ps1 -Package

依序跑快檢、工具自測、桌面建置、隱藏 WebView2 測試，再解析五組結果。
每次先使舊結果失效；逾時、程序異常、缺組、空組、非法布林值及任一失敗都停止。
成功寫入 test-output/verification.json：時間、來源指紋、建置產物指紋、各組通過數。
-Package 只在成功後打包。直接呼叫 desktop/package.ps1 也會要求相同指紋的通過紀錄。
變更程式／建置／測試，或修改生成產物後，須重新 verify。只更新導航文件不必重跑遊戲。
指紋證明這次檢查對應哪些本機檔案，不是防竄改簽章或第三方安全認證。

WebView2 用新 GUID 測試 profile，不使用玩家資料。測試報告及 profile 不提交。
若在執行沙箱載入卡住，按目前工具的權限流程重跑正常 Windows 測試；不能用舊結果補稱通過。
若無 Windows/WebView2，仍可跑快檢；應交接「未跑桌面驗證」而不是虛構完成。

## 修改範圍與驗收
| 改動 | 先看 | 需要確認 |
|---|---|---|
| UI／骰子動畫 | ui + CONTRACTS | 原作與長篇、大字、窄窗、視窗關閉／行動、骰子不重擲 |
| 規則／時間 | rules + pressure | 固定 RNG、失敗路線、包裝順序、讀檔一致 |
| 新劇情 | stories + ARCHITECTURE | ID、技能、證物、終局、危機、完整路線 |
| 儲存 | saves + CONTRACTS | 舊進度、拒絕非法資料、版本、匯入不覆蓋其他 profile |
| 桌面／打包 | desktop + build | 來源 origin、DPI、實際自檢、通過後產物指紋 |

## 每次結束與換 AI
覆寫 STATE 的已完成、未完成、下一步、驗證與限制；不要無限追加日誌。
架構邊界變更寫 ARCHITECTURE / CONTRACTS；一次稽核留獨立報告，歷史提交用 git log。
不要把壓縮包、base64 或數百行測試輸出貼進交接檔。給路徑、結論及重現指令即可。
本流程不要求每次修改都全面重構。保留目前可玩的路徑，讓每次變更可單獨驗證。
