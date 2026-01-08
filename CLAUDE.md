# CLAUDE.md - 極簡停車專案

## 語言設定
所有回應請使用**正體中文**，並採用**台灣用語**。

## 常用指令

### Git 操作
- 用戶說「commit」或「幫我 commit」→ 直接執行 git add + commit，不需再確認
- Commit 訊息風格：使用 emoji 開頭，例如 `🔧 修復...` `📱 新增...` `🐛 修復 bug...`
- 每次修改後主動更新版本號（minikit-integration.js 和 index.html）

### 部署
- 專案部署在 Vercel
- 推送到 main 分支後自動部署

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
