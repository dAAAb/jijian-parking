# CLAUDE.md - 極簡停車專案

## 語言設定
所有回應請使用**正體中文**，並採用**台灣用語**。

## 常用指令

### Git 操作
- 用戶說「commit」或「幫我 commit」→ 直接執行 git add + commit，不需再確認
- 用戶說「推」→ 嘗試 git push，如果失敗讓用戶自己推
- Commit 訊息風格：使用 emoji 開頭，例如 `🔧 修復...` `📱 新增...` `🐛 修復 bug...`
- 每次修改後主動更新版本號（minikit-integration.js 和 index.html）

### 部署
- 專案部署在 Vercel
- 推送到 main 分支後自動部署
- 用 Playwright MCP 可以直接查看 Vercel 日誌：`https://vercel.com/daaabs-projects/jijian/logs`

## 專案架構

### 核心檔案
- `minikit-integration.js` - World ID 驗證整合（MiniKit + IDKit）
- `game.js` - 遊戲邏輯
- `index.html` - 主頁面
- `style.css` - 樣式

### 驗證流程
1. **World App 內** → 使用 MiniKit (`MiniKit.commandsAsync.verify`)
2. **桌面瀏覽器** → 使用 IDKit 彈窗
3. **手機瀏覽器** → 使用 IDKitSession API + QR Code + polling

### 重要注意事項
- API v2 不傳 signal 參數（使用空字串 hash）
- 後端驗證 URL: `/api/verify-world-id`
- 版本號需同時更新：`minikit-integration.js` 頂部註解 + constructor + `index.html`

## World ID 驗證 - 平台分流邏輯（重要！）

### 三個平台的檢測與驗證方式

| 平台 | 檢測條件 | 驗證方式 | 按鈕調試顯示 |
|------|----------|----------|--------------|
| Mini App | `MiniKit.isInstalled() === true` | `MiniKit.commandsAsync.verify()` | I:Y |
| 手機瀏覽器 | `isMobile && !isInstalled` | IDKitSession + polling | I:N |
| 桌面瀏覽器 | `!isMobile && !isInstalled` | IDKit QR Code 彈窗 | I:N |

### 關鍵判斷指標
- **`MiniKit.isInstalled()`** - 這是唯一可靠的 Mini App 環境判斷
- **`window.WorldApp`** - 不可靠！在 World App 瀏覽器中也會存在，但不是 Mini App
- **`MiniKit.commandsAsync?.verify`** - 只表示 SDK 加載了，不代表在 Mini App 環境

### MiniKit 加載流程
1. `index.html` 中用 ESM 格式加載：`<script type="module">import { MiniKit } from "...+esm"`
2. 必須調用 `MiniKit.install()`
3. 只有在 Mini App 環境中，`isInstalled()` 才會返回 `true`
4. ESM 是異步加載，`minikit-integration.js` 需要等待（waitForMiniKit 函數）

### 常見問題
1. **verify() 卡住不返回**：檢查 Developer Portal 是否已建立對應的 action
2. **isInstalled() 返回 false**：可能 MiniKit 還沒加載完，或不是真正的 Mini App 環境
3. **桌面/手機瀏覽器壞掉**：確保只有 `isInstalled()===true` 時才用 MiniKit

### 調試技巧
- 在按鈕上顯示 `[I:Y/N V:Y/N W:Y/N]` 方便診斷
  - I = isInstalled()
  - V = verify 方法存在
  - W = window.WorldApp 存在
- Mini App 正確狀態應該是 `I:Y V:Y W:Y`

## 已確認的配置（不要重複問用戶！）

### Developer Portal 設定
- **APP_ID**: `app_8759766ce92173ee6e1ce6568a9bc9e6`
- **Incognito Actions**: 已建立 `verifyparkinggame`
- **後端 URL**: `https://jijian-car-parking.vercel.app`

### 自助確認方式
- 可用 **MCP Playwright** 瀏覽網頁確認資訊
- 可用 **WebFetch** 抓取文檔
- 可查看 Vercel 日誌：`https://vercel.com/daaabs-projects/jijian/logs`
- **不要重複問用戶已經討論過的配置！**

## 目前的挑戰：Mini App 環境 isInstalled() 返回 false

### 測試結果（v1.7.0）
| 平台 | 狀態 | 結果 |
|------|------|------|
| 桌面瀏覽器 | ✅ 正常 | IDKit QR Code 彈窗 |
| 手機瀏覽器 | ✅ 正常 | IDKitSession + polling |
| Mini App | ❌ 異常 | 顯示 `I:N V:Y W:Y` |

### Mini App 問題分析
- 用戶透過 Developer Portal QR Code 掃描開啟（正確方式）
- `window.WorldApp` 存在 (W:Y) - 確實在 World App 中
- `MiniKit.commandsAsync.verify` 存在 (V:Y) - SDK 已加載
- **但 `MiniKit.isInstalled()` 返回 false (I:N)** - 這是問題！

### 可能原因
1. **ESM 加載時機問題**：
   - `<script type="module">` 是 deferred（延遲執行）
   - `minikit-integration.js` 同步執行，可能在 MiniKit ESM 之前
   - 雖然 waitForMiniKit 等待 5 秒，但 install() 可能時機不對

2. **MiniKit.install() 調用問題**：
   - 在 index.html ESM 中調用了 install()
   - 在 waitForMiniKit 中也調用了 install()
   - 可能需要特定條件或參數

### 重要發現（v1.7.2）
- 之前看到的 `MK:Y V:Y WA:Y` 中的 **MK:Y 不是 isInstalled()**
- MK:Y 只是 `typeof MiniKit !== 'undefined'`
- I:Y 才是 `MiniKit.isInstalled()` 返回 true
- **isInstalled() 可能從未在 Mini App 環境返回過 true！**

### isInstalled() 返回 true 的條件
根據 MiniKit 源碼：
1. `MiniKit.isReady` 必須是 `true`
2. `window.MiniKit` 必須存在
3. 需要收到來自 World App 的 **init payload**

### 調試方向
- 按鈕現在顯示 `[R:? I:? V:? W:?]`
  - R = isReady
  - I = isInstalled
  - V = verify 存在
  - W = WorldApp 存在
- Console 會顯示 install() 的返回值
