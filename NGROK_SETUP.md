# 🌐 ngrok 設置指南

## 🚀 快速開始

### 方法 1：使用輔助腳本（推薦）

我已經為你創建了一個腳本來自動設置 ngrok：

```bash
./start-ngrok.sh
```

這個腳本會：
- ✅ 檢查 ngrok 是否安裝
- ✅ 啟動 ngrok 隧道
- ✅ 自動顯示公開 URL
- ✅ 提供測試步驟

---

### 方法 2：手動啟動

在新的終端窗口運行：

```bash
ngrok http 8000
```

你會看到類似這樣的輸出：

```
ngrok

Session Status    online
Account           你的帳號
Version           3.x.x
Region            Asia Pacific (ap)
Latency           -
Web Interface     http://127.0.0.1:4040
Forwarding        https://abc123.ngrok.io -> http://localhost:8000

Connections       ttl     opn     rt1     rt5     p50     p90
                  0       0       0.00    0.00    0.00    0.00
```

**你的公開 URL 是：** `https://abc123.ngrok.io`

---

## 📋 完整設置流程

### 1. 確保本地伺服器運行中

在一個終端窗口：
```bash
cd /Users/dab/Downloads/JIJIAN
python3 -m http.server 8000
```

應該看到：
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

### 2. 啟動 ngrok

**在新的終端窗口**運行：
```bash
./start-ngrok.sh
```

或

```bash
ngrok http 8000
```

### 3. 獲取公開 URL

從 ngrok 的輸出中找到 `Forwarding` 那一行的 URL。

例如：
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8000
```

複製這個 URL：`https://abc123.ngrok-free.app`

### 4. 在 Developer Portal 設置

1. 訪問 https://developer.worldcoin.org/
2. 進入你的 Mini App（極簡停車）
3. 找到 **App URL** 設置
4. 填入 ngrok URL
5. 點擊 **Save**

### 5. 在手機上測試

在手機瀏覽器輸入：
```
worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6
```

或在 World App 中：
- 進入 **Mini Apps**
- 找到「極簡停車」
- 點擊打開

---

## 🔧 ngrok 配置（可選）

### 首次使用 ngrok

如果是第一次使用 ngrok，需要：

1. **註冊 ngrok 帳號**
   - 訪問 https://ngrok.com/
   - 免費註冊

2. **獲取 authtoken**
   - 登入後訪問 https://dashboard.ngrok.com/get-started/your-authtoken
   - 複製你的 authtoken

3. **配置 authtoken**
   ```bash
   ngrok config add-authtoken 你的_authtoken
   ```

### 自定義域名（付費功能）

如果你有 ngrok 付費方案，可以使用固定域名：

```bash
ngrok http 8000 --domain=your-custom-domain.ngrok-free.app
```

---

## 🌐 測試 ngrok 連接

### 在瀏覽器測試

訪問 ngrok 給你的 URL：
```
https://abc123.ngrok-free.app
```

你應該能看到「極簡停車」遊戲！

### ngrok 管理介面

訪問本地管理介面：
```
http://localhost:4040
```

可以看到：
- 📊 流量統計
- 🔍 請求/響應詳情
- ⚙️ 隧道狀態

---

## ⚠️ 注意事項

### ngrok 免費版限制

- ✅ 每次啟動 URL 會改變
- ✅ 每個會話最多 2 小時（之後需要重啟）
- ✅ 每分鐘 40 個請求限制
- ✅ 足夠開發測試使用

### 保持 ngrok 運行

- ngrok 必須一直運行才能訪問
- 關閉終端會中斷連接
- 每次重啟會得到新的 URL

### 如果 URL 改變了

每次重啟 ngrok，URL 會改變。需要：
1. 獲取新的 URL
2. 在 Developer Portal 更新 App URL
3. 重新測試

---

## 🐛 常見問題

### Q: ngrok 命令找不到
```bash
brew install ngrok
```

### Q: 連接被拒絕
確保本地伺服器正在運行：
```bash
curl http://localhost:8000
```

### Q: ngrok 要求 authtoken
```bash
ngrok config add-authtoken 你的_token
```
從 https://dashboard.ngrok.com/get-started/your-authtoken 獲取

### Q: 手機無法訪問
1. 檢查 ngrok 是否在運行
2. 確認在 Developer Portal 設置了正確的 URL
3. 嘗試在電腦瀏覽器先測試

### Q: 2 小時後斷開
免費版的限制，重新運行 ngrok 即可。

---

## 📝 測試清單

- [ ] 本地伺服器運行：`http://localhost:8000`
- [ ] ngrok 隧道建立
- [ ] 獲取公開 URL
- [ ] 在電腦瀏覽器測試 URL
- [ ] 在 Developer Portal 設置 URL
- [ ] 在手機 World App 打開遊戲
- [ ] 測試 World ID 驗證
- [ ] 測試遊戲功能

---

## 🔄 每日開發流程

```bash
# 1. 啟動本地伺服器
python3 -m http.server 8000

# 2. 在新終端啟動 ngrok
./start-ngrok.sh

# 3. 複製 URL 到 Developer Portal
# 4. 在手機測試
# 5. 開發完成後 Ctrl+C 停止
```

---

## 🚀 替代方案

如果 ngrok 有問題，可以考慮：

1. **Cloudflare Tunnel**
   - 免費且穩定
   - 固定 URL

2. **localtunnel**
   ```bash
   npx localtunnel --port 8000
   ```

3. **VS Code Port Forwarding**
   - 如果使用 VS Code

---

需要幫助？隨時問我！🌐

