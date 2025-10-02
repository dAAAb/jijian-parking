#!/bin/bash

# 啟動 ngrok 並獲取公開 URL
# 用法: ./start-ngrok.sh

echo "🚀 啟動 ngrok..."
echo ""

# 檢查 ngrok 是否已安裝
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安裝"
    echo "請運行: brew install ngrok"
    exit 1
fi

# 檢查本地伺服器是否運行
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "⚠️  警告：本地伺服器似乎沒有運行"
    echo "請在另一個終端運行: python3 -m http.server 8000"
    echo ""
fi

echo "📡 啟動 ngrok 隧道..."
echo ""
echo "正在連接..."
echo ""

# 啟動 ngrok
ngrok http 8000 --log=stdout 2>&1 | while IFS= read -r line; do
    echo "$line"
    
    # 提取公開 URL
    if echo "$line" | grep -q "url=https://"; then
        URL=$(echo "$line" | grep -o 'url=https://[^[:space:]]*' | cut -d'=' -f2)
        
        echo ""
        echo "============================================"
        echo "✅ ngrok 隧道已建立！"
        echo ""
        echo "📍 你的公開 URL："
        echo "   $URL"
        echo ""
        echo "============================================"
        echo ""
        echo "📱 在 World App 中測試："
        echo "   1. 訪問 https://developer.worldcoin.org/"
        echo "   2. 設置 App URL 為上面的 URL"
        echo "   3. 在手機訪問: worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6"
        echo ""
        echo "💻 或在瀏覽器測試："
        echo "   $URL"
        echo ""
        echo "按 Ctrl+C 停止 ngrok"
        echo "============================================"
        echo ""
    fi
done

