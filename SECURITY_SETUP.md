# 🔒 API Key 安全設置指南

## ✅ 已完成的安全配置

### 1. API Key 已安全存儲

你的 API Key 已經被存儲在 `config.local.js` 文件中，這個文件：
- ✅ 已添加到 `.gitignore`
- ✅ **不會被提交到 GitHub**
- ✅ 只在本地使用

### 2. 文件結構

```
JIJIAN/
├── config.local.js         # 🔒 包含 API Key（不會提交到 Git）
├── config.example.js       # 📄 配置範例（可以提交）
├── .gitignore              # 已更新，忽略機密文件
└── minikit-integration.js  # 已更新，從配置讀取 API Key
```

---

## 🧪 如何在手機上測試

### 方法 1：使用 GitHub Pages（推薦）

**注意：** `config.local.js` 不會被推送到 GitHub，所以 GitHub Pages 上不會有 API Key！

1. **推送安全的代碼到 GitHub**
   ```bash
   git add .gitignore index.html minikit-integration.js config.example.js
   git commit -m "🔒 添加安全的 API Key 配置系統"
   git push origin main
   ```

2. **在 World App 中測試**
   - 在手機瀏覽器訪問：
     ```
     worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6
     ```
   - 會自動在 World App 中打開你的遊戲

**注意：** GitHub Pages 上的版本會使用開發模式（跳過後端驗證），因為沒有 API Key。

---

### 方法 2：使用 ngrok（本地測試，有 API Key）

如果你想在手機上測試帶有 API Key 的版本：

1. **確保本地伺服器運行**
   ```bash
   python3 -m http.server 8000
   ```

2. **啟動 ngrok**
   ```bash
   ngrok http 8000
   ```
   
   會得到一個 URL，例如：`https://abc123.ngrok.io`

3. **在 Developer Portal 設置 App URL**
   - 訪問 https://developer.worldcoin.org/
   - 將 App URL 設置為 ngrok URL

4. **在手機上測試**
   - 訪問：`worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6`

這樣手機會載入你本地的版本（包含 API Key）！

---

## 🔍 驗證 API Key 不會洩漏

### 檢查 1：確認被 Git 忽略

```bash
git check-ignore config.local.js
```

應該輸出：`config.local.js`（表示被忽略）

### 檢查 2：查看 Git 狀態

```bash
git status
```

不應該看到 `config.local.js` 在更改列表中！

### 檢查 3：查看即將提交的內容

```bash
git diff --cached
```

確認不包含 API Key！

---

## ⚠️ 重要安全提醒

### ❌ 絕對不要做：

1. **不要直接把 API Key 寫在代碼裡**
   ```javascript
   // ❌ 錯誤示範
   const apiKey = 'api_xxx...';
   ```

2. **不要提交 config.local.js**
   ```bash
   # ❌ 不要這樣做
   git add config.local.js
   ```

3. **不要在前端暴露 API Key**
   - API Key 應該只在後端使用
   - 目前的設置只是為了**開發測試**

### ✅ 正確做法：

1. **使用 .gitignore**
   ```
   config.local.js
   .env
   .env.local
   ```

2. **使用後端驗證**
   - 部署後端服務
   - API Key 只在後端使用
   - 前端只發送 proof 到後端

---

## 🚀 正式部署建議

### 當前設置（開發/測試）

```
前端（瀏覽器）
    ↓ 獲取 proof
    ↓ 使用 config.local.js 中的 API Key
    ↓ 直接調用 World API
    ✅ 驗證成功
```

⚠️ **問題：** API Key 在前端可見（不安全）

### 推薦設置（生產環境）

```
前端（瀏覽器）
    ↓ 獲取 proof
    ↓ 發送到你的後端
後端（你的伺服器）
    ↓ 使用環境變量中的 API Key
    ↓ 調用 World API
    ↓ 返回驗證結果
前端
    ✅ 顯示結果
```

✅ **優點：** API Key 完全隱藏，安全！

---

## 📝 快速測試步驟

### 本地測試（現在就可以）

1. 刷新瀏覽器：`http://localhost:8000`
2. 按 `Cmd+Shift+R` 強制刷新
3. 打開開發者工具（F12）
4. 查看 Console，應該看到：
   ```
   從本地配置讀取 API Key
   ⚠️ 直接調用 World API（僅用於開發測試）
   ```

### 手機測試

**使用 ngrok：**
1. 運行 `ngrok http 8000`
2. 在 Developer Portal 設置 ngrok URL
3. 在手機訪問：`worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6`

**使用 GitHub Pages：**
1. 推送代碼（不包含 API Key）
2. 等待部署完成
3. 在手機訪問上述連結

---

## 🔐 當前配置摘要

| 項目 | 值 | 狀態 |
|------|-----|------|
| API Key | `config.local.js` | 🔒 本地，不會提交 |
| App ID | `app_8759766ce92173ee6e1ce6568a9bc9e6` | ✅ 可以公開 |
| Action ID | `verifyparkinggame` | ✅ 可以公開 |
| 驗證等級 | `orb` | ✅ 最高安全 |

---

## 📞 需要幫助？

如果遇到問題：
1. 檢查 `.gitignore` 是否包含 `config.local.js`
2. 運行 `git status` 確認沒有機密文件
3. 查看瀏覽器 Console 的錯誤訊息

---

**記住：安全第一！🔒**

