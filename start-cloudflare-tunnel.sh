#!/bin/bash

# Cloudflare Tunnel 快速啟動
# 不需要註冊，立即可用！

echo "🌐 啟動 Cloudflare Tunnel..."
echo ""

# 檢查是否已安裝 cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "正在安裝 cloudflared..."
    brew install cloudflare/cloudflare/cloudflared
    echo ""
fi

echo "📡 創建隧道連接到 localhost:8000..."
echo ""
echo "正在連接..."
echo ""

# 啟動臨時隧道
cloudflared tunnel --url http://localhost:8000

