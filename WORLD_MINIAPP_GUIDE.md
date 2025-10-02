# World Mini App 整合指南 🌍

這個指南將教你如何測試和部署「極簡停車」World Mini App。

## 📋 前置準備

### 1. 註冊 World Developer Portal
1. 訪問 [World Developer Portal](https://developer.worldcoin.org/)
2. 使用你的 World ID 登入
3. 創建新的 Mini App

### 2. 獲取 App ID 和 API Key
1. 在 Developer Portal 中創建你的 app
2. 獲取 **App ID**（格式：`app_staging_xxxxx` 或 `app_xxxxx`）
3. 獲取 **API Key**（用於後端調用）

### 3. 更新配置文件

#### 更新 `miniapp.json`
```json
{
  "app_id": "你的_App_ID",
  ...
}
```

#### 更新 `minikit-integration.js`
```javascript
this.appId = '你的_App_ID'; // 第 6 行
```

## 🧪 測試方法

### 方法 1：使用 World App Simulator（推薦）

1. **安裝 World App**（iOS 或 Android）
   - [iOS App Store](https://apps.apple.com/app/worldcoin/id1560859847)
   - [Android Play Store](https://play.google.com/store/apps/details?id=com.worldcoin)

2. **啟用開發者模式**
   - 打開 World App
   - 前往 Settings > Developer
   - 啟用 "Developer Mode"

3. **運行本地伺服器**
   ```bash
   cd /Users/dab/Downloads/JIJIAN
   python3 -m http.server 8000
   ```

4. **使用 ngrok 建立公開 URL**
   ```bash
   # 安裝 ngrok
   brew install ngrok
   
   # 創建隧道
   ngrok http 8000
   ```
   
   你會得到一個類似 `https://xxxx.ngrok.io` 的 URL

5. **在 World App 中測試**
   - 在 Developer Portal 設置你的 Mini App URL 為 ngrok URL
   - 在 World App 中打開你的 Mini App

### 方法 2：本地瀏覽器測試（開發模式）

1. **運行本地伺服器**
   ```bash
   cd /Users/dab/Downloads/JIJIAN
   python3 -m http.server 8000
   ```

2. **在瀏覽器中訪問**
   ```
   http://localhost:8000
   ```

3. **降級模式**
   - 遊戲會自動檢測到不在 World App 環境中
   - 啟用「降級模式」，可以正常遊玩但沒有 Web3 功能
   - 錢包連接會模擬成功

### 方法 3：使用 World Simulator

World 提供了官方的 Simulator 工具：

1. 訪問 [World Simulator](https://simulator.worldcoin.org/)
2. 輸入你的 Mini App URL
3. 測試各種 MiniKit 功能

## 🚀 部署到生產環境

### 1. 部署到 GitHub Pages

已經完成！你的遊戲在：
```
https://daaab.github.io/jijian-parking/
```

### 2. 在 Developer Portal 配置

1. 登入 [World Developer Portal](https://developer.worldcoin.org/)
2. 選擇你的 Mini App
3. 在 **Settings** 中設置：
   - **App URL**: `https://daaab.github.io/jijian-parking/`
   - **App Name**: 極簡停車
   - **Description**: 3D Voxel 風格的單手停車遊戲
   - **Icon**: 上傳遊戲圖示

### 3. 提交審核

1. 確保遊戲符合 [App Guidelines](https://docs.world.org/mini-apps/guidelines/app-guidelines)
2. 在 Developer Portal 提交審核
3. 等待審核通過（通常 1-3 天）

## 🎮 World Mini App 功能說明

### ✅ 已整合功能

1. **錢包連接 (Wallet Authentication)**
   - 用戶可以連接他們的 World 錢包
   - 顯示錢包地址
   - 必須連接錢包才能開始遊戲

2. **震動反饋 (Haptic Feedback)**
   - 完成關卡：成功震動
   - 撞車：錯誤震動
   - 連接錢包：中等震動

3. **分享功能 (Share)**
   - 完成關卡後可以分享成績
   - 自動生成邀請連結

4. **降級模式**
   - 在非 World App 環境中仍可正常遊玩
   - 自動檢測環境並啟用對應功能

### 🔜 可擴展功能

以下功能已在代碼中實現框架，需要後端支持：

1. **支付功能 (Pay)**
   ```javascript
   // 示例：購買道具
   await window.worldMiniKit.simulatePayment(0.1, 'WLD');
   ```

2. **通知功能 (Notifications)**
   ```javascript
   // 需要後端 API key
   await window.worldMiniKit.sendNotification('標題', '訊息');
   ```

3. **價格查詢**
   ```javascript
   const wldPrice = await window.worldMiniKit.getWLDPrice();
   ```

## 📱 測試清單

在提交前請確認：

- [ ] 錢包連接功能正常
- [ ] 遊戲在 World App 中可以正常顯示
- [ ] 遊戲在普通瀏覽器中也能運行（降級模式）
- [ ] 震動反饋工作正常
- [ ] 分享功能可用
- [ ] UI 在手機上顯示正確
- [ ] 沒有控制台錯誤
- [ ] 遊戲性能流暢（60 FPS）

## 🐛 常見問題

### Q: MiniKit 未定義錯誤
A: 確保你在 World App 中打開，或檢查降級模式是否正確啟用。

### Q: 錢包連接失敗
A: 檢查 App ID 是否正確，以及是否在 Developer Portal 中正確配置。

### Q: 無法發送通知
A: 通知功能需要後端 API key，需要設置後端服務。

### Q: 支付功能不工作
A: 確保你的錢包地址（treasury address）已正確配置。

## 📚 參考資源

- [World Mini Apps 文檔](https://docs.world.org/mini-apps)
- [MiniKit SDK 參考](https://docs.world.org/mini-apps/reference/api)
- [Developer Portal](https://developer.worldcoin.org/)
- [World App Guidelines](https://docs.world.org/mini-apps/guidelines/app-guidelines)

## 🎯 下一步

1. **獲取真實的 App ID**
   - 在 Developer Portal 創建你的 app

2. **設置後端服務**（可選）
   - 用於通知功能
   - 用於記錄玩家數據

3. **添加更多 Web3 功能**
   - NFT 獎勵
   - 排行榜（鏈上）
   - 代幣經濟

4. **優化遊戲體驗**
   - 更多關卡
   - 新的障礙物類型
   - 多人對戰模式

---

祝你的 Mini App 開發順利！🚗✨

