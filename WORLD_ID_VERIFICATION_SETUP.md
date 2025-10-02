# World ID 真人驗證設置指南 🌍🔐

這份指南將幫助你在 World Developer Portal 中設置真人驗證功能。

## 🎯 什麼是 World ID 驗證？

World ID 是 Worldcoin 提供的真人驗證系統，可以確保：
- ✅ 每個用戶都是真實的人類
- ✅ 一人一號，防止機器人和多重帳號
- ✅ 隱私保護，使用零知識證明技術

## 📋 設置步驟

### 步驟 1：在 Developer Portal 創建驗證動作

1. **登入 Developer Portal**
   ```
   https://developer.worldcoin.org/
   ```

2. **選擇你的 Mini App**
   - 找到「極簡停車」
   - 進入 App 設置頁面

3. **創建 Incognito Action（驗證動作）**
   - 進入 **Actions** 或 **Verification** 標籤
   - 點擊 **Create Action** 或 **New Action**

4. **填寫動作資訊**
   ```
   Action ID: verify-parking-game
   Name: 停車遊戲真人驗證
   Description: 驗證玩家是真實用戶，防止機器人作弊
   Action Type: Incognito Action
   ```

5. **設置驗證等級**
   - **Orb Verification**: 通過 Orb 虹膜掃描的用戶（最高安全級別）
   - **Device Verification**: 通過手機驗證的用戶（基本級別）
   
   建議：選擇 **Device** 讓更多用戶可以玩遊戲

6. **保存動作**
   - 點擊 **Create** 或 **Save**
   - 記下你的 **Action ID**（應該是 `verify-parking-game`）

---

## 🔧 驗證等級說明

### 🌐 Orb Verification（Orb 驗證）
- 最高安全級別
- 需要通過 Orb 設備進行虹膜掃描
- 適合：高價值交易、重要投票、防作弊要求極高的場景
- 優點：幾乎不可能偽造
- 缺點：用戶較少

### 📱 Device Verification（裝置驗證）
- 基本安全級別
- 只需要手機號碼驗證
- 適合：一般遊戲、社交應用、大多數 Mini Apps
- 優點：用戶群大，入門門檻低
- 缺點：安全性較低（但仍遠優於無驗證）

### 推薦設置
對於「極簡停車」這樣的休閒遊戲，建議使用 **Device Verification**：
```javascript
verification_level: 'device' // 在代碼中可以調整
```

如果你想要最高安全性，可以改為：
```javascript
verification_level: 'orb'
```

---

## 💻 代碼配置

### 當前設置

在 `minikit-integration.js` 中：

```javascript
// 第 10 行
this.actionId = 'verify-parking-game'; // 你的驗證動作 ID

// 第 99 行
verification_level: 'orb', // 可以改為 'device'
```

### 修改驗證等級

如果你想改用裝置驗證（推薦）：

1. 打開 `minikit-integration.js`
2. 找到第 99 行
3. 將 `'orb'` 改為 `'device'`：
   ```javascript
   verification_level: 'device', // 'orb' 或 'device'
   ```

---

## 🧪 測試驗證功能

### 在本地瀏覽器測試（開發模式）

1. 訪問 `http://localhost:8000`
2. 點擊「🌍 使用 World ID 驗證」
3. 會自動模擬驗證成功
4. 「開始遊戲」按鈕變為可用

**開發模式特點：**
- 自動跳過真實驗證
- 模擬成功回應
- 方便快速測試遊戲邏輯

### 在 World App 中測試（真實驗證）

1. 在 World App 中打開你的 Mini App
2. 點擊「🌍 使用 World ID 驗證」
3. World App 會引導你完成驗證流程：
   - 如果選擇 Orb：需要前往 Orb 設備
   - 如果選擇 Device：只需確認即可（如果已驗證過）
4. 驗證成功後顯示綠色勾選 ✅
5. 可以開始遊戲

---

## 🔐 安全性說明

### Nullifier Hash（唯一標識符）

每次驗證會生成一個 `nullifier_hash`：
- 對於同一個 action 和用戶，這個 hash 是固定的
- 但不會暴露用戶的真實身份
- 可以用來防止同一個用戶重複領取獎勵

### 防重放攻擊

使用 `signal` 參數：
```javascript
signal: this.generateNonce(), // 每次都不同的隨機值
```

### 後端驗證（重要！）

**⚠️ 安全警告：前端驗證可以被繞過！**

在生產環境中，你**必須**在後端驗證 proof：

