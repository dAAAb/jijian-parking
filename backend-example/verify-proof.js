// 後端驗證範例 - Node.js + Express
// 這是一個示例，展示如何在後端驗證 World ID proof

const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// ⚠️ 從環境變量讀取 API Key，不要硬編碼！
const WORLD_API_KEY = process.env.WORLD_API_KEY;
const APP_ID = 'app_8759766ce92173ee6e1ce6568a9bc9e6';
const ACTION_ID = 'verifyparkinggame';

// 後端驗證端點
app.post('/api/verify-world-id', async (req, res) => {
    try {
        const { proof, merkle_root, nullifier_hash, verification_level, signal } = req.body;

        // 驗證必要參數
        if (!proof || !merkle_root || !nullifier_hash) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數'
            });
        }

        console.log('📤 發送 proof 到 World API 驗證...');

        // 調用 World API 驗證 proof
        const response = await fetch('https://developer.worldcoin.org/api/v2/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WORLD_API_KEY}` // 使用 API Key
            },
            body: JSON.stringify({
                proof,
                merkle_root,
                nullifier_hash,
                verification_level,
                action: ACTION_ID,
                signal
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ World ID 驗證成功!');
            
            // 可以在這裡記錄驗證結果到資料庫
            // await saveVerification({
            //     nullifier_hash,
            //     verification_level,
            //     timestamp: new Date()
            // });

            return res.json({
                success: true,
                verification_level,
                nullifier_hash
            });
        } else {
            console.error('❌ World ID 驗證失敗:', data);
            return res.status(400).json({
                success: false,
                error: data.code || '驗證失敗'
            });
        }

    } catch (error) {
        console.error('後端驗證錯誤:', error);
        return res.status(500).json({
            success: false,
            error: '伺服器錯誤'
        });
    }
});

// 檢查用戶是否已驗證過（防止重複領獎）
app.get('/api/check-verification/:nullifier_hash', async (req, res) => {
    try {
        const { nullifier_hash } = req.params;
        
        // 從資料庫查詢
        // const isVerified = await checkIfVerified(nullifier_hash);
        
        // 示例：假設已驗證
        return res.json({
            verified: true,
            nullifier_hash
        });
    } catch (error) {
        console.error('查詢錯誤:', error);
        return res.status(500).json({ error: '伺服器錯誤' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 後端服務運行在 port ${PORT}`);
    console.log(`📝 驗證端點: POST http://localhost:${PORT}/api/verify-world-id`);
});

module.exports = app;

