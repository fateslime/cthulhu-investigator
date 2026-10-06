# 接手時不可遺失的契約

## 存檔與身分
| 項目 | 目前值 | 所在 |
|---|---|---|
| 原作 state 版本 | 1 | Fog.VERSION / engine.js |
| 長篇 state 版本 | 2 | Chronicles.VERSION |
| 外層檔案室版本 | 2 | HubStore.VERSION |
| 危機附加資料版本 | 1 | pressure-engine.js |
| 瀏覽器原作 key | fogharbor-save-v1 | app.js |
| 外層 key | cthulhu-archives-v2 | portal.js |
| 每個 profile 原作 key | cthulhu-legacy- + profile.id | portal.js iframe bridge |
| 顯示偏好 key | cthulhu-display-v1 | cinematic.js |
| Windows origin | https://app.cthulhu.example | Program.cs |
| Windows 資料夾 | %LOCALAPPDATA%/CthulhuInvestigator/WebView2 | 正常模式；永不隨建置刪除 |

HubStore profile 是 id、name、saves；saves 按故事 ID 分開。
匯入透過 Fog.validateSave / Chronicles.validate / HubStore.validateProfile 驗證。
現有 validate 也可能遷移新增技能、初始化 pressure；不是保證無副作用的唯讀操作。
新增欄位時檢查 newGame、validate、clone、匯出匯入、舊存檔、結局。
不可用「校驗失敗就重置全部進度」代替遷移。

原作 iframe bridge 處理專用 key 並發送 fog-save。外層核對 event.source、profile ID、格式和大小。
顯示設定以 storage event 同步，不能跟遊戲備份共用版本。

## 骰子與狀態
Fog.percentile / Fog.check 承擔 D100；記錄 unit、tens、candidates、value、skill、target、grade、mod、success。
00＋0＝100。獎勵骰取最低完整數字，懲罰骰取最高；共享個位骰。
方法支援注入 RNG，測試可固定種子。不要把正式 RNG 改成測試預設值。

Cinema 觀察 state.rolls 的新增物件，複製結果再呈現；不可為動畫呼叫 check。
讀檔不重播舊骰；顯示開關不改玩家狀態。同一行動可產生多個檢定。
目前動畫是 D100 檢定呈現，不是所有傷害骰的物理模擬。

## 時間、事件與操作
只有有效行動改變 s.time。Pressure wrapper 讀取差值；跨章另重設窗口。
閱讀、視窗停留、顯示設定不耗世界時間。activeMs 只是前景遊玩統計。
pressure.pending 為突發事件；s.pending 為原引擎孤注一擲；兩者不是同一種待辦。
事件亂數 seed / seen / pending 隨存檔保存。讀檔不能重抽事件。
模組載入順序是契約；目前不支援對 script 重複熱載入。

## 共用介面
- app.js 使用 data-act；portal.js 使用 data-action；data-ui、data-pressure 各有既有分派。
- 動態重繪後以 Cinema.mount(app, state) 加上視覺。不要另綁一套會執行兩次的行動 listener。
- FieldUI.panel 為完整危機資訊；brief 為行動視窗可展開摘要。
- 主遊戲左右欄不可引入 overflow:auto + 固定高度造成多個垂直捲動區。
- 彈窗只允許正文捲動，背景鎖住，關閉鈕保持可見。
- 手機／窄視窗仍可從固定行動列取得選項、地圖；原作 iframe 不得出現第二個外層頁面捲軸。
- 改 CSS 前查最後生效的 cinematic.css 規則。顯示設定有大字／高對比／減少動態偏好。

## 對話
Theatre.talk 承擔離線 intent 與遭遇；DialogueAdapter.reply 只接收經整理的 context 並回傳文字。
預設 provider=null，無金鑰與網路依賴。逾時、拒絕、非法字串回退離線。
不將完整未揭露劇本或真實 state 物件交給 provider。model 不能新增證物、改骰或決定資源。
portal.js 的 dialogueTicket 用於阻止過期非同步回覆寫回已離開的畫面。

## 測試範圍
runtime-tests.html 包含規則、存檔、劇本、危機與模擬 DOM，合成 rules 組。
ui / cinematic / resolutions / compact 在真實 WebView2 注入測試。
模擬 DOM 測試刻意不帶 Pressure，有獨立 pressure-tests.js 驗證包裝後行為。
Node runner 不是完整驗證，也沒有所有介面、壓力與實際排版測試。
不要拿歷史 904 或其他固定通過數字代替當次結果解析；維護流程要求每組非空且每項 pass 為布林 true。
