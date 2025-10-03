// Vercel Serverless Function - World ID 驗證
// 此文件會自動部署到 Vercel，處理 World ID 驗證請求

export default async function handler(req, res) {
    // 設置 CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只接受 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { proof, merkle_root, nullifier_hash, verification_level, action, signal } = req.body;

        // 驗證必要參數
        if (!proof || !merkle_root || !nullifier_hash || !action) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        // 從環境變量獲取 API Key（安全）
        const apiKey = process.env.WORLD_API_KEY;
        
        if (!apiKey) {
            console.error('WORLD_API_KEY not configured');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }

        // 調用 World API 驗證 proof
        console.log('Verifying World ID proof...');
        const worldResponse = await fetch('https://developer.worldcoin.org/api/v2/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                proof,
                merkle_root,
                nullifier_hash,
                verification_level,
                action,
                signal
            })
        });

        const result = await worldResponse.json();
        
        console.log('World API response:', result);

        if (result.success) {
            return res.status(200).json({
                success: true,
                verification_level: result.verification_level,
                nullifier_hash: result.nullifier_hash
            });
        } else {
            return res.status(400).json({
                success: false,
                error: result.error || 'Verification failed'
            });
        }

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

