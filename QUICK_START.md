# 🚀 快速開始 - 電腦關機後也能運行

## 📋 最終架構

```
前端 (GitHub Pages)     →     後端 (Vercel)     →     World API
✅ 永久在線                  ✅ 永久在線              
✅ 免費                      ✅ 免費
                            🔐 API Key 安全存儲
```

---

## ⚡ 5 分鐘部署指南

### 步驟 1：安裝 Vercel CLI

```bash
npm install -g vercel
```

### 步驟 2：登錄 Vercel

```bash
vercel login
```

選擇用 **GitHub** 登錄。

### 步驟 3：部署後端

```bash
cd /Users/dab/Downloads/JIJIAN
vercel
```

回答問題：
- Set up and deploy? → **Y**
- Which scope? → 選擇你的帳號
- Link to existing project? → **N**
- Project name? → **jijian-parking-api**
- In which directory? → **.**
- Want to modify? → **N**

等待部署完成，你會得到一個 URL，例如：
```
https://jijian-parking-api-xxx.vercel.app
```

### 步驟 4：設置 API Key（重要！）

```bash
vercel env add WORLD_API_KEY
```

輸入：
```
api_a2V5X2NjYWUwMzBjOTA3OWZhZmFjOTk3YjBjOTQ1MjA4OTEwOnNrX2ZiM2IxMTczYTU1ZGUwNTFhZTY2NjAyMWExYTQ2ZWViMzkzZmIwNTY5ZTg4ZDhmZQ
```

選擇環境：**全選**（Production, Preview, Development）

### 步驟 5：重新部署

```bash
vercel --prod
```

記下最終的 Production URL！

### 步驟 6：更新前端配置

編輯 `config.local.js`：

```javascript
window.LOCAL_CONFIG = {
    APP_ID: 'app_8759766ce92173ee6e1ce6568a9bc9e6',
    ACTION_ID: 'verifyparkinggame',
    BACKEND_URL: 'https://你的vercel網址.vercel.app',  // ← 填入你的 Vercel URL
    // 不要填寫 WORLD_API_KEY！
};
```

### 步驟 7：推送到 GitHub

```bash
git add config.local.js
git commit -m "配置後端 URL"
git push origin main
```

等待 1-2 分鐘，GitHub Pages 自動部署。

---

## ✅ 完成！

### 測試 URL

**前端**：
```
https://daaab.github.io/jijian-parking/
```

**後端**：
```
https://你的vercel網址.vercel.app
```

**World App**：
```
worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6
```

---

## 🎉 現在可以：

✅ 電腦關機，遊戲仍然運行  
✅ API Key 安全存儲在 Vercel  
✅ 完全免費  
✅ 自動部署  
✅ 全球 CDN 加速  

---

## 🔄 日常開發

### 本地測試
```bash
./start-servers.sh  # 使用 ngrok 快速測試
```

### 部署更新
```bash
git add .
git commit -m "更新功能"
git push origin main

# 前端自動部署到 GitHub Pages
# 後端自動部署到 Vercel
```

---

## 💡 提示

1. **Vercel URL 是固定的**，不會像 ngrok 那樣改變
2. **無需電腦開機**，Vercel 24/7 運行
3. **自動 HTTPS**，安全連接
4. **免費額度充足**，個人項目完全夠用

---

## ❓ 常見問題

**Q: Vercel 部署失敗怎麼辦？**
```bash
# 查看詳細日誌
vercel logs
```

**Q: 如何查看後端是否正常？**
訪問：`https://你的vercel網址.vercel.app/api/verify-world-id`
應該看到錯誤訊息（正常，因為沒有 POST 數據）

**Q: 如何更新 API Key？**
```bash
vercel env rm WORLD_API_KEY
vercel env add WORLD_API_KEY
vercel --prod
```

**Q: 費用多少？**
完全免費！Vercel 免費額度：
- 100GB 帶寬/月
- 100 小時運算時間/月
- 無限部署次數

---

## 🎯 總結

| 需求 | 解決方案 | 狀態 |
|------|---------|------|
| 固定 URL | GitHub Pages + Vercel | ✅ |
| 電腦關機可用 | 雲端部署 | ✅ |
| API Key 安全 | Vercel 環境變量 | ✅ |
| 費用 | 完全免費 | ✅ |

**不需要付費 ngrok！這是最佳方案！** 🚀