```javascript
// 在 minikit-integration.js 的 verifyProofWithBackend 函數中
const response = await fetch('YOUR_BACKEND_URL/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        proof: payload.proof,
        merkle_root: payload.merkle_root,
        nullifier_hash: payload.nullifier_hash,
        verification_level: payload.verification_level,
        action: this.actionId,
        signal: payload.signal,
    })
});
```

後端需要調用 World API 驗證 proof：
```
POST https://developer.worldcoin.org/api/v2/verify
```

詳細 API 文檔：https://docs.world.org/mini-apps/reference/api#verify-proof

---

## 📱 用戶體驗流程

### 首次打開遊戲

1. 看到開始畫面
2. 顯示「🌍 使用 World ID 驗證」按鈕
3. 提示：「需要 World ID 驗證才能開始遊戲」
4. 「開始遊戲」按鈕是灰色的（不可點擊）

### 點擊驗證按鈕

1. 按鈕文字變為「驗證中...」
2. World App 顯示驗證流程
3. 用戶確認驗證

### 驗證成功

1. 按鈕消失
2. 顯示綠色的「✅ 真人驗證成功」
3. 顯示驗證等級（🌐 Orb 驗證 或 📱 裝置驗證）
4. 「開始遊戲」按鈕變為可點擊
5. 手機震動反饋

### 驗證失敗

1. 顯示錯誤提示
2. 按鈕恢復為「🌍 使用 World ID 驗證」
3. 可以重新嘗試

---

## 🎮 遊戲中的應用

### 防止作弊

每個驗證的 `nullifier_hash` 是唯一的：
```javascript
// 可以儲存 nullifier_hash 來追蹤用戶
const nullifierHash = payload.nullifier_hash;
// 用於防止同一用戶重複領獎
```

### 排行榜

只顯示已驗證用戶的成績：
```javascript
if (worldMiniKit.isVerified) {
    // 提交分數到排行榜
    submitScore(score, nullifierHash);
}
```

### 獎勵系統

確保每個真實用戶只能領取一次：
```javascript
// 後端檢查
if (hasReceivedReward(nullifierHash)) {
    return { error: '已領取過獎勵' };
}
```

---

## 🔍 除錯提示

### 檢查控制台訊息

在瀏覽器開發者工具中查看：

**成功的驗證：**
```
開始 World ID 驗證...
✅ World ID 驗證成功! {...}
📤 發送 proof 到後端驗證...
✅ 驗證成功! {level: 'device', nullifierHash: '0x...'}
```

**失敗的驗證：**
```
開始 World ID 驗證...
❌ World ID 驗證失敗: 驗證失敗，請重試
```

### 常見問題

**Q: 一直顯示「驗證中...」**
- 檢查網路連接
- 確認 Action ID 正確
- 查看控制台錯誤訊息

**Q: 提示「Action not found」**
- 確認在 Developer Portal 中創建了 action
- 檢查 Action ID 拼寫是否正確

**Q: 在開發模式下如何測試？**
- 代碼會自動模擬驗證成功
- 查看控制台會顯示「開發模式：模擬驗證成功」

---

## 📝 檢查清單

部署前確認：

- [ ] 在 Developer Portal 創建了驗證動作
- [ ] Action ID 與代碼中一致
- [ ] 選擇了合適的驗證等級（orb/device）
- [ ] 在 World App 中測試過真實驗證流程
- [ ] 設置了後端驗證（如果需要防作弊）
- [ ] 測試了驗證失敗的情況
- [ ] UI 提示清晰明確

---

## 🚀 進階功能

### 1. 記住驗證狀態

使用 localStorage 記住用戶已驗證：
```javascript
localStorage.setItem('verified_' + nullifierHash, 'true');
```

### 2. 定期重新驗證

對於敏感操作，可以要求重新驗證：
```javascript
if (Date.now() - lastVerifyTime > 24 * 60 * 60 * 1000) {
    // 超過 24 小時，要求重新驗證
    await verifyWorldID();
}
```

### 3. 不同等級的獎勵

根據驗證等級給予不同獎勵：
```javascript
const reward = verificationLevel === 'orb' ? 1.0 : 0.5;
```

---

## 📚 相關資源

- [World ID 文檔](https://docs.world.org/world-id)
- [Verify API 參考](https://docs.world.org/mini-apps/reference/api#verify-proof)
- [零知識證明說明](https://docs.world.org/world-id/zero-knowledge-proofs)
- [Developer Portal](https://developer.worldcoin.org/)

---

**現在你的遊戲擁有真人驗證功能了！🎉🔐**

