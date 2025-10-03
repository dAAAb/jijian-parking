#!/bin/bash

# 極簡停車 - 檢查服務器狀態腳本

echo "🔍 檢查服務器狀態..."
echo ""

# 檢查 Python 服務器
if pgrep -f "python3 -m http.server 8000" > /dev/null; then
    echo "✅ HTTP 服務器: 運行中"
    echo "   📱 本地訪問: http://localhost:8000"
else
    echo "❌ HTTP 服務器: 未運行"
fi

echo ""

# 檢查 ngrok
if pgrep -f "ngrok http 8000" > /dev/null; then
    echo "✅ ngrok: 運行中"
    
    # 獲取 ngrok URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else '')" 2>/dev/null)
    
    if [ -n "$NGROK_URL" ]; then
        echo "   🌐 公共 URL: $NGROK_URL"
        echo "   📊 控制台: http://localhost:4040"
    fi
else
    echo "❌ ngrok: 未運行"
fi

echo ""

