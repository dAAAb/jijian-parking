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

## ✅ 已解決：Mini App 驗證（v1.7.3）

### 測試結果（v1.7.3）
| 平台 | 狀態 | 結果 |
|------|------|------|
| 桌面瀏覽器 | ✅ 正常 | IDKit QR Code 彈窗 |
| 手機瀏覽器 | ✅ 正常 | IDKitSession + polling |
| Mini App | ✅ 正常 | MiniKit verify 抽屜滑出 |

### 🔥 關鍵發現與解決方案

**根本原因**：`MiniKit.install()` 必須在 `window.WorldApp` **已經存在**時調用，才會設置 `isReady = true`。

之前的問題：
- Dynamic import 異步加載 MiniKit
- `install()` 在 `window.WorldApp` 注入前就被調用
- 導致 `isReady = false`，`isInstalled() = false`

**解決方案（v1.7.3）**：
```javascript
// 等待 window.WorldApp 出現（最多 3 秒）
let worldAppWaitTime = 0;
const maxWait = 3000;
while (typeof window.WorldApp === 'undefined' && worldAppWaitTime < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
    worldAppWaitTime += 100;
}

// window.WorldApp 存在後再調用 install()
const installResult = MiniKit.install();
```

### MiniKit 初始化的正確順序
1. Dynamic import 加載 MiniKit ESM
2. **等待 `window.WorldApp` 出現**（World App 會注入這個對象）
3. 調用 `MiniKit.install()`
4. `install()` 檢測到 `window.WorldApp` 存在，設置 `isReady = true`
5. `isInstalled()` 返回 `true`（因為 `isReady && window.MiniKit` 都成立）

### isInstalled() 返回 true 的條件
根據 MiniKit 源碼：
1. `MiniKit.isReady` 必須是 `true`
2. `window.MiniKit` 必須存在
3. `install()` 調用時 `window.WorldApp` 必須存在

### 調試指標
- 按鈕顯示 `[R:Y I:Y V:Y W:Y]` = Mini App 環境正確
- 按鈕顯示 `[R:N I:N V:Y W:N]` = 普通瀏覽器環境（正常）
- 按鈕顯示 `[R:N I:N V:Y W:Y]` = World App 但 install() 時機錯誤

---

## 📋 Backlog（待觀察問題）

### 1. 首次掃碼加入 Mini App 時 URL 錯誤
**現象**：
- 用 Developer Portal QR Code 掃碼加入 Mini App 時，自動打開一次
- 這第一次顯示 `https://daaab.github.io/` 而不是設定的 `https://daaab.github.io/jijian-parking/`
- Refresh 也還是錯誤的 URL
- **關掉再打開就正常了**，之後每次都正常

**推測原因**：
- 可能是 World App 的設計行為，首次掃碼時先導航到 domain root
- 不是代碼問題

**解決方向**：
- 未來 hosting 到其他地方（如 Vercel）可能可以解決
- 或在 root 加重定向

---

### 2. Mini App 首次 APPROVE 失敗
**現象**：
- 按鈕顯示 `R:Y I:Y V:Y W:Y`（環境正確）
- 第一次按驗證，抽屜滑出
- 第一次 APPROVE 時顯示 error
- **第二次按就成功了**
- 目前無法復現

**可能原因**：
1. **Vercel cold start**：後端 serverless function 首次調用有冷啟動延遲，可能導致超時
2. **MiniKit 內部狀態**：第一次 verify() 時某些內部狀態可能還沒完全準備好
3. **World App session**：可能需要第一次調用來建立某種 session
4. **Race condition**：某些資源在第一次調用時還沒完全就緒

**觀察方向**：
- 上線後觀察其他用戶是否有相同問題
- 如果頻繁發生，考慮在 verify 前加「預熱」請求
