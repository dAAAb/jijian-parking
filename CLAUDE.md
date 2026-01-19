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
- Vercel 日誌：`https://vercel.com/daaabs-projects/jijian-car-parking/logs`

### ⚠️ Vercel 專案說明
帳號下有兩個專案連到同一個 GitHub repo，**只使用 `jijian-car-parking`**：

| 專案名稱 | URL | 狀態 |
|----------|-----|------|
| `jijian-car-parking` | jijian-car-parking.vercel.app | ✅ 正在使用 |
| `jijian` | jijian-seven.vercel.app | ❌ 舊的/重複，可刪除 |

## 專案架構

### 核心檔案
- `minikit-integration.js` - World ID 驗證整合（MiniKit + IDKit）
- `game.js` - 遊戲邏輯
- `tokenomics-ui.js` - Token 經濟 UI（CPK 獎勵、降速購買）
- `i18n.js` - 多語言支援（英文、繁體中文、日文、韓文）
- `index.html` - 主頁面
- `style.css` - 樣式
- `api/` - 後端 API（Vercel Serverless）

### 驗證流程
1. **World App 內** → 使用 MiniKit (`MiniKit.commandsAsync.verify`)
2. **桌面瀏覽器** → 使用 IDKit 彈窗
3. **手機瀏覽器** → 使用 IDKitSession API + QR Code + polling

### 重要注意事項
- API v2 不傳 signal 參數（使用空字串 hash）
- 後端驗證 URL: `/api/verify-world-id`
- 版本號需同時更新：`minikit-integration.js` 頂部註解 + constructor + `index.html`

## ⚠️ 前後端分離架構（重要！）

### 部署位置

| 用途 | URL | 說明 |
|------|-----|------|
| **Mini App 前端** | `https://daaab.github.io/jijian-parking/` | 靜態檔案（HTML/JS/CSS），在 Developer Portal 設定 |
| **後端 API** | `https://jijian-car-parking.vercel.app` | Vercel Serverless Functions |

### API 呼叫規則（必讀！）

**絕對不能用相對路徑 `/api/...`！** 在 GitHub Pages 上會解析成錯誤的 URL。

✅ **正確做法**：
```javascript
const apiBase = window.tokenomicsUI?.apiBase || window.LOCAL_CONFIG?.BACKEND_URL || '';
const response = await fetch(`${apiBase}/api/revive`, { ... });
```

❌ **錯誤做法**：
```javascript
const response = await fetch('/api/revive', { ... });
// 在 GitHub Pages 上會變成 https://daaab.github.io/api/revive → 404/405 錯誤！
```

### 已確認使用正確 API URL 的檔案

| 檔案 | API 呼叫 | 狀態 |
|------|----------|------|
| `tokenomics-ui.js` | `${this.apiBase}/api/...` | ✅ |
| `minikit-integration.js` | `${this.backendUrl}/api/...` | ✅ |
| `game.js` | `${apiBase}/api/...` | ✅ (v2.1.7 修復) |

### 新增 API 時的檢查清單
1. 前端呼叫必須用 `${apiBase}/api/xxx`
2. 測試時用 Chrome DevTools 檢查 Network 面板確認 URL 正確
3. 相對路徑只能在 Vercel 直接訪問時使用（如 `?test=1` 模式）

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

## 🚀 送審穩定版：v1.7.6

**送審日期**：2026-01-08

### 版本功能
- ✅ Mini App 驗證（MiniKit verify 抽屜）
- ✅ 桌面瀏覽器驗證（IDKit QR Code）
- ✅ 手機瀏覽器驗證（IDKitSession + polling）
- ✅ 預載入 IDKit 加速響應
- ✅ 優雅的進度條載入指示
- ✅ 多語言支援（英文、繁體中文、日文、韓文）
- ✅ 支援頁面（support.html）
- ✅ 根目錄重定向頁面

### 參考版本
- **v1.7.5**：送審前最後穩定版（多語言開發時可參考）

---

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

---

---

## ✅ v2.1.0 Token-nomics 系統

**完成日期**：2026-01-11

### 功能概覽

