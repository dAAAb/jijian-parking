// World MiniKit 整合
// 版本: v1.4.1
// 參考文檔:
// - MiniKit: https://docs.world.org/mini-apps/commands/verify
// - IDKit: https://docs.world.org/world-id/reference/idkit
// 支援：World App (MiniKit) + 網頁瀏覽器 (IDKit Standalone)
// v1.3.0: 藍勾勾驗證徽章 + 測試模式
// v1.4.0: 修正平台偵測 + 手機瀏覽器處理
// v1.4.1: 等待 MiniKit 初始化 + 改進錯誤訊息
class WorldMiniKit {
    constructor() {
        this.version = 'v1.4.1';
        this.isInitialized = false;
        this.walletAddress = null;
        this.isWorldApp = false;
        this.isMobileBrowser = false;
        this.isDesktopBrowser = false;
        this.isVerified = false;
        this.verificationLevel = null; // 'orb' 或 'device'

        // 平台偵測
        this.detectPlatform();

        // 從本地配置讀取（如果有），否則使用默認值
        const config = window.LOCAL_CONFIG || {};
        this.appId = config.APP_ID || 'app_8759766ce92173ee6e1ce6568a9bc9e6';
        this.actionId = config.ACTION_ID || 'verifyparkinggame';
        this.apiKey = config.WORLD_API_KEY || null; // API Key（僅用於後端驗證）
        this.backendUrl = config.BACKEND_URL || null;

        // 測試模式：允許在普通瀏覽器中模擬驗證
        // 可以通過 URL 參數 ?test=1 或 config.TEST_MODE 啟用
        const urlParams = new URLSearchParams(window.location.search);
        this.testMode = urlParams.get('test') === '1' || config.TEST_MODE === true;

        console.log(`🎮 極簡停車 ${this.version}`);
        console.log('🔧 WorldMiniKit 配置:', {
            version: this.version,
            appId: this.appId,
            actionId: this.actionId,
            backendUrl: this.backendUrl,
            hasApiKey: !!this.apiKey,
            testMode: this.testMode
        });

        this.init();
    }

    // 平台偵測（基本偵測，不依賴 MiniKit）
    detectPlatform() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // 檢測是否為手機/平板
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        this.isMobile = mobileRegex.test(userAgent);

