# 後端部署指南 - 安全處理 API Key

## 🎯 為什麼需要後端？

### 當前問題
```javascript
// 前端直接調用 World API（不安全）❌
const response = await fetch('https://developer.worldcoin.org/api/v2/verify', {
    headers: { 'Authorization': `Bearer ${apiKey}` }  // API Key 暴露！
});
```

### 正確做法
```
前端 → 你的後端 API → World API
      ↑ API Key 存在這裡（環境變量）
```

---

## 🚀 部署到 Vercel（免費 + 永久在線）

### 步驟 1：安裝 Vercel CLI

```bash
npm install -g vercel
```

### 步驟 2：登錄 Vercel

```bash
vercel login
```

選擇用 GitHub 登錄。

### 步驟 3：部署後端

```bash
cd /Users/dab/Downloads/JIJIAN
vercel
```

按照提示操作：
1. Set up and deploy? **Y**
2. Which scope? 選擇你的帳號
3. Link to existing project? **N**
4. Project name? `jijian-parking-api` (或其他名稱)
5. In which directory is your code located? `./`
6. Want to modify settings? **N**

### 步驟 4：設置環境變量（API Key）

```bash
# 添加 World API Key 到 Vercel
vercel env add WORLD_API_KEY

# 輸入你的 API Key（會被安全存儲）
api_a2V5X2NjYWUwMzBjOTA3OWZhZmFjOTk3YjBjOTQ1MjA4OTEwOnNrX2ZiM2IxMTczYTU1ZGUwNTFhZTY2NjAyMWExYTQ2ZWViMzkzZmIwNTY5ZTg4ZDhmZQ

# 選擇環境：Production, Preview, Development (全選)
```

### 步驟 5：重新部署

```bash
vercel --prod
```

完成後，你會得到一個 URL，例如：
```
https://jijian-parking-api.vercel.app
```

### 步驟 6：測試後端 API

```bash
curl -X POST https://jijian-parking-api.vercel.app/api/verify-world-id \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

如果返回錯誤訊息（而不是 404），說明 API 已經運行！

---

## 🔧 更新前端配置

### 更新 config.local.js

```javascript
window.LOCAL_CONFIG = {
    // 移除 WORLD_API_KEY（不再需要在前端）
    // WORLD_API_KEY: '...',  ❌ 刪除這行
    
    // 添加後端 URL
    BACKEND_URL: 'https://jijian-parking-api.vercel.app'  // ✅ 你的 Vercel URL
};
```

### 更新 minikit-integration.js

前端現在會自動使用後端 URL 來驗證，API Key 完全不會暴露。

---

## 🎉 完整架構

```
┌─────────────────────────────────────────────────────┐
│ GitHub Pages (前端)                                  │
│ https://daaab.github.io/jijian-parking/             │
│ - 遊戲邏輯                                           │
│ - UI/UX                                              │
│ - 沒有 API Key ✅                                    │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ POST /api/verify-world-id
                  │ (不包含 API Key)
                  ▼
┌─────────────────────────────────────────────────────┐
│ Vercel (後端 API)                                    │
│ https://jijian-parking-api.vercel.app               │
│ - 驗證 World ID proof                                │
│ - API Key 在環境變量中 🔐                           │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Authorization: Bearer API_KEY
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ World API                                            │
│ https://developer.worldcoin.org/api/v2/verify       │
└─────────────────────────────────────────────────────┘
```

---

## 🛡️ 安全性

### ✅ 現在的做法（安全）
- API Key 存在 Vercel 環境變量
- 前端不包含任何敏感信息
- 後端驗證所有請求

### ❌ 之前的做法（不安全）
- API Key 在前端 JavaScript
- 任何人都能看到
- 可能被濫用

---

## 💰 費用

**完全免費！**

- ✅ Vercel: 免費額度足夠
- ✅ GitHub Pages: 免費
- ✅ 無需付費訂閱

---

## 🔄 更新流程

### 前端更新
```bash
git add .
git commit -m "更新前端"
git push origin main
# GitHub Pages 自動部署
```

### 後端更新
```bash
git add api/
git commit -m "更新後端"
git push origin main
vercel --prod
# Vercel 自動部署
```

---

## 📝 環境變量管理

### 查看環境變量
```bash
vercel env ls
```

### 更新環境變量
```bash
vercel env rm WORLD_API_KEY
vercel env add WORLD_API_KEY
```

### 在 Vercel 網頁控制台
1. 訪問 https://vercel.com/dashboard
2. 選擇你的項目
3. Settings → Environment Variables
4. 管理環境變量

---

## ⚠️ 注意事項

1. **不要把 API Key 提交到 Git**
   - `config.local.js` 已在 `.gitignore`
   - 只存在 Vercel 環境變量中

2. **CORS 已配置**
   - 允許 GitHub Pages 調用
   - 允許本地開發測試

3. **錯誤處理**
   - 後端會返回清晰的錯誤信息
   - 前端可以正確處理失敗情況

---

## 🧪 測試

### 本地測試（使用 ngrok）
```bash
./start-servers.sh
# 前端會調用 Vercel 後端
```

### 線上測試
```
前端: https://daaab.github.io/jijian-parking/
後端: https://jijian-parking-api.vercel.app
```

---

## 🎯 總結

✅ **前端**: GitHub Pages（免費 + 永久在線）
✅ **後端**: Vercel（免費 + 永久在線）
✅ **API Key**: 安全存儲在 Vercel 環境變量
✅ **電腦關機**: 一切正常運行

**不需要付費 ngrok！完全免費且安全！** 🎉

