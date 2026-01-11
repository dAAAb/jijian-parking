// 🌐 公開配置文件（用於 GitHub Pages 部署）
// ⚠️ 不要在此文件中包含 API Key 等敏感信息

window.LOCAL_CONFIG = {
    // World App 配置
    APP_ID: 'app_8759766ce92173ee6e1ce6568a9bc9e6',
    ACTION_ID: 'verifyparkinggame',

    // 後端 API URL（Vercel）
    BACKEND_URL: 'https://jijian-car-parking.vercel.app',

    // Token-nomics 配置
    // 收款地址（接收 WLD 支付）- 需要在 Developer Portal 白名單中
    TREASURY_ADDRESS: '0x3976493CD69B56EA8DBBDdfEd07276aa5915c466',

    // ⚠️ 不要在此文件中包含 WORLD_API_KEY！
    // API Key 應該只存在於：
    // 1. 本地的 config.local.js（開發測試）
    // 2. Vercel 環境變量（生產環境）
};

