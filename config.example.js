// 🔒 配置文件範例
// 複製此文件為 config.local.js 並填入你的實際配置

const CONFIG = {
    // World API Key - 從 Developer Portal 獲取
    WORLD_API_KEY: 'your_api_key_here',
    
    // App 配置
    APP_ID: 'your_app_id_here',
    ACTION_ID: 'your_action_id_here',
    
    // 後端 URL（可選）
    BACKEND_URL: null
};

if (typeof window !== 'undefined') {
    window.LOCAL_CONFIG = CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

