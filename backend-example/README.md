# 極簡停車後端 - World ID 驗證

這是一個後端驗證服務範例，用於安全地驗證 World ID proof。

## 🔑 為什麼需要後端驗證？

**前端驗證的問題：**
- 可以被技術高手繞過
- 驗證結果可以被偽造
- 不適合有價值的獎勵或資源

**後端驗證的優點：**
- ✅ 安全：API Key 在後端，前端無法訪問
- ✅ 可信：驗證結果由你的伺服器控制
- ✅ 防作弊：可以記錄和防止重複驗證

## 📦 安裝

```bash
cd backend-example
npm install
```

## ⚙️ 配置

1. 複製環境變量範例：
```bash
cp .env.example .env
```

2. 在 `.env` 中填入你的 API Key：
```
WORLD_API_KEY=你的_API_Key
PORT=3000
```

3. 獲取 API Key：
   - 訪問 https://developer.worldcoin.org/
   - 進入你的 Mini App
   - 生成 API Key

## 🚀 運行

```bash
npm start
```

或開發模式（自動重啟）：
```bash
npm run dev
```

## 📡 API 端點

### 1. 驗證 World ID Proof

**POST** `/api/verify-world-id`

**請求體：**
```json
{
  "proof": "0x...",
  "merkle_root": "0x...",
  "nullifier_hash": "0x...",
  "verification_level": "orb",
  "signal": "random_nonce"
}
```

**響應（成功）：**
```json
{
  "success": true,
  "verification_level": "orb",
  "nullifier_hash": "0x..."
}
```

**響應（失敗）：**
```json
{
  "success": false,
  "error": "驗證失敗原因"
}
```

### 2. 檢查驗證狀態

**GET** `/api/check-verification/:nullifier_hash`

**響應：**
```json
{
  "verified": true,
  "nullifier_hash": "0x..."
}
```

## 🔧 整合到前端

在 `minikit-integration.js` 中取消註釋後端驗證代碼：

```javascript
async verifyProofWithBackend(payload) {
    try {
        const response = await fetch('YOUR_BACKEND_URL/api/verify-world-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                proof: payload.proof,
                merkle_root: payload.merkle_root,
                nullifier_hash: payload.nullifier_hash,
                verification_level: payload.verification_level,
                signal: payload.signal,
            })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('後端驗證失敗:', error);
        return false;
    }
}
```

## 🚀 部署

### 選項 1：Vercel（推薦）
1. 安裝 Vercel CLI: `npm i -g vercel`
2. 部署: `vercel`
3. 設置環境變量: `vercel env add WORLD_API_KEY`

### 選項 2：Railway
1. 訪問 https://railway.app/
2. 連接 GitHub 倉庫
3. 設置環境變量

### 選項 3：自己的伺服器
1. 使用 PM2: `pm2 start verify-proof.js`
2. 設置 Nginx 反向代理
3. 配置 SSL 證書

## 🔒 安全建議

1. **永遠不要**在前端暴露 API Key
2. 使用環境變量存儲機密
3. 在資料庫中記錄驗證結果
4. 實現速率限制防止濫用
5. 使用 HTTPS
6. 驗證請求來源

## 📚 相關文檔

- [World ID Verify API](https://docs.world.org/mini-apps/reference/api#verify-proof)
- [Express.js 文檔](https://expressjs.com/)
- [Node.js 最佳實踐](https://github.com/goldbergyoni/nodebestpractices)

---

**注意：這只是一個範例！生產環境需要添加：**
- 資料庫集成
- 錯誤處理
- 日誌記錄
- 速率限制
- 請求驗證
- CORS 配置

