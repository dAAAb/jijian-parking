#!/bin/bash

# 極簡停車 - 停止服務器腳本

echo "🛑 停止極簡停車服務器..."
echo ""

# 停止 Python 服務器
echo "📋 停止 HTTP 服務器..."
pkill -f "python3 -m http.server 8000"

# 停止 ngrok
echo "📋 停止 ngrok..."
pkill -f "ngrok http 8000"

sleep 1

echo ""
echo "✅ 所有服務器已停止"
echo ""