| 功能 | 規格 |
|------|------|
| CPK 獎勵 | 停車成功 → 分數 × 3 的 $CPK |
| 單次降速 | 1 WLD → -20%（可累加，死亡失效） |
| L1 徽章 | 10 WLD → -20%（3天有效） |
| L2 臨時徽章 | 單局累計 3 WLD → -40%（單局有效） |
| L3 徽章 | 30 WLD → -80%（3天有效） |
| CPK 返還 | 每次 WLD 支付 → 10% 等值 CPK |

### 新增檔案

```
api/
├── lib/tokenomics.js      # 共用函數
├── user-state.js          # 用戶狀態查詢
├── add-reward.js          # 新增 CPK 獎勵
├── claim-rewards.js       # 領取 CPK（鏈上轉帳）
├── purchase-slowdown.js   # 購買降速
└── session-reset.js       # 重置當局狀態

tokenomics-ui.js           # Token 面板 UI
package.json               # 依賴配置
```

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `game.js` | 新增 speedMultiplier、過關回報、死亡重置 |
| `style.css` | 新增 Token 面板樣式 |
| `index.html` | 載入 tokenomics-ui.js、更新版本號 |
| `minikit-integration.js` | 驗證成功後初始化 TokenomicsUI |
| `config.js` | 新增 TREASURY_ADDRESS 配置 |

### 環境變數需求

```
REWARD_WALLET_PRIVATE_KEY=<獎勵錢包私鑰>
GAME_TREASURY_ADDRESS=<收款地址>
KV_URL=<Vercel KV URL>
KV_REST_API_URL=<Vercel KV REST URL>
KV_REST_API_TOKEN=<Token>
```

### 代幣配置

- **$CPK 合約**：`0x006201CEEC3Cf7fEFB24638a229784F1D10ADc92` (World Chain)
- **獎勵錢包**：`0xD32e7a4Ee499D9bbdE0D1A2F33eEd758932bC54c`（發送 CPK 獎勵）
- **收款錢包**：`0x3976493CD69B56EA8DBBDdfEd07276aa5915c466`（接收 WLD 支付）

### 部署檢查清單

- [x] 在 config.js 填入 TREASURY_ADDRESS
- [x] 在 Vercel 啟用 KV 儲存（`jijian-car-parking-kv`，區域：sin1）
- [x] 設定環境變數（REWARD_WALLET_PRIVATE_KEY、GAME_TREASURY_ADDRESS）
- [x] 在 Developer Portal 白名單中添加收款地址
- [x] 新增 vercel.json 修復靜態網站部署
- [x] DEX Swap 功能實作完成
- [x] 方式 B：收款後自動分流（不需預存 WLD）
- [ ] **待完成**：在 Developer Portal 白名單添加 REWARD_WALLET

### DEX Swap 造市功能（v2.2.0）

**流程**（以 L1 徽章 10 WLD 為例）：
1. 玩家付 10 WLD → REWARD_WALLET（收款地址）
2. REWARD_WALLET 把 9 WLD (90%) 轉給 TREASURY
3. REWARD_WALLET 用 1 WLD (10%) → swap → CPK（造市效果）
4. CPK 記錄到玩家 pending，之後可 claim

**技術細節**：
- DEX：PUFSwapVM Router `0xF1A7bD6CDDc9fE3704F5233c84D57a081B11B23b`
- 交易對：WLD/CPK Uniswap V2 Pair `0x3D1Ec7119a5cC8f17B2789A3f00655C91ebcfe5A`
- 授權：Permit2 PermitTransferFrom 簽名
- 參數：registry=1 (V2), swapType=3 (REGISTRY_UNISWAP_BUY)

**相關檔案**：
- `api/lib/dex-swap.js` - DEX swap + 轉帳邏輯
- `api/purchase-slowdown.js` - 購買時觸發完整流程

**錢包設定**：
- 收款地址（config.js TREASURY_ADDRESS）：`0xD32e7a4Ee499D9bbdE0D1A2F33eEd758932bC54c`（REWARD_WALLET）
- 真正金庫（90% WLD）：`0x3976493CD69B56EA8DBBDdfEd07276aa5915c466`
- ⚠️ REWARD_WALLET 需加入 Developer Portal 白名單

