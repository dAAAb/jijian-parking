# World Developer Portal 完整設置指南 🌍

這是一份完整的步驟指南，幫助你從零開始設置 World Mini App。

## 📱 步驟 1：下載並設置 World App

### 1.1 下載 World App

**iOS:**
- 訪問 [App Store](https://apps.apple.com/app/worldcoin/id1560859847)
- 搜索 "World App"
- 下載並安裝

**Android:**
- 訪問 [Google Play](https://play.google.com/store/apps/details?id=com.worldcoin)
- 搜索 "World App"
- 下載並安裝

### 1.2 創建 World ID（如果還沒有）

1. 打開 World App
2. 選擇 **Create Account**
3. 按照提示完成設置：
   - 設置密碼
   - 備份恢復短語（非常重要！）
   - 選擇用戶名

**注意：** 你可以選擇：
- **完整驗證**：通過 Orb 進行虹膜掃描（獲得完整功能）
- **手機驗證**：僅使用手機驗證（功能有限但足夠開發使用）

對於開發者來說，手機驗證就足夠了！

---

## 🌐 步驟 2：訪問 Developer Portal

### 2.1 登入 Developer Portal

1. 在電腦瀏覽器中訪問：
   ```
   https://developer.worldcoin.org/
   ```

2. 點擊右上角的 **Sign In**

3. 會顯示一個 QR code

### 2.2 使用 World App 掃描登入

1. 打開手機上的 World App
2. 點擊右上角的掃描圖示 📷
3. 掃描電腦上的 QR code
4. 在手機上確認登入
5. 電腦會自動登入 Developer Portal

✅ 成功！你現在已經登入了！

---

## 🎮 步驟 3：創建你的 Mini App

### 3.1 創建新的 App

1. 在 Developer Portal 首頁，點擊 **Create App** 或 **New Project**

2. 選擇 **Mini App**

3. 填寫基本資訊：
   ```
   App Name: 極簡停車
   Display Name: Minimal Parking
   Description: 3D Voxel 風格的單手停車遊戲
   Category: Games
   ```

4. 點擊 **Create**

### 3.2 配置 App 設置

創建完成後，你會看到你的 App 詳情頁面。

#### 📝 基本資訊

- **App ID**: `app_staging_xxxxxxxxxx`
  - 這是你的開發環境 App ID
  - 複製並保存它！

- **API Key**: 點擊 **Generate API Key**
  - 用於後端調用
  - 保密！不要提交到 Git

#### 🌐 設置 App URL

1. 在 **Settings** 或 **Configuration** 標籤
2. 找到 **App URL** 欄位
3. 填入你的網址：

   **開發環境（使用 ngrok）:**
   ```
   https://your-ngrok-url.ngrok.io
   ```

   **正式環境（GitHub Pages）:**
   ```
   https://daaab.github.io/jijian-parking/
   ```

#### 🖼️ 上傳 App 圖示

1. 準備一個 512x512 像素的 PNG 圖示
2. 在 **Assets** 或 **Branding** 部分上傳
3. 建議圖示：
   - 🚗 停車相關的圖示
   - 簡潔清晰
   - 背景透明或純色

#### ⚙️ 配置權限

在 **Permissions** 部分，啟用：
- ✅ Wallet Authentication
- ✅ Payments (如果需要支付功能)
- ✅ Notifications (如果需要通知功能)

---

## 🔧 步驟 4：更新你的代碼

### 4.1 更新 miniapp.json

在 `/Users/dab/Downloads/JIJIAN/miniapp.json` 中：

```json
{
  "name": "極簡停車",
  "short_name": "Minimal Parking",
  "description": "3D Voxel 風格的單手停車遊戲",
  "version": "1.0.0",
  "app_id": "你的_App_ID_在這裡",  // ← 更新這裡
  "icon": "https://daaab.github.io/jijian-parking/icon.png",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#764ba2",
  "permissions": [
    "wallet",
    "payment",
    "notifications"
  ]
}
```

### 4.2 更新 minikit-integration.js

在 `/Users/dab/Downloads/JIJIAN/minikit-integration.js` 的第 6 行：

```javascript
this.appId = '你的_App_ID_在這裡';  // ← 更新這裡
```

### 4.3 提交更新

```bash
cd /Users/dab/Downloads/JIJIAN
git add miniapp.json minikit-integration.js
git commit -m "🔧 更新 World App ID"
git push origin main
```

---

## 🧪 步驟 5：本地測試（使用 ngrok）

### 5.1 安裝 ngrok

**使用 Homebrew:**
```bash
brew install ngrok
```

**或下載安裝包:**
- 訪問 https://ngrok.com/download
- 下載並安裝

### 5.2 註冊 ngrok 帳號（免費）

1. 訪問 https://ngrok.com/
2. 註冊免費帳號
3. 獲取你的 authtoken
4. 在終端執行：
   ```bash
   ngrok config add-authtoken 你的_authtoken
   ```

### 5.3 啟動本地伺服器和 ngrok

**終端 1 - 運行遊戲伺服器:**
```bash
cd /Users/dab/Downloads/JIJIAN
python3 -m http.server 8000
```

**終端 2 - 啟動 ngrok:**
```bash
ngrok http 8000
```

### 5.4 獲取公開 URL

ngrok 會顯示類似這樣的信息：
```
Forwarding  https://a1b2-c3d4.ngrok.io -> http://localhost:8000
```

複製這個 `https://a1b2-c3d4.ngrok.io` URL！

### 5.5 更新 Developer Portal

1. 回到 World Developer Portal
2. 在你的 App 設置中
3. 將 **App URL** 更新為 ngrok URL
4. 保存

---

## 📱 步驟 6：在 World App 中測試

### 6.1 啟用開發者模式

1. 打開 World App
2. 前往 **Settings** ⚙️
3. 找到 **Developer** 或 **Advanced**
4. 啟用 **Developer Mode**

### 6.2 訪問你的 Mini App

**方法 1：從 App 列表**
1. 在 World App 中前往 **Mini Apps** 標籤
2. 你的 App 應該會出現在列表中
3. 點擊打開

**方法 2：使用深層連結**
1. 在手機瀏覽器中訪問：
   ```
   worldapp://mini-app?app_id=你的_App_ID
   ```
2. 會自動打開 World App 並載入你的 Mini App

**方法 3：掃描 QR Code**
1. 在 Developer Portal 可以生成 QR code
2. 用 World App 掃描即可打開

### 6.3 測試功能清單

測試以下功能：
- ✅ 錢包連接功能
- ✅ 遊戲可以正常運行
- ✅ 震動反饋有效
- ✅ 分享功能可用
- ✅ UI 在手機上正確顯示
- ✅ 沒有控制台錯誤

---

## 🚀 步驟 7：部署到 GitHub Pages（正式環境）

### 7.1 確保代碼已推送

```bash
git status  # 確認所有更改已提交
git push origin main
```

### 7.2 啟用 GitHub Pages

1. 訪問 https://github.com/dAAAb/jijian-parking/settings/pages
2. 在 **Source** 部分：
   - Branch: `main`
   - Folder: `/ (root)`
3. 點擊 **Save**
4. 等待 1-2 分鐘

### 7.3 驗證部署

訪問：
```
https://daaab.github.io/jijian-parking/
```

確認遊戲可以正常載入！

### 7.4 更新 Developer Portal 為正式 URL

1. 在 Developer Portal 中
2. 將 **App URL** 更新為：
   ```
   https://daaab.github.io/jijian-parking/
   ```
3. 保存

---

## 🎯 步驟 8：提交審核（可選）

### 8.1 完成所有必要配置

確認以下項目：
- ✅ App 名稱和描述清晰
- ✅ 圖示已上傳
- ✅ App URL 正確
- ✅ 在 World App 中測試通過
- ✅ 沒有明顯的 bug

### 8.2 閱讀審核指南

訪問並閱讀：
- [App Guidelines](https://docs.world.org/mini-apps/guidelines/app-guidelines)
- [App Review Guidelines](https://docs.world.org/mini-apps/guidelines/app-review-guidelines)

### 8.3 提交審核

1. 在 Developer Portal 中
2. 找到 **Submit for Review** 按鈕
3. 填寫提交表單
4. 提交
5. 等待審核（通常 1-3 個工作日）

### 8.4 審核通過後

- ✅ 你的 App 會出現在 World App 的 Mini Apps 商店
- ✅ 所有 World App 用戶都可以發現並使用
- ✅ 你可以獲得正式的 App ID（`app_xxxxx`，不是 staging）

---

## 🐛 常見問題解決

### Q1: 登入 Developer Portal 失敗
**解決方法:**
- 確保你的 World App 已完全設置完成
- 確保手機和電腦網路穩定
- 嘗試重新掃描 QR code
- 重啟 World App

### Q2: 找不到我的 Mini App
**解決方法:**
- 確認開發者模式已啟用
- 確認 App URL 配置正確
- 檢查 ngrok 是否還在運行
- 查看瀏覽器控制台是否有錯誤

### Q3: MiniKit 未定義錯誤
**解決方法:**
- 確認 SDK script 已正確載入
- 檢查 `index.html` 中的 MiniKit CDN 連結
- 清除瀏覽器快取重試

### Q4: ngrok 連接斷開
**解決方法:**
- ngrok 免費版會在 2 小時後斷開
- 重新運行 `ngrok http 8000`
- 更新 Developer Portal 中的新 URL

### Q5: 在手機上無法連接錢包
**解決方法:**
- 確認 App ID 正確
- 確認你在 World App 內打開（不是普通瀏覽器）
- 檢查控制台錯誤訊息

---

## 📚 有用的資源

- **Developer Portal**: https://developer.worldcoin.org/
- **文檔**: https://docs.world.org/mini-apps
- **API 參考**: https://docs.world.org/mini-apps/reference/api
- **社群 Discord**: https://discord.gg/worldcoin
- **GitHub 範例**: https://github.com/worldcoin/minikit-example

---

## ✅ 檢查清單

完成設置前，確認以下項目：

- [ ] World App 已下載並設置
- [ ] World ID 已創建
- [ ] 已登入 Developer Portal
- [ ] Mini App 已創建
- [ ] App ID 已複製並更新到代碼
- [ ] ngrok 已安裝並配置
- [ ] 本地伺服器運行正常
- [ ] 在 World App 中成功測試
- [ ] GitHub Pages 部署成功
- [ ] Developer Portal 已更新為正式 URL

---

## 🎉 下一步

完成所有設置後，你可以：

1. **優化遊戲體驗**
   - 添加更多關卡
   - 改進視覺效果
   - 優化性能

2. **整合更多 World 功能**
   - 實際的 WLD 支付
   - 推送通知
   - 排行榜

3. **推廣你的 Mini App**
   - 分享到社交媒體
   - 邀請朋友測試
   - 收集用戶反饋

祝你開發順利！🚗✨


