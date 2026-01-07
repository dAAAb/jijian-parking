// 🧪 Staging 測試配置（用於 Worldcoin Simulator 測試）
// 使用方式：將此文件複製為 config.local.js

window.LOCAL_CONFIG = {
    // ⚠️ 請替換為你在 World Developer Portal 創建的 staging app_id
    // staging app_id 格式：app_staging_xxxxxxxxxxxxxxxx
    APP_ID: 'app_staging_your_staging_app_id_here',

    // Action ID（需要在 Developer Portal 中創建）
    ACTION_ID: 'verify-human',

    // 後端 API URL（本地測試可以先設為 null，跳過後端驗證）
    BACKEND_URL: null,

    // 測試模式：設為 false 以使用真正的 IDKit QR Code
    TEST_MODE: false
};

// 使用說明：
// 1. 到 https://developer.worldcoin.org 創建 staging 應用
// 2. 複製 staging app_id 到上面的 APP_ID
// 3. 創建一個 Action（例如 "verify-human"）
// 4. 將此文件複製為 config.local.js
// 5. 啟動本地伺服器：python3 -m http.server 8000
// 6. 打開 http://localhost:8000（不要加 ?test=1）
// 7. 點擊驗證按鈕，會顯示 QR Code
// 8. 用 Worldcoin Simulator (https://simulator.worldcoin.org) 掃描