---

## 📋 工作日誌

### 2026-01-17：Boost.xyz 推廣設定 + 多語言完善 ✅

**Boost.xyz Lift 推廣活動**：

1. **研究 Boost.xyz 平台**
   - Lift MiniApp 機制：追蹤鏈上行為給予獎勵
   - 兩種獎勵類型：固定金額 / 百分比返現
   - 限制：只能追蹤鏈上活動

2. **設定 CarParKing Action**
   - App name: CarParKing
   - Reward base URL: jijian-car-parking.vercel.app
   - 參考交易: 10 WLD 購買降速徽章
   - 獎勵類型: Variable (20% 購買返現)
   - 狀態: Pending（等待審核 24-48 小時）

3. **存入推廣資金**
   - 存入 50 WLD 到 Boost 平台
   - 地址: `0x3570b0d3fa9f6e755ef8ff0f560e0e70644bba4e`

**多語言完善**：

4. **support.html 國際化** (v2.1.5)
   - 預設語言改為英文
   - 偵測瀏覽器語言自動切換
   - 右上角語言選擇器 (🇺🇸 🇹🇼 🇯🇵 🇰🇷)
   - 儲存語言偏好到 localStorage

5. **課金窗口多語言修復**
   - tokenomics-ui.js: 所有 Toast 訊息改用 `i18n.t()`
   - 添加 `data-i18n` 屬性讓靜態元素隨語言切換更新
   - i18n.js: 新增約 40 個翻譯 key (purchase/claim/time/session)
   - 語言切換時自動更新課金窗口動態內容

**版本**: v2.1.5

---

### 2026-01-12：修復支付驗證 + CPK 獎勵 ✅

**問題與修復**：

#### 1. 🐛 WLD 支付驗證失敗
**現象**：玩家付款成功（鏈上有記錄），但顯示「Payment not confirmed (status: undefined)」

**根本原因**：World App API 回應使用 **camelCase**
```javascript
// API 實際回傳
{ "transactionStatus": "mined" }

// 我們檢查的（錯誤）
data.transaction_status || data.status  // undefined!
```

**修復**（`api/purchase-slowdown.js`）：
```javascript
// 修改後
const txStatus = data.transactionStatus || data.transaction_status || data.status;
```

**額外修復**：API URL 需加 `&type=payment` 參數
```javascript
`https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appId}&type=payment`
```

#### 2. 🐛 過關 CPK 獎勵為 0
**現象**：過關後左上角 CPK 一直顯示 0

**根本原因**：測試模式的 nullifierHash 格式不對
```javascript
// 之前（錯誤）
'test_nullifier_' + Date.now()  // "test_nullifier_1768157..."

// 後端要求格式
/^0x[a-fA-F0-9]{64}$/  // 必須是 0x 開頭 + 64 個 hex 字符
```

**修復**（`minikit-integration.js` 的 `simulateVerification()`）：
```javascript
// 生成符合格式的測試 nullifierHash
const timestamp = Date.now().toString(16).padStart(16, '0');
const testNullifier = '0x' + 'deadbeef'.repeat(6) + timestamp;
// 結果：0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef0000018f4a2b3c4d
```

#### 3. 📝 新增診斷日誌
- `game.js`: 過關時顯示 tokenomicsUI 狀態
- `tokenomics-ui.js`: addReward 呼叫和回應記錄

#### 4. 🐛 支付驗證 Polling 機制
**現象**：支付完成但 API 回傳 `transactionStatus: "pending"`，驗證失敗

**根本原因**：交易剛提交時狀態是 pending，需等待區塊確認變成 mined

**修復**（`api/purchase-slowdown.js`）：
```javascript
// 加入 polling 機制：最多重試 5 次，每次間隔 2 秒
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  const txStatus = data.transactionStatus || data.transaction_status || data.status;

  if (['mined', 'confirmed', 'success'].includes(txStatus)) {
    return { success: true, data };
  }

  if (txStatus === 'pending' && attempt < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    continue;
  }
}
```

