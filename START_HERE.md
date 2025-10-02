# 🚀 在手機上測試遊戲 - 快速指南

## 📱 立即開始！

### 第 1 步：確認本地伺服器運行中 ✅

你的本地伺服器應該已經在運行。檢查一下這個終端是否還在顯示：
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

如果沒有，運行：
```bash
python3 -m http.server 8000
```

---

### 第 2 步：開啟新的終端窗口 🪟

**重要：** 不要關閉正在運行伺服器的終端！

打開**新的終端窗口**：
- macOS: `Cmd + T`（新標籤）或 `Cmd + N`（新窗口）
- 或從 Dock 再次打開終端

---

### 第 3 步：啟動 ngrok 🌐

在**新終端**中，切換到遊戲目錄並運行：

```bash
cd /Users/dab/Downloads/JIJIAN
ngrok http 8000
```

---

### 第 4 步：獲取公開 URL 📍

ngrok 啟動後，你會看到類似這樣的畫面：

```
ngrok

Session Status    online
Region            Asia Pacific (ap)
Forwarding        https://abc123-def456.ngrok-free.app -> http://localhost:8000
                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                  這就是你的公開 URL！
```

**複製** 那個 `https://` 開頭的 URL！

---

### 第 5 步：設置 Developer Portal ⚙️

1. 訪問 https://developer.worldcoin.org/
2. 登入（如果需要）
3. 找到「極簡停車」Mini App
4. 點擊進入設置
5. 找到 **App URL** 欄位
6. 貼上你的 ngrok URL（例如：`https://abc123.ngrok-free.app`）
7. 點擊 **Save** 或 **Update**

---

### 第 6 步：在手機上打開！📱

#### 方法 A：使用深層連結（最簡單）

在手機瀏覽器（Safari/Chrome）輸入：
```
worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6
```

會自動跳轉到 World App！

#### 方法 B：從 World App 中打開

1. 打開 World App
2. 進入 **Mini Apps** 標籤
3. 找到「極簡停車」
4. 點擊打開

---

### 第 7 步：測試驗證！🎮

1. 點擊「🌍 使用 World ID 驗證」
2. World App 會引導你完成驗證
3. 驗證成功後開始遊戲！

---

## 🔍 驗證是否成功

### 在電腦上先測試

在瀏覽器訪問你的 ngrok URL：
```
https://你的-ngrok-url.ngrok-free.app
```

應該能看到遊戲畫面！

### 查看 ngrok 流量

訪問 ngrok 管理介面：
```
http://localhost:4040
```

可以看到所有請求和響應！

---

## ⚠️ 常見問題

### Q: ngrok 顯示錯誤
可能需要先註冊並設置 authtoken：

1. 訪問 https://ngrok.com/
2. 註冊免費帳號
3. 獲取 authtoken：https://dashboard.ngrok.com/get-started/your-authtoken
4. 運行：
   ```bash
   ngrok config add-authtoken 你的_authtoken
   ```

### Q: 手機打不開
1. 確認 ngrok 還在運行（終端沒關閉）
2. 確認在 Developer Portal 設置了正確的 URL
3. 嘗試在電腦瀏覽器先訪問 ngrok URL 測試

### Q: 每次 URL 都不一樣
這是 ngrok 免費版的特性。每次重啟會有新 URL，需要：
1. 獲取新 URL
2. 更新 Developer Portal
3. 重新測試

### Q: 2 小時後斷線
免費版限制。重新運行 `ngrok http 8000` 即可。

---

## 🎯 完整測試清單

- [ ] 本地伺服器運行中（終端 1）
- [ ] ngrok 運行中（終端 2）
- [ ] 獲取 ngrok URL
- [ ] 在電腦瀏覽器測試 URL ✅
- [ ] Developer Portal 已設置 URL
- [ ] 手機能打開 Mini App
- [ ] World ID 驗證成功
- [ ] 遊戲功能正常

---

## 💡 提示

- **保持兩個終端都運行**：一個是本地伺服器，一個是 ngrok
- **URL 會變**：每次重啟 ngrok 都會得到新 URL
- **免費夠用**：ngrok 免費版足夠測試使用
- **看流量**：訪問 `http://localhost:4040` 看所有請求

---

準備好了嗎？開始測試吧！🚀

