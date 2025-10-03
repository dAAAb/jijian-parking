# 部署指南 - 讓遊戲永久在線

## 🎯 問題總結

### ngrok 的限制
無論免費還是付費，**電腦關機後 ngrok 就會停止**。

| 需求 | ngrok 免費 | ngrok 付費 | GitHub Pages |
|------|-----------|-----------|--------------|
| URL 固定 | ❌ | ✅ | ✅ |
| 電腦關機可訪問 | ❌ | ❌ | ✅ |
| 費用 | 免費 | $8/月 | 免費 |

---

## ✅ 推薦方案：GitHub Pages（已配置）

你的遊戲已經部署到 GitHub Pages，永久在線！

### 🌐 URL
```
https://daaab.github.io/jijian-parking/
```

### 📱 World App 測試
```
worldapp://mini-app?app_id=app_8759766ce92173ee6e1ce6568a9bc9e6
```

---

## 🔄 開發流程

### 本地開發（使用 ngrok）
```bash
# 1. 啟動本地服務器
./start-servers.sh

# 2. 開發和測試
# ngrok URL: https://xxxx.ngrok-free.app
# 電腦關機會停止

# 3. 停止服務器
./stop-servers.sh
```

### 部署到線上（GitHub Pages）
```bash
# 1. 提交修改
git add .
git commit -m "更新遊戲"
git push origin main

# 2. 等待 GitHub Actions 自動部署（約 1-2 分鐘）

# 3. 訪問固定 URL
# https://daaab.github.io/jijian-parking/
```

---

## 🚀 部署到其他平台（可選）

### Vercel（免費 + 自動部署）

**優點**：
- ✅ 完全免費
- ✅ 自動部署（push 後自動更新）
- ✅ 更快的速度
- ✅ 可自定義域名

**步驟**：
1. 訪問 https://vercel.com
2. 用 GitHub 登錄
3. 選擇 `dAAAb/jijian-parking` 倉庫
4. 點擊 Deploy
5. 獲得 URL：`https://jijian-parking.vercel.app`

### Netlify（免費 + 自動部署）

**步驟**：
1. 訪問 https://netlify.com
2. 用 GitHub 登錄
3. 選擇 `dAAAb/jijian-parking` 倉庫
4. 點擊 Deploy
5. 獲得 URL：`https://jijian-parking.netlify.app`

---

## 💡 最佳實踐

### 開發階段
```bash
# 使用 ngrok 本地測試（快速迭代）
./start-servers.sh
# URL 會變，但方便快速測試
```

### 測試階段
```bash
# 部署到 GitHub Pages（固定 URL）
git push origin main
# URL: https://daaab.github.io/jijian-parking/
```

### 生產階段
```bash
# 使用 Vercel/Netlify（更專業）
# 或繼續使用 GitHub Pages（已經很好）
```

---

## ❓ 常見問題

**Q: 我需要付費 ngrok 嗎？**
A: 不需要！GitHub Pages 完全免費且更好。

**Q: 電腦關機後怎麼辦？**
A: 使用 GitHub Pages，永久在線。

**Q: ngrok 有什麼用？**
A: 僅用於本地開發測試，方便快速迭代。

**Q: 如何更新 World Developer Portal 的 URL？**
A: 將 Mini App URL 改為：
```
https://daaab.github.io/jijian-parking/
```

**Q: GitHub Pages 更新需要多久？**
A: 通常 1-2 分鐘，可以在 GitHub Actions 查看進度。

---

## 🎯 結論

### 不需要付費 ngrok！

✅ **開發**：本地 + ngrok 免費版（URL 會變，但沒關係）
✅ **生產**：GitHub Pages（免費 + 固定 URL + 永久在線）

你已經擁有最好的免費解決方案了！🎉