#### 5. 🐛 舊用戶 verified 欄位缺失
**現象**：已驗證用戶過關時顯示「User verification incomplete」

**根本原因**：舊版用戶資料沒有 `verified` 欄位（只有新用戶才有）

**修復**（`api/add-reward.js`）：
```javascript
// 如果用戶存在但 verified 欄位缺失（舊版本資料），自動補上
if (userData.verified === undefined) {
  console.log(`Updating legacy user - setting verified=true`);
  userData.verified = true;
  await kv.set(userKey, userData);
}
```

**測試結果**：
- ✅ 課金功能正常（WLD 支付 → 90% TREASURY + 10% swap → CPK 返還）
- ✅ Claim 功能正常（CPK 鏈上轉帳）
- ✅ 過關獎勵正常（分數 → CPK）
- ✅ 支付驗證 polling 正常（等待 pending → mined）
- ✅ 舊用戶相容性正常（自動補 verified 欄位）
- ✅ 測試模式 (`?test=1`) 可正常使用

---

### 2026-01-11：Token-nomics v2.1.0 實作

**已完成**：
1. ✅ 建立 Token-nomics 系統架構（6 個 API + 前端 UI）
2. ✅ 產生新獎勵錢包 `0xD32e7a4Ee499D9bbdE0D1A2F33eEd758932bC54c`
3. ✅ 設定 Vercel 環境變數（私鑰、收款地址）
4. ✅ 建立 Vercel KV 儲存（jijian-car-parking-kv）
5. ✅ 修復部署配置（vercel.json）
6. ✅ Developer Portal 白名單設定
7. ✅ DEX Swap 功能（PUFSwapVM + Permit2）
8. ✅ 方式 B 完整流程測試通過

**私鑰安全確認**：
- ✅ 原始碼中無私鑰
- ✅ Git 歷史中無私鑰
- ✅ 私鑰僅存於 Vercel 環境變數（已加密）

---

## 🔧 測試模式使用方式

在 URL 加上 `?test=1` 參數可啟用測試模式：
```
https://jijian-car-parking.vercel.app/?test=1
```

**測試模式特性**：
- 點擊驗證按鈕會模擬 World ID 驗證成功
- 生成符合格式的測試 nullifierHash (`0xdeadbeef...`)
- 可測試完整的課金和獎勵流程
- 顯示 "Test Mode" 標籤

---

## 📌 待優化項目

1. **CPK 獎勵倍率**：目前是 1:1（分數 = CPK），原設計是 3 倍
   - 檔案：`api/lib/tokenomics.js` 的 `CPK_REWARD_MULTIPLIER`

2. **移除診斷日誌**：上線前可移除 console.log
   - `game.js`: 第 503-512 行
   - `tokenomics-ui.js`: 第 410, 429, 437-440 行
   - `minikit-integration.js`: 驗證來源診斷日誌

3. ~~**test-swap.js**~~：✅ 已移除（2026-01-12）

4. **REWARD_WALLET 白名單**：確認已加入 Developer Portal

---

## 📋 工作日誌

### 2026-01-17：修復復活功能 + 高分顯示 (v2.1.10)

#### 問題 1：CPK 復活 API 呼叫失敗 (405 錯誤)

**根本原因**：前端用相對路徑 `/api/revive`，在 GitHub Pages 上解析成錯誤的 URL
```
錯誤：https://daaab.github.io/api/revive → 405
正確：https://jijian-car-parking.vercel.app/api/revive → 200
```

**修復**（game.js）：
```javascript
// 之前（錯誤）
const response = await fetch('/api/revive', {...});

// 之後（正確）
const apiBase = window.tokenomicsUI?.apiBase || window.LOCAL_CONFIG?.BACKEND_URL || '';
const response = await fetch(`${apiBase}/api/revive`, {...});
```

**修復的 API 呼叫**：
- `handleReviveWithWLD()` 中的 `/api/revive`
- `handleReviveWithCPK()` 中的 `/api/revive`
- `showGameOverScreen()` 中的 `/api/leaderboard`

#### 問題 2：「新紀錄」顯示錯誤（排名第 4 卻顯示新紀錄 0 分）

