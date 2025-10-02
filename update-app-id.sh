#!/bin/bash

# 更新 World App ID 腳本
# 使用方法: ./update-app-id.sh your_app_id

if [ -z "$1" ]; then
    echo "❌ 錯誤：請提供 App ID"
    echo "使用方法: ./update-app-id.sh app_staging_xxxxx"
    exit 1
fi

APP_ID=$1

echo "🔧 正在更新 App ID 為: $APP_ID"

# 更新 miniapp.json
sed -i '' "s/\"app_id\": \"app_staging_your_app_id_here\"/\"app_id\": \"$APP_ID\"/" miniapp.json
echo "✅ 已更新 miniapp.json"

# 更新 minikit-integration.js
sed -i '' "s/this.appId = 'app_staging_your_app_id_here'/this.appId = '$APP_ID'/" minikit-integration.js
echo "✅ 已更新 minikit-integration.js"

echo ""
echo "🎉 完成！現在提交更改："
echo "git add miniapp.json minikit-integration.js"
echo "git commit -m '🔧 更新 World App ID'"
echo "git push origin main"


