# 目前交接狀態
更新：2026-10-06

## 目前任務
建立架構維護與有限上下文交接系統。狀態：實作、完整驗證與打包完成，沒有尚未完成的功能修改。

## 可用版本
五故事、CoC 核心、62 個危機事件、离線對話、可關閉百分骰動畫。
2026-10-05 已將遊戲改為單一頁面捲動，行動視窗使用可展開期限摘要。
本次於 2026-10-06 重新驗證：遊戲 904 / 904、維護工具 30 / 30 通過。
最新提交識別請執行 git log -1，避免在本檔寫入會自我變更的提交雜湊。

## 本次涉及
AGENTS.md、docs/*、maintenance/*；建置前快檢、桌面自檢退出碼、打包驗證。
架構快檢涵蓋 60 個登錄檔、2 個入口。已實際確認修改來源後，舊驗證指紋會讓打包退出 1。
完整 maintenance/verify.ps1 -Package 已重跑成功，Windows／瀏覽器 ZIP 已更新。
機讀驗證紀錄：test-output/verification.json（本機生成，不提交）。

## 下一步
依下一次使用者需求選領域：maintenance/context.ps1 -Area ui -Symbols。
先看稽核報告中的保留技術債，僅重構該任務需要的部分，不預設要全面換框架。
修改程式後執行 maintenance/verify.ps1 -Package；只改交接文件時執行 maintenance/check.ps1。
不要讀取或提交 desktop/dist 中的測試 profile。

## 保留的使用者檔案
開始本次任務時 start.bat、start-browser.bat 為未追蹤檔案，不屬於本次改動。

## 已知限制
仍採全域 IIFE 與雙 controller，沒有遷移框架；有些 JS/CSS 一行很長。
AI provider 尚未啟用。4K 是模擬視口排版驗證；劇本時長未真人計時。
正常存檔在 %LOCALAPPDATA%/CthulhuInvestigator/WebView2，不在 Git。
