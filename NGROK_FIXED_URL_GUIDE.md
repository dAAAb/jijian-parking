# ngrok 固定 URL 設置指南

## 🎯 問題說明

ngrok **免費版**每次重啟時，URL 都會改變：
- 第一次：`https://abc123.ngrok-free.app`
- 重啟後：`https://xyz789.ngrok-free.app` ❌

這對測試很不方便，每次都要更新 World Developer Portal 的配置。

---

## ✅ 解決方案

### 方案 1：升級 ngrok 付費版（推薦）

**付費版功能**：
- ✅ 固定域名（例如：`parking.ngrok.app`）
- ✅ 無限連接數
- ✅ 無限請求數
- ✅ 更快的速度
- ✅ 自定義域名

**價格**：
- Personal Plan: $8/月（適合個人開發）
- Pro Plan: $20/月（適合專業開發）

**升級步驟**：
1. 訪問：https://dashboard.ngrok.com/billing/subscription
2. 選擇 Personal 或 Pro 計劃
3. 完成付款
4. 在控制台獲取固定域名

**使用固定域名**：
```bash
# 使用你的固定域名
ngrok http 8000 --domain=your-fixed-domain.ngrok.app
```

---

### 方案 2：部署到永久服務器（最佳）

將遊戲部署到永久的托管服務：

#### GitHub Pages（免費，已配置）
- ✅ 固定 URL：`https://daaab.github.io/jijian-parking/`
- ✅ 永久可用
- ❌ 但無法進行本地開發測試

#### Vercel / Netlify（免費）
- ✅ 固定 URL
- ✅ 自動部署
- ✅ 免費 HTTPS
- ✅ 支持自定義域名

**Vercel 部署步驟**：
1. 訪問：https://vercel.com
2. 連接 GitHub 倉庫：`dAAAb/jijian-parking`
3. 自動部署
4. 獲得固定 URL：`https://jijian-parking.vercel.app`

---

### 方案 3：使用 ngrok 免費版（臨時測試）

**適用場景**：
- 短期測試
- 不介意每次重啟更新 URL

**優點**：
- ✅ 完全免費
- ✅ 本地開發方便

**缺點**：
- ❌ URL 每次都變
- ❌ 每次需要更新 World Developer Portal
- ❌ 有連接限制（40 連接/分鐘）

---

## 🚀 當前設置（免費版持續運行）

### 啟動服務器
```bash
./start-servers.sh
```

### 檢查狀態
```bash
./check-servers.sh
```

### 停止服務器
```bash
./stop-servers.sh
```

### 服務器日誌
- `server.log` - HTTP 服務器日誌
- `ngrok.log` - ngrok 日誌

---

## 💡 建議

### 開發階段
使用 ngrok 免費版即可，雖然 URL 會變，但適合快速測試。

### 測試階段
升級 ngrok 付費版（$8/月），獲得固定 URL，方便團隊測試。

### 生產階段
部署到 **GitHub Pages** 或 **Vercel**，獲得永久固定 URL。

---

## 📋 URL 對比

| 方案 | URL 示例 | 固定？ | 費用 |
|------|---------|--------|------|
| ngrok 免費 | `https://abc123.ngrok-free.app` | ❌ | 免費 |
| ngrok 付費 | `https://parking.ngrok.app` | ✅ | $8/月 |
| GitHub Pages | `https://daaab.github.io/jijian-parking/` | ✅ | 免費 |
| Vercel | `https://jijian-parking.vercel.app` | ✅ | 免費 |

---

## 🔧 如果選擇 ngrok 付費版

1. **登錄 ngrok**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

2. **設置固定域名**
   編輯 `start-servers.sh`，修改：
   ```bash
   # 原本：
   nohup ngrok http 8000 --log=stdout > ngrok.log 2>&1 &
   
   # 改為：
   nohup ngrok http 8000 --domain=YOUR-DOMAIN.ngrok.app --log=stdout > ngrok.log 2>&1 &
   ```

3. **重啟服務器**
   ```bash
   ./stop-servers.sh
   ./start-servers.sh
   ```

現在你的 URL 就固定了！🎉

---

## ❓ 常見問題

**Q: 免費版可以持續運行嗎？**
A: 可以！服務器會一直運行，但 URL 在重啟後會變。

**Q: 電腦關機後還能訪問嗎？**
A: 不能。ngrok 需要你的電腦開機並運行。

**Q: 如何讓服務開機自動啟動？**
A: 可以使用 macOS 的 `launchd` 創建自動啟動服務（較複雜）。

**Q: 推薦哪個方案？**
A: 開發測試用免費版，正式發布用 GitHub Pages 或 Vercel。