**根本原因 A**：用 localStorage 存高分，換裝置/清快取後歸零
```javascript
// 之前：用本地 localStorage
const storedHighScore = localStorage.getItem('cpk_highscore') || 0;
const isNewHighScore = currentScore > storedHighScore;

// 之後：從後端取得真實紀錄
const leaderboardData = await fetch(`${apiBase}/api/leaderboard?nullifier_hash=${nullifierHash}`);
const backendHighScore = leaderboardData.my_rank.total_score;
const isNewHighScore = currentScore > backendHighScore && currentScore > 0;
```

**根本原因 B**：CSS 缺少 `.highscore-section.hidden` 規則
```css
/* 之前：沒有這個規則，hidden class 無效 */

/* 之後：新增規則 */
.highscore-section.hidden { display: none; }
.rank-section.hidden { display: none; }
```

#### 問題 3：WLD 復活按鈕

**修復**：
- 在 index.html 加回 WLD 復活按鈕
- 更新 `handleReviveWithWLD()` 使用與 `purchaseSlowdown` 一致的 MiniKit 檢測
- 改用 toast 提示取代 alert

#### CSS hidden 規則檢查清單

當新增需要隱藏的元素時，確保 CSS 有對應規則：
```css
.新元素.hidden { display: none; }
```

已有 hidden 規則的元素：
- `.screen.hidden`
- `#game-ui.hidden`
- `.verification-badge.hidden`
- `.token-panel.hidden`
- `.claiming-overlay.hidden`
- `.rating-overlay.hidden`
- `.perfect-park-label.hidden`
- `.leaderboard-panel.hidden`
- `.highscore-section.hidden` ✅ 新增
- `.rank-section.hidden` ✅ 新增

#### 版本更新

| 版本 | 修復內容 |
|------|----------|
| v2.1.7 | 恢復 WLD 復活選項 |
| v2.1.8 | 修復 API URL（使用 apiBase） |
| v2.1.9 | 修復高分顯示（從後端取得真實紀錄比較） |
| v2.1.10 | 修復 CSS hidden 規則 |
| v2.1.18 | support.html 排版優化 + 分享連結更新 + Game Over 驗證功能 |

---

### 2026-01-19：support.html 優化 + Game Over 驗證功能

#### 1. support.html 排版優化
- 修正「立即遊玩」按鈕置中（加入 `.cta-wrapper` flex 容器）
- 移除「全球排行」特色卡片（避免單獨一排）
- 修復 iOS Safari 橡皮筋滑動露出白色背景（加入 `html { background-color: #0f0f1a; }`）

#### 2. 分享連結更新
- `minikit-integration.js` 的 `shareScore()` 函數
- 分享連結從 `https://jijian-car-parking.vercel.app` 改為 `https://world.org/mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6&path=`
- 僅影響分享到社群的連結，不影響其他功能

#### 3. Game Over 驗證功能（未驗證玩家引導）

**需求**：讓未驗證玩家在 Game Over 時也能看到驗證入口

**修改檔案**：

| 檔案 | 修改內容 |
|------|----------|
| `index.html` | 在 game-over-screen 加入 `#gameover-verify-section` |
| `game.js` | `showGameOverScreen()` 根據 `isVerified` 顯示/隱藏驗證區塊 |
| `minikit-integration.js` | 綁定 `#gameover-verify-btn` 點擊事件 + `onVerificationSuccess()` 隱藏區塊 |
| `style.css` | 加入 `.gameover-verify-section` 和 `.gameover-verify-btn` 樣式 |
| `i18n.js` | 加入 `gameover.verifyHint` 和 `btn.verifyWorldId` 四語翻譯 |

**運作邏輯**：
1. 未驗證玩家 Game Over → 顯示「登入後可以領取 $CPK 獎勵！」+ Verify 按鈕
2. 點擊按鈕 → 觸發 `verifyWorldID()`（與初始頁按鈕相同）
3. 驗證成功 → 隱藏驗證區塊 + 顯示左上角徽章和右上角狀態
4. 已驗證玩家 Game Over → 不顯示驗證區塊

**CSS hidden 規則**（新增）：
- `.gameover-verify-section.hidden`
