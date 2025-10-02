// World MiniKit 整合
class WorldMiniKit {
    constructor() {
        this.isInitialized = false;
        this.walletAddress = null;
        this.isWorldApp = false;
        this.appId = 'app_staging_your_app_id_here'; // 替換成你的 App ID
        
        this.init();
    }

    async init() {
        try {
            // 檢測是否在 World App 中運行
            this.isWorldApp = typeof MiniKit !== 'undefined';
            
            if (this.isWorldApp) {
                console.log('🌍 在 World App 中運行');
                
                // 初始化 MiniKit
                if (!MiniKit.isInstalled()) {
                    console.warn('MiniKit 未安裝');
                    this.fallbackMode();
                    return;
                }
                
                this.isInitialized = true;
                this.setupWorldAppFeatures();
            } else {
                console.log('🌐 在普通瀏覽器中運行（開發模式）');
                this.fallbackMode();
            }
        } catch (error) {
            console.error('初始化 MiniKit 失敗:', error);
            this.fallbackMode();
        }
    }

    fallbackMode() {
        // 非 World App 環境的降級模式
        console.log('啟用降級模式');
        const startBtn = document.getElementById('start-btn');
        const connectBtn = document.getElementById('connect-wallet-btn');
        
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '開始遊戲（開發模式）';
        }
        
        if (connectBtn) {
            connectBtn.style.display = 'none';
        }
    }

    setupWorldAppFeatures() {
        // 設置連接錢包按鈕
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        // 設置分享按鈕
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareScore());
        }
    }

    async connectWallet() {
        try {
            console.log('連接 World 錢包...');
            
            // 使用 MiniKit 進行錢包認證
            const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
                nonce: this.generateNonce(),
                requestId: this.generateRequestId(),
                expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 天
                notBefore: new Date(),
                statement: '歡迎來到極簡停車！連接錢包開始遊戲。',
            });

            if (finalPayload.status === 'success') {
                this.walletAddress = finalPayload.address;
                this.onWalletConnected(finalPayload.address);
                
                // 發送震動反饋
                this.sendHapticFeedback('success');
            } else {
                console.error('錢包連接失敗:', finalPayload);
                alert('連接錢包失敗，請重試');
            }
        } catch (error) {
            console.error('連接錢包錯誤:', error);
            
            // 開發模式：模擬連接成功
            if (!this.isWorldApp) {
                const mockAddress = '0x' + Math.random().toString(16).substr(2, 40);
                this.walletAddress = mockAddress;
                this.onWalletConnected(mockAddress);
            }
        }
    }

    onWalletConnected(address) {
        console.log('✅ 錢包已連接:', address);
        
        // 更新 UI
        const connectBtn = document.getElementById('connect-wallet-btn');
        const walletInfo = document.getElementById('wallet-info');
        const walletAddressEl = document.getElementById('wallet-address');
        const startBtn = document.getElementById('start-btn');
        
        if (connectBtn) connectBtn.style.display = 'none';
        if (walletInfo) walletInfo.classList.remove('hidden');
        if (walletAddressEl) {
            walletAddressEl.textContent = this.formatAddress(address);
        }
        if (startBtn) {
            startBtn.disabled = false;
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    async shareScore() {
        try {
            const score = document.getElementById('total-score')?.textContent || '0';
            const level = document.getElementById('level-display')?.textContent || '1';
            
            if (this.isWorldApp && MiniKit.isInstalled()) {
                // 使用 World App 的分享功能
                await MiniKit.commands.share({
                    title: '極簡停車 🚗',
                    text: `我在極簡停車達到第 ${level} 關，總分 ${score} 分！來挑戰我吧！`,
                    url: 'worldapp://mini-app?app_id=' + this.appId,
                });
                
                this.sendHapticFeedback('medium');
            } else {
                // 降級到 Web Share API
                if (navigator.share) {
                    await navigator.share({
                        title: '極簡停車 🚗',
                        text: `我在極簡停車達到第 ${level} 關，總分 ${score} 分！`,
                        url: window.location.href,
                    });
                } else {
                    alert('分享功能在此環境中不可用');
                }
            }
        } catch (error) {
            console.error('分享失敗:', error);
        }
    }

    async sendNotification(title, message) {
        try {
            if (!this.isWorldApp || !this.walletAddress) {
                console.log('無法發送通知：非 World App 環境或未連接錢包');
                return;
            }

            // 注意：發送通知需要後端 API key
            // 這裡僅展示客戶端調用方式
            console.log('📬 準備發送通知:', title, message);
            
            // 實際發送需要從後端調用 API
            // await fetch('YOUR_BACKEND_URL/send-notification', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         wallet_address: this.walletAddress,
            //         title, message
            //     })
            // });
            
        } catch (error) {
            console.error('發送通知失敗:', error);
        }
    }

    async sendHapticFeedback(type = 'medium') {
        try {
            if (this.isWorldApp && MiniKit.isInstalled()) {
                await MiniKit.commands.sendHapticFeedback({
                    type: type // 'light', 'medium', 'heavy', 'success', 'warning', 'error'
                });
            } else if (navigator.vibrate) {
                // 降級到標準震動 API
                const patterns = {
                    light: [10],
                    medium: [20],
                    heavy: [30],
                    success: [10, 50, 10],
                    warning: [20, 100],
                    error: [30, 50, 30]
                };
                navigator.vibrate(patterns[type] || patterns.medium);
            }
        } catch (error) {
            console.error('震動反饋失敗:', error);
        }
    }

    async simulatePayment(amount, token = 'WLD') {
        try {
            if (!this.isWorldApp) {
                console.log(`💰 模擬支付: ${amount} ${token}`);
                return { success: true, txHash: '0xmock...' };
            }

            // 創建支付請求
            const { finalPayload } = await MiniKit.commandsAsync.pay({
                reference: this.generateRequestId(),
                to: 'YOUR_GAME_TREASURY_ADDRESS', // 替換成你的遊戲金庫地址
                tokens: [
                    {
                        symbol: token,
                        token_amount: (amount * 1000000).toString(), // 轉換為 6 位小數的整數
                    },
                ],
                description: `極簡停車 - 遊戲內購買`,
            });

            if (finalPayload.status === 'success') {
                console.log('✅ 支付成功:', finalPayload.transaction_id);
                this.sendHapticFeedback('success');
                return {
                    success: true,
                    txHash: finalPayload.transaction_id
                };
            } else {
                console.error('❌ 支付失敗:', finalPayload);
                return { success: false, error: finalPayload };
            }
        } catch (error) {
            console.error('支付錯誤:', error);
            return { success: false, error };
        }
    }

    generateNonce() {
        return Math.random().toString(36).substring(2, 15);
    }

    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // 獲取 WLD 價格
    async getWLDPrice() {
        try {
            const response = await fetch(
                'https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=WLD&fiatCurrencies=USD'
            );
            const data = await response.json();
            
            if (data.result?.prices?.WLD?.USD) {
                const amount = data.result.prices.WLD.USD.amount;
                const decimals = data.result.prices.WLD.USD.decimals;
                const price = parseFloat(amount) * Math.pow(10, -decimals);
                console.log('💵 WLD 價格:', price, 'USD');
                return price;
            }
        } catch (error) {
            console.error('獲取 WLD 價格失敗:', error);
        }
        return null;
    }
}

// 全局實例
window.worldMiniKit = new WorldMiniKit();

