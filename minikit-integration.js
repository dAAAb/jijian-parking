// World MiniKit 整合
class WorldMiniKit {
    constructor() {
        this.isInitialized = false;
        this.walletAddress = null;
        this.isWorldApp = false;
        this.isVerified = false;
        this.verificationLevel = null; // 'orb' 或 'device'
        
        // 從本地配置讀取（如果有），否則使用默認值
        const config = window.LOCAL_CONFIG || {};
        this.appId = config.APP_ID || 'app_8759766ce92173ee6e1ce6568a9bc9e6';
        this.actionId = config.ACTION_ID || 'verifyparkinggame';
        this.apiKey = config.WORLD_API_KEY || null; // API Key（僅用於後端驗證）
        this.backendUrl = config.BACKEND_URL || null;
        
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
        console.log('啟用降級模式：普通瀏覽器環境');
        
        // 保持未驗證狀態，顯示「⚠️ 未驗證」
        // 但仍然允許玩遊戲（不強制驗證）
        this.isVerified = false;
        this.verificationLevel = null;
        
        // 仍然設置驗證按鈕的點擊事件，但會顯示提示訊息
        this.setupVerificationButton();
    }

    setupWorldAppFeatures() {
        // 設置驗證按鈕
        this.setupVerificationButton();

        // 設置分享按鈕
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareScore());
        }
    }

    setupVerificationButton() {
        // 設置 World ID 驗證按鈕（在所有環境中都顯示）
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verifyWorldID());
        }
    }

    updateVerificationStatus(isVerified, level = null) {
        const statusDiv = document.getElementById('verification-status');
        
        if (!statusDiv) return;
        
        if (isVerified) {
            const levelText = level === 'orb' ? '🌐 Orb' : '📱 裝置';
            statusDiv.innerHTML = `<span class="status-verified">✅ 已通過真人驗證 (${levelText})</span>`;
        } else {
            statusDiv.innerHTML = `<span class="status-unverified">⚠️ 未驗證</span>`;
        }
    }

    async verifyWorldID() {
        try {
            console.log('開始 World ID 驗證...');
            
            const verifyBtn = document.getElementById('verify-world-id-btn');
            
            // 如果不在 World App 環境中，顯示提示訊息
            if (!this.isWorldApp) {
                console.warn('嘗試在非 World App 環境中進行驗證');
                alert('⚠️ 無法驗證\n\n此功能僅支援在 World App 中使用。\n請在 World App 中打開此 Mini App 以進行真人驗證。');
                return;
            }
            
            // 在 World App 中才繼續驗證流程
            if (verifyBtn) {
                verifyBtn.disabled = true;
                verifyBtn.textContent = '驗證中...';
            }
            
            // 使用 MiniKit 進行 World ID 驗證
            const { finalPayload } = await MiniKit.commandsAsync.verify({
                action: this.actionId, // 你的驗證動作 ID
                signal: this.generateNonce(), // 防重放攻擊的信號
                verification_level: 'orb', // 'orb' = 僅 Orb 驗證用戶（最高安全）
            });

            if (finalPayload.status === 'success') {
                console.log('✅ World ID 驗證成功!', finalPayload);
                
                this.isVerified = true;
                this.verificationLevel = finalPayload.verification_level;
                
                // 需要向後端驗證 proof
                const isValid = await this.verifyProofWithBackend(finalPayload);
                
                if (isValid) {
                    this.onVerificationSuccess(
                        finalPayload.verification_level,
                        finalPayload.nullifier_hash
                    );
                    this.sendHapticFeedback('success');
                } else {
                    throw new Error('後端驗證失敗');
                }
            } else {
                console.error('❌ World ID 驗證失敗:', finalPayload);
                this.onVerificationFailed('驗證失敗，請重試');
            }
        } catch (error) {
            console.error('World ID 驗證錯誤:', error);
            this.onVerificationFailed(error.message || '驗證過程發生錯誤');
        }
    }

    async verifyProofWithBackend(payload) {
        try {
            console.log('📤 準備驗證 proof...');
            
            // 如果有配置後端 URL，使用後端驗證
            if (this.backendUrl) {
                console.log('使用後端驗證:', this.backendUrl);
                const response = await fetch(`${this.backendUrl}/api/verify-world-id`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        proof: payload.proof,
                        merkle_root: payload.merkle_root,
                        nullifier_hash: payload.nullifier_hash,
                        verification_level: payload.verification_level,
                        action: this.actionId,
                        signal: payload.signal,
                    })
                });
                const data = await response.json();
                return data.success;
            }
            
            // 如果在瀏覽器環境且有 API Key，直接調用 World API
            // ⚠️ 注意：這樣做會暴露 API Key，僅用於開發測試！
            if (this.apiKey && !this.backendUrl) {
                console.log('⚠️ 直接調用 World API（僅用於開發測試）');
                const response = await fetch('https://developer.worldcoin.org/api/v2/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        proof: payload.proof,
                        merkle_root: payload.merkle_root,
                        nullifier_hash: payload.nullifier_hash,
                        verification_level: payload.verification_level,
                        action: this.actionId,
                        signal: payload.signal,
                    })
                });
                const data = await response.json();
                console.log('World API 驗證結果:', data);
                return data.success;
            }
            
            // 開發模式：跳過驗證
            console.log('⚠️ 開發模式：跳過後端驗證');
            return true;
            
        } catch (error) {
            console.error('驗證失敗:', error);
            return false;
        }
    }

    onVerificationSuccess(level, nullifierHash) {
        console.log('✅ 驗證成功!', { level, nullifierHash });
        
        this.isVerified = true;
        this.verificationLevel = level;
        this.nullifierHash = nullifierHash;
        
        // 更新驗證狀態顯示
        this.updateVerificationStatus(true, level);
        
        // 隱藏驗證按鈕
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            verifyBtn.style.display = 'none';
        }
    }

    onVerificationFailed(message) {
        console.error('❌ 驗證失敗:', message);
        
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.textContent = '🌍 World ID 驗證';
        }
        
        alert(`驗證失敗：${message}\n\n請確保你已經設置了 World ID。`);
        this.sendHapticFeedback('error');
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