        console.log('📱 基本平台偵測:', {
            userAgent: userAgent.substring(0, 50) + '...',
            isMobile: this.isMobile
        });
    }

    // 等待並偵測 MiniKit 環境
    async waitForMiniKit(maxWait = 2000) {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            const hasMiniKit = typeof MiniKit !== 'undefined';
            const isInstalled = hasMiniKit && typeof MiniKit.isInstalled === 'function' && MiniKit.isInstalled();

            if (isInstalled) {
                console.log('✅ MiniKit 已安裝並準備好');
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('⏱️ MiniKit 等待超時');
        return false;
    }

    async init() {
        try {
            // 等待 MiniKit 初始化（World App 內部需要一點時間）
            const miniKitReady = await this.waitForMiniKit();

            // 更新環境狀態
            this.isWorldApp = miniKitReady;
            this.isMobileBrowser = this.isMobile && !miniKitReady;
            this.isDesktopBrowser = !this.isMobile && !miniKitReady;

            console.log('🔍 環境檢測結果:', {
                isWorldApp: this.isWorldApp,
                isMobileBrowser: this.isMobileBrowser,
                isDesktopBrowser: this.isDesktopBrowser,
                hasMiniKit: typeof MiniKit !== 'undefined',
                hasIDKit: typeof window.IDKit !== 'undefined'
            });

            if (this.isWorldApp) {
                // 在 World App Mini App 內部
                console.log('🌍 在 World App Mini App 中運行');
                this.isInitialized = true;
                this.setupWorldAppFeatures();
                console.log('✅ World App 功能已設置');
            } else if (this.isMobileBrowser) {
                // 手機瀏覽器（非 World App）
                console.log('📱 在手機瀏覽器中運行');
                this.fallbackMode();
            } else {
                // 桌面瀏覽器
                console.log('🖥️ 在桌面瀏覽器中運行');
                this.fallbackMode();
            }
        } catch (error) {
            console.error('❌ 初始化失敗:', error);
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
            console.log('🔘 設置驗證按鈕事件監聽');
            verifyBtn.addEventListener('click', () => {
                console.log('🖱️ 驗證按鈕被點擊！');
                this.verifyWorldID();
            });
        } else {
            console.warn('⚠️ 找不到驗證按鈕元素');
        }
    }

    updateVerificationStatus(isVerified, level = null, isTestMode = false) {
        const statusDiv = document.getElementById('verification-status');
        const badge = document.getElementById('verification-badge');

        if (statusDiv) {
            if (isVerified) {
                const levelText = level === 'orb' ? '🌐 Orb' : '📱 裝置';
                const testLabel = isTestMode ? ' (測試)' : '';
                statusDiv.innerHTML = `<span class="status-verified">✅ 已通過真人驗證 (${levelText})${testLabel}</span>`;
            } else {
                statusDiv.innerHTML = `<span class="status-unverified">⚠️ 未驗證</span>`;
            }
        }

        // 顯示/隱藏藍勾勾徽章
        if (badge) {
            if (isVerified) {
                badge.classList.remove('hidden');

                // 根據驗證等級添加特殊樣式
                if (level === 'orb') {
                    badge.classList.add('orb-verified');
                }

                // 測試模式特殊樣式
                if (isTestMode) {
                    badge.classList.add('test-mode');
                    badge.querySelector('.badge-tooltip').textContent = '測試驗證';
                } else {
                    badge.querySelector('.badge-tooltip').textContent = level === 'orb' ? 'Orb 驗證' : '已驗證真人';
                }

                console.log('🔵 藍勾勾徽章已顯示');
            } else {
                badge.classList.add('hidden');
                badge.classList.remove('orb-verified', 'test-mode');
            }
        }
    }

    async verifyWorldID() {
        const verifyBtn = document.getElementById('verify-world-id-btn');

        try {
            console.log('🔐 開始 World ID 驗證...');
            console.log('環境檢查:', {
                isWorldApp: this.isWorldApp,
                isMobileBrowser: this.isMobileBrowser,
                isDesktopBrowser: this.isDesktopBrowser,
                hasMiniKit: typeof MiniKit !== 'undefined',
                hasIDKit: typeof window.IDKit !== 'undefined',
                backendUrl: this.backendUrl,
                testMode: this.testMode
            });

            if (verifyBtn) {
                verifyBtn.disabled = true;
                verifyBtn.textContent = '驗證中...';
            }

            // 測試模式：模擬驗證成功
            if (this.testMode) {
                console.log('🧪 測試模式：模擬驗證');
                await this.simulateVerification();
                return;
            }

            // 根據環境選擇驗證方式
            if (this.isWorldApp) {
                // World App Mini App 內部：使用 MiniKit
                console.log('🌍 使用 MiniKit 驗證（World App 內部）');
                await this.verifyWithMiniKit();
            } else if (this.isMobileBrowser) {
                // 手機瀏覽器：顯示提示，建議使用 World App
                console.log('📱 手機瀏覽器環境');
                await this.verifyOnMobileBrowser();
            } else {
                // 桌面瀏覽器：使用 IDKit（QR Code）
                console.log('🖥️ 使用 IDKit 驗證（桌面瀏覽器）');
                await this.verifyWithIDKit();
            }
        } catch (error) {
            console.error('❌ World ID 驗證錯誤:', error);
            console.error('錯誤堆疊:', error.stack);
            this.onVerificationFailed(error.message || '驗證過程發生錯誤');

            // 恢復按鈕狀態
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = '🌍 World ID 驗證';
            }
        }
    }

    // 手機瀏覽器驗證處理
    async verifyOnMobileBrowser() {
        const verifyBtn = document.getElementById('verify-world-id-btn');

        // 顯示選項對話框
        const choice = await this.showMobileVerificationOptions();

        if (choice === 'worldapp') {
            // 嘗試打開 World App
            const worldAppUrl = `https://worldcoin.org/verify?action_id=${this.actionId}&app_id=${this.appId}`;
            window.location.href = worldAppUrl;

            // 恢復按鈕（因為可能沒有成功跳轉）
            setTimeout(() => {
                if (verifyBtn) {
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = '🌍 World ID 驗證';
                }
            }, 3000);
        } else if (choice === 'idkit') {
            // 嘗試使用 IDKit（可能會有回調問題）
            console.log('⚠️ 嘗試在手機瀏覽器使用 IDKit（可能不穩定）');
            await this.verifyWithIDKit();
        } else {
            // 取消
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = '🌍 World ID 驗證';
            }
        }
    }

    // 顯示手機驗證選項
    showMobileVerificationOptions() {
        return new Promise((resolve) => {
            // 創建對話框
            const overlay = document.createElement('div');
            overlay.id = 'mobile-verify-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: #1a1a2e;
                border-radius: 20px;
                padding: 30px;
                max-width: 350px;
                text-align: center;
                color: white;
            `;

            dialog.innerHTML = `
                <h3 style="margin-bottom: 15px; font-size: 1.3em;">📱 手機驗證</h3>
                <p style="color: #aaa; margin-bottom: 25px; font-size: 0.95em;">
                    建議使用 World App 進行驗證，以獲得最佳體驗。
                </p>
                <button id="btn-open-worldapp" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 12px;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 1em;
                    font-weight: bold;
                    cursor: pointer;
                ">🌍 開啟 World App 驗證</button>
                <button id="btn-try-idkit" style="
                    width: 100%;
                    padding: 12px;
                    margin-bottom: 12px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 12px;
                    background: transparent;
                    color: white;
                    font-size: 0.9em;
                    cursor: pointer;
                ">嘗試瀏覽器驗證（可能不穩定）</button>
                <button id="btn-cancel" style="
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 12px;
                    background: transparent;
                    color: #888;
                    font-size: 0.85em;
                    cursor: pointer;
                ">取消</button>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // 綁定事件
            document.getElementById('btn-open-worldapp').onclick = () => {
                overlay.remove();
                resolve('worldapp');
            };
            document.getElementById('btn-try-idkit').onclick = () => {
                overlay.remove();
                resolve('idkit');
            };
            document.getElementById('btn-cancel').onclick = () => {
                overlay.remove();
                resolve('cancel');
            };
        });
    }

    // 測試模式：模擬驗證成功
    async simulateVerification() {
        console.log('🧪 模擬驗證流程...');

        // 模擬 1.5 秒的驗證延遲
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 模擬成功
        this.isVerified = true;
        this.verificationLevel = 'orb'; // 模擬 Orb 驗證

        this.onVerificationSuccess('orb', 'test_nullifier_' + Date.now(), true);

        console.log('✅ 測試驗證完成');
    }

    async verifyWithMiniKit() {
        console.log('📱 使用 MiniKit 驗證（World App）');
        
        // 檢查 MiniKit 是否可用
        if (typeof MiniKit === 'undefined') {
            console.error('❌ MiniKit 未定義');
            throw new Error('MiniKit 不可用');
        }
        
        if (!MiniKit.commandsAsync || !MiniKit.commandsAsync.verify) {
            console.error('❌ MiniKit.commandsAsync.verify 不存在');
            console.log('可用的 MiniKit 方法:', Object.keys(MiniKit));
            throw new Error('MiniKit.commandsAsync.verify 不可用');
        }
        
        // 準備驗證參數
        const signal = this.generateNonce();
        const verifyPayload = {
            action: this.actionId,
            signal: signal,
            verification_level: 'orb'
        };
        
        console.log('📋 驗證參數:', {
            action: this.actionId,
            signal: signal,
            verification_level: 'orb'
        });
        
        console.log('🚀 調用 MiniKit.commandsAsync.verify...');
        
        try {
            // 使用 MiniKit 進行 World ID 驗證
            const result = await MiniKit.commandsAsync.verify(verifyPayload);
            
            console.log('📦 收到完整回應:', result);
            
            const { finalPayload } = result;
            
            console.log('📦 finalPayload:', finalPayload);
            
            if (!finalPayload) {
                console.error('❌ finalPayload 為空');
                throw new Error('驗證回應為空');
            }
            
            if (finalPayload.status === 'success') {
                console.log('✅ World ID 驗證成功!', finalPayload);
                
                this.isVerified = true;
                this.verificationLevel = finalPayload.verification_level;
                
                // 需要向後端驗證 proof
                const isValid = await this.verifyProofWithBackend(finalPayload);
                
                if (isValid) {
                    this.onVerificationSuccess(
                        finalPayload.verification_level,
                        finalPayload.nullifier_hash,
                        false // 不是測試模式
                    );
                } else {
                    throw new Error('後端驗證失敗');
                }
            } else if (finalPayload.status === 'error') {
                console.error('❌ World ID 驗證失敗:', finalPayload);
                this.onVerificationFailed(finalPayload.error_code || '驗證失敗，請重試');
            } else {
                console.warn('⚠️ 未知狀態:', finalPayload);
                this.onVerificationFailed('驗證過程發生錯誤');
            }
        } catch (error) {
            console.error('💥 MiniKit.commandsAsync.verify 調用失敗:', error);
            console.error('錯誤詳情:', error.message, error.stack);
            throw error;
        }
    }

    async verifyWithIDKit() {
        console.log('🌐 使用 IDKit 驗證（網頁瀏覽器）');
        
        // 等待 IDKit 加載
        let retries = 0;
        while (typeof window.IDKit === 'undefined' && retries < 20) {
            console.log(`等待 IDKit 加載... (${retries}/20)`);
            await new Promise(resolve => setTimeout(resolve, 300));
            retries++;
        }
        
        if (typeof window.IDKit === 'undefined') {
            console.error('❌ IDKit 未找到，請檢查 CDN 是否加載');
            console.log('當前 window 對象中的 World 相關屬性:', Object.keys(window).filter(k => k.includes('ID') || k.includes('World')));
            throw new Error('IDKit 未加載，請重新整理頁面');
        }
        
        console.log('✅ IDKit 已加載', typeof window.IDKit);
        console.log('IDKit 方法:', Object.keys(window.IDKit));
        
        const signal = this.generateNonce();
        const self = this;
        
        try {
            console.log('📱 初始化 IDKit...');
            console.log('配置參數:', {
                app_id: this.appId,
                action: this.actionId,
                signal: signal,
                verification_level: 'orb'
            });
            
            // 使用 IDKit.init() 和 IDKit.open() - 參考官方文檔
            // https://docs.world.org/world-id/reference/idkit#idkit-standalone
            window.IDKit.init({
                app_id: this.appId,
                action: this.actionId,
                signal: signal,
                verification_level: 'orb',
                // handleVerify 用於後端驗證（在用戶看到成功畫面前）
                handleVerify: async (result) => {
                    console.log('🔄 handleVerify 被調用:', result);
                    
                    // 構造 payload
                    const payload = {
                        proof: result.proof,
                        merkle_root: result.merkle_root,
                        nullifier_hash: result.nullifier_hash,
                        verification_level: result.verification_level,
                        signal: signal
                    };
                    
                    console.log('📤 向後端驗證 proof...');
                    
                    // 向後端驗證，如果驗證失敗會拋出錯誤
                    const isValid = await self.verifyProofWithBackend(payload);
                    
                    if (!isValid) {
                        throw new Error('後端驗證失敗');
                    }
                    
                    console.log('✅ 後端驗證成功');
                },
                // onSuccess 只在 handleVerify 成功後調用
                onSuccess: (result) => {
                    console.log('✅ IDKit 驗證完全成功!', result);
                    
                    self.isVerified = true;
                    self.verificationLevel = result.verification_level;
                    
                    self.onVerificationSuccess(
                        result.verification_level,
                        result.nullifier_hash
                    );
                },
                // onError 處理所有錯誤
                onError: (error) => {
                    console.error('❌ IDKit 驗證失敗:', error);
                    self.onVerificationFailed(error?.detail || error?.message || '驗證失敗');
                }
            });
            
            console.log('✅ IDKit 初始化完成');
            console.log('📱 打開 IDKit 驗證視窗...');
            
            await window.IDKit.open();
            console.log('✅ IDKit.open() 調用完成');
            
        } catch (error) {
            console.error('💥 IDKit 錯誤:', error);
            console.error('錯誤詳情:', error.message, error.stack);
            throw error;
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
                console.log('後端驗證回應:', data);

                if (!data.success) {
                    console.error('後端驗證失敗原因:', data.error);
                    // 保存錯誤訊息供後續顯示
                    this.lastBackendError = data.error || '未知錯誤';
                }

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

    onVerificationSuccess(level, nullifierHash, isTestMode = false) {
        console.log('✅ 驗證成功!', { level, nullifierHash, isTestMode });

        this.isVerified = true;
        this.verificationLevel = level;
        this.nullifierHash = nullifierHash;

        // 更新驗證狀態顯示（包含藍勾勾徽章）
        this.updateVerificationStatus(true, level, isTestMode);

        // 隱藏驗證按鈕
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            verifyBtn.style.display = 'none';
        }

        // 如果不是測試模式，發送成功震動
        if (!isTestMode) {
            this.sendHapticFeedback('success');
        }
    }

    onVerificationFailed(message) {
        console.error('❌ 驗證失敗:', message);
        
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.textContent = '🌍 World ID 驗證';
        }
        
        // 顯示更詳細的錯誤訊息
        const errorMsg = `驗證失敗：${message}\n\n請確保你已經設置了 World ID。`;
        console.error('完整錯誤訊息:', errorMsg);
        alert(errorMsg);
        
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

