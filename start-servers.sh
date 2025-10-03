#!/bin/bash

# 極簡停車 - 服務器啟動腳本
# 此腳本會啟動本地服務器和 ngrok，並保持持續運行

echo "🚀 啟動極簡停車服務器..."
echo ""

# 1. 檢查並清理舊進程
echo "📋 清理舊進程..."
pkill -f "python3 -m http.server 8000" 2>/dev/null
pkill -f "ngrok http 8000" 2>/dev/null
sleep 2

# 2. 啟動 Python HTTP 服務器（後台運行）
echo "🐍 啟動本地 HTTP 服務器 (端口 8000)..."
cd "$(dirname "$0")"
nohup python3 -m http.server 8000 > server.log 2>&1 &
SERVER_PID=$!
echo "   ✅ 服務器 PID: $SERVER_PID"
sleep 2

# 3. 啟動 ngrok（後台運行）
echo "🌐 啟動 ngrok 隧道..."
nohup ngrok http 8000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!
echo "   ✅ ngrok PID: $NGROK_PID"
sleep 3

# 4. 獲取 ngrok URL
echo ""
echo "⏳ 等待 ngrok 啟動..."
sleep 2

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else '')" 2>/dev/null)

if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "✅ 服務器啟動成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 本地訪問: http://localhost:8000"
    echo "🌐 公共 URL: $NGROK_URL"
    echo "📊 ngrok 控制台: http://localhost:4040"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔗 World App 測試："
    echo "   worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6"
    echo ""
    echo "📝 日誌文件："
    echo "   - server.log (HTTP 服務器日誌)"
    echo "   - ngrok.log (ngrok 日誌)"
    echo ""
    echo "⚠️  注意："
    echo "   - ngrok 免費版 URL 每次重啟會變"
    echo "   - 要固定 URL 需要升級 ngrok 付費版"
    echo "   - 服務器會持續運行直到手動停止"
    echo ""
    echo "🛑 停止服務器："
    echo "   ./stop-servers.sh"
    echo ""
else
    echo "❌ ngrok 啟動失敗，請檢查配置"
    exit 1
fi

