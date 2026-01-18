// World MiniKit 整合
// 版本: v2.1.17 - 修復跑馬燈初始載入

// 多語言輔助函數
function getText(key, fallback) {
    return window.i18n?.t(key) || fallback;
}
// 重要：MiniKit 現在用 dynamic import 在這裡加載
// v1.7.3: 關鍵修正 - 必須等待 window.WorldApp 注入後再調用 install()

// 立即加載 MiniKit（在任何其他代碼之前）
(async function loadMiniKit() {
    try {
        console.log('🔄 開始加載 MiniKit ESM...');
        const { MiniKit } = await import('https://cdn.jsdelivr.net/npm/@worldcoin/minikit-js@1.9.9/+esm');
        console.log('✅ MiniKit ESM 加載成功');

        // 🔥 v1.7.3 關鍵修正：install() 需要 window.WorldApp 在調用時已經存在
        // 如果 window.WorldApp 不存在，install() 不會設置 isReady = true
        // 所以我們需要先等待 window.WorldApp 出現
        console.log('🔍 檢查 window.WorldApp...');
        console.log('📋 當前狀態:', {
            hasWorldApp: typeof window.WorldApp !== 'undefined',
            hasWindowMiniKit: typeof window.MiniKit !== 'undefined'
        });

        // 等待 window.WorldApp 出現（最多 2 秒，通常幾百毫秒內就會注入）
        let worldAppWaitTime = 0;
        const maxWait = 2000;
        while (typeof window.WorldApp === 'undefined' && worldAppWaitTime < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
            worldAppWaitTime += 100;
            if (worldAppWaitTime % 500 === 0) {
                console.log(`⏳ 等待 window.WorldApp... (${worldAppWaitTime}ms)`);
            }
        }

        if (typeof window.WorldApp !== 'undefined') {
            console.log('✅ window.WorldApp 已存在，調用 install()');
            console.log('📋 WorldApp 內容:', Object.keys(window.WorldApp));
        } else {
            console.log('ℹ️ window.WorldApp 不存在（非 World App 環境）');
        }

        // 調用 install()
        const installResult = MiniKit.install();
        console.log('🔧 MiniKit.install() 返回值:', installResult);

        // install() 成功後會自動設置 window.MiniKit
        // 如果 install() 失敗（例如不在 World App 中），我們手動設置以供其他功能使用
        if (!window.MiniKit) {
            window.MiniKit = MiniKit;
            console.log('ℹ️ 手動設置 window.MiniKit（install 未在 World App 中）');
        }

        // 檢查最終狀態
        console.log('📊 isInstalled:', MiniKit.isInstalled());
        console.log('📋 MiniKit 最終狀態:', {
            isReady: MiniKit.isReady,
            walletAddress: MiniKit.walletAddress,
            user: MiniKit.user
        });

        // 如果在 World App 中但 isReady 還是 false，輸出警告
        if (typeof window.WorldApp !== 'undefined' && !MiniKit.isReady) {
            console.warn('⚠️ window.WorldApp 存在但 isReady 為 false');
            console.warn('⚠️ 這可能是因為 install() 時 window.MiniKit 已經存在');
            console.warn('📋 調試信息:', {
                installResult,
                windowMiniKit: typeof window.MiniKit,
                miniKitIsReady: MiniKit.isReady
            });
        }
    } catch (e) {
        console.error('❌ MiniKit 加載失敗:', e);
    }
})();

// 原始版本記錄
// 參考文檔:
// - MiniKit: https://docs.world.org/mini-apps/commands/verify
// - IDKit: https://docs.world.org/world-id/reference/idkit
// 支援：World App (MiniKit) + 網頁瀏覽器 (IDKit Standalone)
// v1.3.0: 藍勾勾驗證徽章 + 測試模式
// v1.4.0: 修正平台偵測 + 手機瀏覽器處理
// v1.4.1: 等待 MiniKit 初始化 + 改進錯誤訊息
// v1.5.0: 手機瀏覽器使用 IDKitSession API + polling 機制
// v1.5.1: MiniKit 驗證也移除 signal 參數（與 API v2 一致）
// v1.5.2: 修復 race condition - 防止 polling 和 visibilitychange 重複驗證
// v1.5.3: 支援已驗證用戶 (max_verifications_reached) + 顯示用戶 ID
// v1.5.4: 改進 World App 環境檢測 + 驗證時動態更新環境狀態
// v1.5.5: 修復 World App 內 Approve 視窗被遮擋問題
// v1.5.6: 增加 window.WorldApp 檢測，改進 World App 環境識別
// v1.5.7: 修正 MiniKit 初始化 - 必須調用 MiniKit.install() 才能使 isInstalled() 返回 true
// v1.5.8: 改進初始化邏輯 - 先調用 install()，再檢查 isInstalled()
// v1.5.9: 優先檢測 MiniKit.commandsAsync.verify 存在就直接使用（最可靠的 World App 檢測）
// v1.6.0: 添加可見的調試信息到按鈕上，方便在 World App 中診斷問題
// v1.6.1: 頁面加載後直接在按鈕上顯示環境狀態（不需要點擊）
// v1.6.2: 更新 MiniKit CDN 到 1.9.9 版本（UMD build）
// v1.6.3: 使用正確的 ESM 格式導入 MiniKit (+esm)，並在 HTML 中掛載到 window
// v1.6.4: 添加更多調試信息到按鈕上，追蹤 verify() 調用狀態
// v1.6.5: 顯示 isInstalled 狀態 + 為 verify() 添加 timeout 防止無限等待
// v1.6.6: 關鍵修正！只有 isInstalled()=true 才用 MiniKit，否則用 IDKit
// v1.6.7: 徹底簡化判斷邏輯，移除 window.WorldApp 干擾，只看 isInstalled()
// v1.6.8: 加回按鈕調試信息 + 延長 waitForMiniKit 超時
// v1.7.0: 穩定版 - 按鈕倒計時 + 三平台分流正確
// v1.7.1: 改用 dynamic import 加載 MiniKit，確保在 World App init payload 之前就緒
// v1.7.2: 加入更多調試信息 - install 返回值、isReady 狀態
// v1.7.3: 等待 window.WorldApp 注入後再調用 install()
// v1.7.4: 移除調試信息，改用隱晦的進度條顯示載入狀態
// v1.7.5: 改善 UI 文字 + 預載入 IDKit 加速桌面/手機瀏覽器響應
// v1.7.6: 新增支援頁面、根目錄重定向
// v1.7.7: 將所有用戶可見文字改為英文
class WorldMiniKit {
    constructor() {
        this.version = 'v2.1.17';
        this.isInitialized = false;
        this.walletAddress = null;
        this.isWorldApp = false;
        this.isMobileBrowser = false;
        this.isDesktopBrowser = false;
        this.isVerified = false;
        this.verificationLevel = null; // 'orb' 或 'device'
        this.idKitReady = false; // IDKit 預載入狀態

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

    // 等待並偵測 MiniKit / World App 環境
    async waitForMiniKit(maxWait = 5000) {
        const startTime = Date.now();
        let lastLog = 0;
        let hasCalledInstall = false;

        // 首先等待 MiniKit 加載
        while (Date.now() - startTime < maxWait) {
            const hasMiniKit = typeof MiniKit !== 'undefined';

            if (!hasMiniKit) {
                // MiniKit 還未加載，繼續等待
                if (Date.now() - lastLog > 500) {
                    console.log('⏳ 等待 MiniKit 加載...', { elapsed: Date.now() - startTime });
                    lastLog = Date.now();
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }

            // MiniKit 已加載，檢查並調用 install()
            const hasInstallMethod = typeof MiniKit.install === 'function';
            const hasIsInstalled = typeof MiniKit.isInstalled === 'function';

            // 只要 MiniKit 存在且有 install 方法，就調用它（不管有沒有 window.WorldApp）
            // 根據官方範例：先 install()，然後 isInstalled() 才能正確返回
            if (hasInstallMethod && !hasCalledInstall) {
                console.log('🔧 MiniKit 已加載，調用 MiniKit.install()...');
                try {
                    MiniKit.install();
                    hasCalledInstall = true;
                    console.log('✅ MiniKit.install() 調用成功');
                    // 給一點時間讓 World App 注入狀態
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (e) {
                    console.error('❌ MiniKit.install() 失敗:', e);
                    hasCalledInstall = true; // 避免重複調用
                }
            }

            const isInstalled = hasIsInstalled && MiniKit.isInstalled();
            const hasWorldApp = typeof window.WorldApp !== 'undefined';

            // 每 500ms 輸出一次調試日誌
            if (Date.now() - lastLog > 500) {
                console.log('🔍 MiniKit 檢測中...', {
                    elapsed: Date.now() - startTime,
                    hasMiniKit,
                    hasInstallMethod,
                    hasIsInstalled,
                    isInstalled,
                    hasWorldApp,
                    hasCalledInstall,
                    miniKitKeys: Object.keys(MiniKit).slice(0, 10)
                });
                lastLog = Date.now();
            }

            // MiniKit.isInstalled() 返回 true 表示在 World App 內
            if (isInstalled) {
                console.log('✅ World App 環境確認！', { isInstalled, hasWorldApp });
                return true;
            }

            // 如果已經調用過 install() 但 isInstalled 還是 false，可能不在 World App 內
            if (hasCalledInstall && !isInstalled) {
                // 再等一下看看
                await new Promise(resolve => setTimeout(resolve, 100));

                // 再檢查一次
                if (MiniKit.isInstalled?.()) {
                    console.log('✅ World App 環境確認（延遲檢測）');
                    return true;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 超時後最後檢查一次
        const finalHasMiniKit = typeof MiniKit !== 'undefined';
        const finalIsInstalled = finalHasMiniKit && MiniKit.isInstalled?.();
        const finalHasWorldApp = typeof window.WorldApp !== 'undefined';

        console.log('⏱️ MiniKit 等待超時');
        console.log('📋 最終狀態:', {
            hasMiniKit: finalHasMiniKit,
            isInstalled: finalIsInstalled,
            hasWorldApp: finalHasWorldApp,
            hasCalledInstall
        });

        // 如果 isInstalled 為 true（可能是延遲生效），視為 World App 環境
        if (finalIsInstalled) {
            console.log('✅ 最終確認：World App 環境');
            return true;
        }

        console.log('ℹ️ 非 World App 環境，將使用瀏覽器驗證流程');
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

        // 預載入 IDKit（背景執行，不阻塞 UI）
        this.preloadIDKit();

        // 仍然設置驗證按鈕的點擊事件
        this.setupVerificationButton();

        // 載入價格跑馬燈
        this.fetchAndDisplayRate();
    }

    // 預載入 IDKit，讓用戶點擊時能即時響應
    async preloadIDKit() {
        console.log('🔄 預載入 IDKit...');
        const startTime = Date.now();

        // 等待 IDKit 載入（最多 5 秒）
        let retries = 0;
        while (typeof window.IDKit === 'undefined' && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (typeof window.IDKit !== 'undefined') {
            console.log(`✅ IDKit 預載入完成 (${Date.now() - startTime}ms)`);
            this.idKitReady = true;
        } else {
            console.warn('⚠️ IDKit 預載入超時，將在點擊時重試');
            this.idKitReady = false;
        }
    }

    setupWorldAppFeatures() {
        // 設置驗證按鈕
        this.setupVerificationButton();

        // 設置分享按鈕
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareScore());
        }

        // 載入價格跑馬燈
        this.fetchAndDisplayRate();
    }

    setupVerificationButton() {
        // 設置 World ID 驗證按鈕（在所有環境中都顯示）
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            console.log('🔘 設置驗證按鈕事件監聯');

            // 創建進度條元素（隱晦的載入指示）
            let progressBar = document.getElementById('verify-progress-bar');
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.id = 'verify-progress-bar';
                progressBar.style.cssText = `
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    border-radius: 0 0 8px 8px;
                    width: 0%;
                    transition: width 0.2s ease;
                `;
                verifyBtn.style.position = 'relative';
                verifyBtn.style.overflow = 'hidden';
                verifyBtn.appendChild(progressBar);
            }

            // 動態等待 MiniKit 準備好（最多 2 秒，準備好就提前結束）
            const maxWait = 2000;
            const startTime = Date.now();
            let isReady = false;

            const checkReady = () => {
                const hasMK = typeof MiniKit !== 'undefined';
                // 在 Mini App 中：isInstalled() 返回 true 表示準備好
                // 在瀏覽器中：MiniKit 存在就夠了（會用 IDKit）
                return hasMK && (MiniKit.isInstalled?.() || !window.WorldApp);
            };

            const updateProgress = () => {
                const elapsed = Date.now() - startTime;
                isReady = checkReady();

                if (isReady) {
                    // MiniKit 準備好了，直接完成
                    progressBar.style.width = '100%';
                    finishLoading();
                    return;
                }

                // 還沒準備好，更新進度條
                const progress = Math.min((elapsed / maxWait) * 100, 100);
                progressBar.style.width = `${progress}%`;

                if (elapsed < maxWait) {
                    requestAnimationFrame(updateProgress);
                } else {
                    // 超時，也結束
                    finishLoading();
                }
            };

            const finishLoading = () => {
                // 淡出隱藏進度條
                progressBar.style.opacity = '0';
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 200);

                // Console 輸出調試信息
                const hasMK = typeof MiniKit !== 'undefined';
                console.log('📊 MiniKit 狀態:', {
                    isInstalled: hasMK && MiniKit.isInstalled?.(),
                    isReady: hasMK && MiniKit.isReady,
                    hasWorldApp: typeof window.WorldApp !== 'undefined',
                    loadTime: Date.now() - startTime + 'ms'
                });
            };

            requestAnimationFrame(updateProgress);

            verifyBtn.addEventListener('click', () => {
                console.log('🖱️ 驗證按鈕被點擊！');
                this.verifyWorldID();
            });
        } else {
            console.warn('⚠️ 找不到驗證按鈕元素');
        }
    }

    updateVerificationStatus(isVerified, level = null, isTestMode = false, nullifierHash = null) {
        const statusDiv = document.getElementById('verification-status');
        const badge = document.getElementById('verification-badge');

        if (statusDiv) {
            if (isVerified) {
                const levelText = level === 'orb' ? '🌐 Orb' : '📱 Device';
                const testLabel = isTestMode ? ' (Test)' : '';
                const userIdDisplay = nullifierHash
                    ? `<br><small style="color: #888; font-size: 0.75em;">ID: ${nullifierHash.substring(0, 10)}...</small>`
                    : '';
                statusDiv.innerHTML = `<span class="status-verified">✅ Verified (${levelText})${testLabel}</span>${userIdDisplay}`;
            } else {
                // 先顯示靜態文字，等跑馬燈載入後會隱藏
                const unverifiedText = window.i18n ? window.i18n.t('status.unverified') : '🎁 Verify to collect $CPK airdrop!';
                statusDiv.innerHTML = `<span class="status-unverified" id="unverified-text">${unverifiedText}</span>`;

                // 異步獲取 CPK/WLD 匯率並顯示跑馬燈（會隱藏上面的文字）
                this.fetchAndDisplayRate();
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
                    badge.querySelector('.badge-tooltip').textContent = 'Test Mode';
                } else {
                    badge.querySelector('.badge-tooltip').textContent = level === 'orb' ? 'Orb Verified' : 'Verified Human';
                }

                // 綁定點擊事件打開排行榜（確保只綁定一次）
                if (!badge.dataset.leaderboardBound) {
                    badge.addEventListener('click', () => {
                        if (window.tokenomicsUI) {
                            window.tokenomicsUI.showLeaderboard();
                        }
                    });
                    badge.dataset.leaderboardBound = 'true';
                    console.log('🏆 排行榜點擊事件已綁定');
                }

                console.log('🔵 藍勾勾徽章已顯示');
            } else {
                badge.classList.add('hidden');
                badge.classList.remove('orb-verified', 'test-mode');
            }
        }
    }

    /**
     * 異步獲取 CPK/WLD 匯率並顯示 NASDAQ 風格跑馬燈
     */
    async fetchAndDisplayRate() {
        try {
            const apiBase = this.backendUrl || window.LOCAL_CONFIG?.BACKEND_URL || '';
            const response = await fetch(`${apiBase}/api/pool-status`);
            const data = await response.json();

            const ticker = document.getElementById('price-ticker');
            const tickerTrack = document.querySelector('.ticker-track');

            if (ticker && tickerTrack && data.success) {
                // 華爾街風格：1 CPK = ? WLD（使用小數點格式）
                const price = parseFloat(data.rateCPKtoWLD);
                const priceDisplay = price.toFixed(8);

                // 建立單一跑馬燈內容單元（重複多次填滿一半寬度）
                const singleUnit = `<span class="symbol">$CPK</span> <span class="price">${priceDisplay}</span> <span class="symbol">$WLD</span><span class="separator">•</span>`;

                // 建立兩份完全相同的內容（各 6 個單元），當滾動 50% 時會無縫銜接
                const halfContent = singleUnit.repeat(6);
                tickerTrack.innerHTML = `<span class="ticker-content">${halfContent}</span><span class="ticker-content">${halfContent}</span>`;

                // 顯示跑馬燈
                ticker.classList.remove('hidden');
            } else if (ticker) {
                ticker.classList.add('hidden');
            }
        } catch (error) {
            console.warn('Failed to fetch CPK rate:', error);
            const ticker = document.getElementById('price-ticker');
            if (ticker) {
                ticker.classList.add('hidden');
            }
        }
    }

    async verifyWorldID() {
        const verifyBtn = document.getElementById('verify-world-id-btn');

        // 調試信息收集
        const debugInfo = {
            hasMiniKit: typeof MiniKit !== 'undefined',
            miniKitKeys: typeof MiniKit !== 'undefined' ? Object.keys(MiniKit).join(',') : 'N/A',
            hasCommandsAsync: typeof MiniKit !== 'undefined' && !!MiniKit.commandsAsync,
            hasVerify: typeof MiniKit !== 'undefined' && !!MiniKit.commandsAsync?.verify,
            hasWorldApp: typeof window.WorldApp !== 'undefined',
            isWorldApp: this.isWorldApp,
            isMobile: this.isMobile
        };

        try {
            console.log('🔐 開始 World ID 驗證...');
            console.log('環境檢查:', debugInfo);

            if (verifyBtn) {
                verifyBtn.disabled = true;
                verifyBtn.textContent = 'Verifying...';
            }

            // 測試模式：模擬驗證成功
            if (this.testMode) {
                console.log('🧪 測試模式：模擬驗證');
                await this.simulateVerification();
                return;
            }

            // 🔥 v1.6.7 關鍵修正：只用 isInstalled() 判斷是否在 Mini App 環境
            // window.WorldApp 存在不代表是 Mini App（可能只是在 World App 瀏覽器中）
            const hasMiniKit = typeof MiniKit !== 'undefined';
            const mkInstalled = hasMiniKit && MiniKit.isInstalled?.();

            console.log('🔍 環境判斷:', {
                hasMiniKit,
                mkInstalled,
                isMobileBrowser: this.isMobileBrowser,
                isDesktopBrowser: this.isDesktopBrowser
            });

            // 只有當 isInstalled() = true 時才使用 MiniKit（真正的 Mini App 環境）
            if (mkInstalled) {
                console.log('🌍 MiniKit.isInstalled() = true，使用 MiniKit 驗證');
                if (verifyBtn) {
                    verifyBtn.textContent = 'Verifying...';
                }
                await this.verifyWithMiniKit();
                return;
            }

            // 不是 Mini App 環境，根據設備類型選擇 IDKit 或 IDKitSession
            if (this.isMobileBrowser) {
                // 手機瀏覽器：顯示提示，建議使用 World App
                console.log('📱 手機瀏覽器環境 - 使用 IDKitSession');
                await this.verifyOnMobileBrowser();
            } else {
                // 桌面瀏覽器：使用 IDKit（QR Code）
                console.log('🖥️ 使用 IDKit 驗證（桌面瀏覽器）');
                await this.verifyWithIDKit();
            }
        } catch (error) {
            console.error('❌ World ID 驗證錯誤:', error);
            console.error('錯誤堆疊:', error.stack);
            this.onVerificationFailed(error.message || 'Error during verification');

            // 恢復按鈕狀態
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = '🌍 Verify with World ID';
            }
        }
    }

    // 手機瀏覽器驗證處理 - 使用 IDKitSession API
    async verifyOnMobileBrowser() {
        const verifyBtn = document.getElementById('verify-world-id-btn');
        const self = this;

        // 檢查 IDKitSession 是否可用
        if (typeof window.IDKitSession === 'undefined') {
            console.log('⚠️ IDKitSession 不可用，使用 IDKit widget');
            await this.verifyWithIDKit();
            return;
        }

        console.log('📱 使用 IDKitSession API（手機瀏覽器優化）');

        try {
            // 1. 創建 Session
            console.log('🔄 創建驗證 Session...');
            await window.IDKitSession.create({
                app_id: this.appId,
                action: this.actionId,
                verification_level: 'orb'
                // 不使用 signal，API v2 會使用預設的空字串 hash
            });

            console.log('✅ Session 創建成功');

            // 2. 獲取 Session URI
            const sessionURI = window.IDKitSession.getURI();
            console.log('🔗 Session URI:', sessionURI);

            // 3. 顯示手機驗證 UI（帶有打開 World App 按鈕）
            await this.showMobileSessionUI(sessionURI);

        } catch (error) {
            console.error('❌ Session 創建失敗:', error);

            // 嘗試銷毀可能存在的舊 session
            try {
                window.IDKitSession.destroy();
            } catch (e) {}

            // 降級到 IDKit widget
            console.log('⚠️ 降級到 IDKit widget');
            await this.verifyWithIDKit();
        }
    }

    // 顯示手機 Session 驗證 UI
    async showMobileSessionUI(sessionURI) {
        const self = this;
        const verifyBtn = document.getElementById('verify-world-id-btn');

        return new Promise((resolve, reject) => {
            // 創建 overlay
            const overlay = document.createElement('div');
            overlay.id = 'mobile-session-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
                box-sizing: border-box;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: #1a1a2e;
                border-radius: 24px;
                padding: 30px;
                max-width: 350px;
                width: 100%;
                text-align: center;
                color: white;
            `;

            dialog.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px;">🌍</div>
                    <h3 style="margin: 0 0 10px; font-size: 1.3em;">World ID Verification</h3>
                    <p id="session-status" style="color: #aaa; margin: 0; font-size: 0.9em;">Tap the button below to open World App</p>
                </div>

                <a id="btn-open-worldapp-session" href="${sessionURI}" style="
                    display: block;
                    width: 100%;
                    padding: 16px;
                    margin-bottom: 15px;
                    border: none;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 1.05em;
                    font-weight: bold;
                    text-decoration: none;
                    text-align: center;
                    box-sizing: border-box;
                ">🚀 Open World App</a>

                <div id="polling-indicator" style="display: none; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #667eea;">
                        <div class="spinner" style="width: 20px; height: 20px; border: 2px solid rgba(102, 126, 234, 0.3); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <span>Waiting for verification...</span>
                    </div>
                </div>

                <button id="btn-cancel-session" style="
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.1);
                    color: #888;
                    font-size: 0.9em;
                    cursor: pointer;
                ">Cancel</button>

                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            let pollingInterval = null;
            let isCompleted = false;
            let isVerifying = false; // 防止重複調用後端驗證

            // 開始 Polling
            const startPolling = () => {
                const statusEl = document.getElementById('session-status');
                const pollingIndicator = document.getElementById('polling-indicator');

                if (pollingIndicator) {
                    pollingIndicator.style.display = 'block';
                }
                if (statusEl) {
                    statusEl.textContent = 'Please complete verification in World App...';
                }

                pollingInterval = setInterval(async () => {
                    if (isCompleted) return;

                    try {
                        const status = await window.IDKitSession.pollStatus();
                        console.log('📊 Polling 狀態:', status);

                        if (status.state === 'confirmed' && status.result) {
                            // 立即設置標記防止重複處理
                            if (isCompleted || isVerifying) return;
                            isVerifying = true;
                            isCompleted = true;
                            clearInterval(pollingInterval);

                            console.log('✅ 驗證確認！完整結果:', JSON.stringify(status.result, null, 2));
                            console.log('📋 result 的所有屬性:', Object.keys(status.result));

                            if (statusEl) {
                                statusEl.textContent = 'Verified! Processing...';
                                statusEl.style.color = '#4ade80';
                            }

                            // 向後端驗證 proof
                            // 注意：IDKitSession 返回的屬性名可能不同
                            const result = status.result;
                            const payload = {
                                proof: result.proof,
                                merkle_root: result.merkle_root || result.merkleRoot,
                                nullifier_hash: result.nullifier_hash || result.nullifierHash,
                                verification_level: result.verification_level || result.verificationLevel || 'orb'
                            };

                            console.log('📤 準備發送到後端的 payload:', JSON.stringify(payload, null, 2));

                            try {
                                const isValid = await self.verifyProofWithBackend(payload);

                                if (isValid) {
                                    self.isVerified = true;
                                    self.verificationLevel = result.verification_level || result.verificationLevel || 'orb';

                                    // 清理
                                    window.IDKitSession.destroy();
                                    overlay.remove();

                                    self.onVerificationSuccess(
                                        result.verification_level || result.verificationLevel || 'orb',
                                        result.nullifier_hash || result.nullifierHash
                                    );
                                    resolve();
                                } else {
                                    // 獲取具體錯誤訊息
                                    const errorMsg = self.lastBackendError || 'Backend verification failed';
                                    throw new Error(errorMsg);
                                }
                            } catch (backendError) {
                                console.error('❌ 後端驗證失敗:', backendError);
                                console.error('❌ 錯誤詳情:', backendError.message);
                                if (statusEl) {
                                    statusEl.textContent = 'Backend error: ' + (backendError.message || 'Unknown error');
                                    statusEl.style.color = '#f87171';
                                }
                                window.IDKitSession.destroy();
                                setTimeout(() => {
                                    overlay.remove();
                                    // 不要觸發降級流程，直接恢復按鈕
                                    const verifyBtn = document.getElementById('verify-world-id-btn');
                                    if (verifyBtn) {
                                        verifyBtn.disabled = false;
                                        verifyBtn.textContent = '🌍 Verify with World ID';
                                    }
                                    resolve(); // 用 resolve 而不是 reject，避免觸發降級
                                }, 3000);
                            }
                        } else if (status.state === 'failed') {
                            isCompleted = true;
                            clearInterval(pollingInterval);

                            console.log('❌ 驗證失敗:', status.errorCode);
                            if (statusEl) {
                                statusEl.textContent = 'Verification failed: ' + (status.errorCode || 'Unknown error');
                                statusEl.style.color = '#f87171';
                            }

                            window.IDKitSession.destroy();
                            setTimeout(() => {
                                overlay.remove();
                                self.onVerificationFailed(status.errorCode || 'Verification failed');
                                reject(new Error(status.errorCode || '驗證失敗'));
                            }, 2000);
                        }
                    } catch (pollError) {
                        console.error('Polling 錯誤:', pollError);
                    }
                }, 2000); // 每 2 秒輪詢一次
            };

            // 點擊開啟 World App 時開始 polling
            document.getElementById('btn-open-worldapp-session').addEventListener('click', () => {
                console.log('🚀 開啟 World App，開始 polling...');
                startPolling();
            });

            // 取消按鈕
            document.getElementById('btn-cancel-session').onclick = () => {
                isCompleted = true;
                if (pollingInterval) clearInterval(pollingInterval);

                try {
                    window.IDKitSession.destroy();
                } catch (e) {}

                overlay.remove();

                if (verifyBtn) {
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = '🌍 Verify with World ID';
                }
                resolve();
            };

            // 頁面可見性變化時重新啟動 polling（用戶從 World App 回來）
            const handleVisibilityChange = async () => {
                if (document.visibilityState === 'visible' && !isCompleted) {
                    console.log('📱 頁面重新可見，立即檢查驗證狀態...');
                    console.log('📱 Session isActive:', window.IDKitSession.isActive);

                    // 立即執行一次 pollStatus（不等待 interval）
                    if (window.IDKitSession.isActive) {
                        try {
                            const status = await window.IDKitSession.pollStatus();
                            console.log('📱 回來後的狀態:', JSON.stringify(status, null, 2));

                            // 手動處理狀態（檢查 isVerifying 防止重複調用後端）
                            if (status.state === 'confirmed' && status.result && !isCompleted && !isVerifying) {
                                isVerifying = true;
                                isCompleted = true;
                                if (pollingInterval) clearInterval(pollingInterval);

                                console.log('✅ 回來後驗證確認！');
                                const statusEl = document.getElementById('session-status');
                                if (statusEl) {
                                    statusEl.textContent = 'Verified! Processing...';
                                    statusEl.style.color = '#4ade80';
                                }

                                const result = status.result;
                                const payload = {
                                    proof: result.proof,
                                    merkle_root: result.merkle_root || result.merkleRoot,
                                    nullifier_hash: result.nullifier_hash || result.nullifierHash,
                                    verification_level: result.verification_level || result.verificationLevel || 'orb'
                                };

                                console.log('📤 payload:', JSON.stringify(payload, null, 2));

                                const isValid = await self.verifyProofWithBackend(payload);
                                if (isValid) {
                                    self.isVerified = true;
                                    self.verificationLevel = payload.verification_level;
                                    window.IDKitSession.destroy();
                                    overlay.remove();
                                    self.onVerificationSuccess(payload.verification_level, payload.nullifier_hash);
                                    resolve();
                                } else {
                                    const errorMsg = self.lastBackendError || 'Backend verification failed';
                                    if (statusEl) {
                                        statusEl.textContent = '錯誤: ' + errorMsg;
                                        statusEl.style.color = '#f87171';
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('📱 回來後 poll 錯誤:', e);
                        }
                    } else {
                        console.log('⚠️ Session 已不活躍');
                    }
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);

            // 清理監聽器（當 overlay 被移除時）
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        if (node === overlay) {
                            document.removeEventListener('visibilitychange', handleVisibilityChange);
                            observer.disconnect();
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true });
        });
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
                <h3 style="margin-bottom: 15px; font-size: 1.3em;">📱 Mobile Verification</h3>
                <p style="color: #aaa; margin-bottom: 25px; font-size: 0.95em;">
                    We recommend using World App for the best experience.
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
                ">🌍 Open World App</button>
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
                ">Try browser verification</button>
                <button id="btn-cancel" style="
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 12px;
                    background: transparent;
                    color: #888;
                    font-size: 0.85em;
                    cursor: pointer;
                ">Cancel</button>
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

        // 生成符合格式的測試 nullifierHash (0x + 64 hex chars)
        // 後端要求格式：/^0x[a-fA-F0-9]{64}$/
        const timestamp = Date.now().toString(16).padStart(16, '0');
        const testNullifier = '0x' + 'deadbeef'.repeat(6) + timestamp;

        this.onVerificationSuccess('orb', testNullifier, true);

        console.log('✅ 測試驗證完成, nullifier:', testNullifier);
    }

    async verifyWithMiniKit() {
        console.log('📱 使用 MiniKit 驗證（World App）');

        // 檢查 MiniKit 是否可用
        if (typeof MiniKit === 'undefined') {
            console.error('❌ MiniKit 未定義');
            throw new Error('MiniKit 不可用');
        }

        // 確保 MiniKit 已初始化
        if (typeof MiniKit.install === 'function' && !MiniKit.isInstalled?.()) {
            console.log('🔧 MiniKit 未初始化，嘗試調用 install()...');
            try {
                MiniKit.install();
                console.log('✅ MiniKit.install() 調用成功');
                // 等待一下讓初始化完成
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.error('❌ MiniKit.install() 失敗:', e);
            }
        }

        console.log('📊 MiniKit 狀態:', {
            isInstalled: MiniKit.isInstalled?.(),
            hasCommandsAsync: !!MiniKit.commandsAsync,
            hasVerify: !!MiniKit.commandsAsync?.verify,
            availableKeys: Object.keys(MiniKit).slice(0, 10)
        });

        if (!MiniKit.commandsAsync || !MiniKit.commandsAsync.verify) {
            console.error('❌ MiniKit.commandsAsync.verify 不存在');
            console.log('可用的 MiniKit 方法:', Object.keys(MiniKit));
            throw new Error('MiniKit.commandsAsync.verify 不可用');
        }

        // 準備驗證參數（不傳 signal，API v2 會使用空字串的 hash）
        const verifyPayload = {
            action: this.actionId,
            verification_level: 'orb'
        };

        console.log('📋 驗證參數:', {
            action: this.actionId,
            verification_level: 'orb'
        });

        console.log('🚀 調用 MiniKit.commandsAsync.verify...');
        console.log('🎯 這應該會在 World App 內滑出 Approve 驗證抽屜');

        // 更新按鈕狀態
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            verifyBtn.textContent = getText('verify.waiting', '⏳ Waiting...');
        }

        try {
            // 使用 MiniKit 進行 World ID 驗證
            // 這個調用會觸發 World App 顯示原生的 Approve 驗證抽屜
            console.log('⏳ 正在等待 MiniKit.commandsAsync.verify() 返回...');
            console.log('📊 verify 前狀態:', {
                isInstalled: MiniKit.isInstalled?.(),
                hasWorldApp: typeof window.WorldApp !== 'undefined'
            });

            // 添加 timeout 防止無限等待（30 秒）
            const verifyPromise = MiniKit.commandsAsync.verify(verifyPayload);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('verify() 超時 - 30秒內沒有回應。可能原因：1) 請確保透過 QR Code 或深度連結開啟 Mini App 2) 檢查 Developer Portal 設定')), 30000);
            });

            const result = await Promise.race([verifyPromise, timeoutPromise]);

            if (verifyBtn) {
                verifyBtn.textContent = getText('verify.processing', '✅ Verified, processing...');
            }

            console.log('📦 收到完整回應:', result);
            console.log('📦 result 類型:', typeof result);
            console.log('📦 result keys:', result ? Object.keys(result) : 'null');
            
            const { finalPayload } = result;
            
            console.log('📦 finalPayload:', finalPayload);
            
            if (!finalPayload) {
                console.error('❌ finalPayload 為空');
                throw new Error('Empty verification response');
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
                    throw new Error('Backend verification failed');
                }
            } else if (finalPayload.status === 'error') {
                console.error('❌ World ID 驗證失敗:', finalPayload);
                this.onVerificationFailed(finalPayload.error_code || 'Verification failed, please try again');
            } else {
                console.warn('⚠️ 未知狀態:', finalPayload);
                this.onVerificationFailed('Error during verification');
            }
        } catch (error) {
            console.error('💥 MiniKit.commandsAsync.verify 調用失敗:', error);
            console.error('錯誤詳情:', error.message, error.stack);

            // 在按鈕上顯示錯誤
            const verifyBtn = document.getElementById('verify-world-id-btn');
            if (verifyBtn) {
                verifyBtn.textContent = `❌ 錯誤: ${error.message?.substring(0, 20) || 'unknown'}`;
            }

            throw error;
        }
    }

    async verifyWithIDKit() {
        console.log('🌐 使用 IDKit 驗證（網頁瀏覽器）');

        // 如果還沒預載入完成，快速等待一下
        if (typeof window.IDKit === 'undefined') {
            console.log('⏳ IDKit 尚未載入，等待中...');
            let retries = 0;
            while (typeof window.IDKit === 'undefined' && retries < 30) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }
        }

        if (typeof window.IDKit === 'undefined') {
            console.error('❌ IDKit 未找到，請檢查 CDN 是否加載');
            throw new Error('IDKit not loaded, please refresh');
        }

        console.log('✅ IDKit 已就緒');

        // 不使用 signal，因為 API v2 需要 signal_hash 而非 signal
        // 不傳 signal 時，API 會使用空字串的 hash
        const self = this;
        
        try {
            console.log('📱 初始化 IDKit...');
            console.log('配置參數:', {
                app_id: this.appId,
                action: this.actionId,
                verification_level: 'orb'
            });

            // 使用 IDKit.init() 和 IDKit.open() - 參考官方文檔
            // https://docs.world.org/world-id/reference/idkit#idkit-standalone
            // 注意：不使用 signal，因為 API v2 需要 signal_hash
            window.IDKit.init({
                app_id: this.appId,
                action: this.actionId,
                verification_level: 'orb',
                // handleVerify 用於後端驗證（在用戶看到成功畫面前）
                handleVerify: async (result) => {
                    console.log('🔄 handleVerify 被調用:', result);

                    // 構造 payload（不包含 signal，因為 API v2 使用 signal_hash）
                    const payload = {
                        proof: result.proof,
                        merkle_root: result.merkle_root,
                        nullifier_hash: result.nullifier_hash,
                        verification_level: result.verification_level
                    };
                    
                    console.log('📤 向後端驗證 proof...');
                    
                    // 向後端驗證，如果驗證失敗會拋出錯誤
                    const isValid = await self.verifyProofWithBackend(payload);
                    
                    if (!isValid) {
                        throw new Error('Backend verification failed');
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
                        action: this.actionId
                        // 不傳 signal，API v2 會使用默認的空字串 hash
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
                const response = await fetch(`https://developer.worldcoin.org/api/v2/verify/${this.appId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        proof: payload.proof,
                        merkle_root: payload.merkle_root,
                        nullifier_hash: payload.nullifier_hash,
                        verification_level: payload.verification_level,
                        action: this.actionId
                        // 不傳 signal，API v2 會使用默認的空字串 hash
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
        console.log('🔍 驗證來源診斷:', {
            isTestMode,
            testModeFromUrl: new URLSearchParams(window.location.search).get('test') === '1',
            thisTestMode: this.testMode,
            url: window.location.href,
            nullifierHashPrefix: nullifierHash?.substring(0, 16)
        });

        this.isVerified = true;
        this.verificationLevel = level;
        this.nullifierHash = nullifierHash;

        // 更新驗證狀態顯示（包含藍勾勾徽章和用戶 ID）
        this.updateVerificationStatus(true, level, isTestMode, nullifierHash);

        // 隱藏驗證按鈕
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            verifyBtn.style.display = 'none';
        }

        // 如果不是測試模式，發送成功震動
        if (!isTestMode) {
            this.sendHapticFeedback('success');
        }

        // Token-nomics: 初始化 Token UI
        if (window.tokenomicsUI && nullifierHash) {
            window.tokenomicsUI.init(nullifierHash);
            console.log('🪙 TokenomicsUI 已初始化');
        }
    }

    onVerificationFailed(message) {
        console.error('❌ 驗證失敗:', message);
        
        const verifyBtn = document.getElementById('verify-world-id-btn');
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.textContent = '🌍 Verify with World ID';
        }
        
        // 顯示更詳細的錯誤訊息
        const errorMsg = `Verification failed: ${message}\n\nPlease make sure you have set up World ID.`;
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
            const level = window.parkingGame?.level || '1';
            const gameUrl = 'https://jijian-car-parking.vercel.app';

            // 構建分享文本
            const shareText = window.i18n?.t('share.text') ||
                `🚗 極簡停車 | 第 ${level} 關 | 分數 ${score}\n來挑戰我吧！`;

            // 顯示分享選項菜單
            this.showShareMenu(shareText, gameUrl, score, level);

        } catch (error) {
            console.error('分享失敗:', error);
        }
    }

    // 顯示分享選項菜單
    showShareMenu(shareText, gameUrl, score, level) {
        // 移除已存在的菜單
        document.getElementById('share-menu')?.remove();

        const menu = document.createElement('div');
        menu.id = 'share-menu';
        menu.className = 'share-menu';
        menu.innerHTML = `
            <div class="share-menu-content">
                <div class="share-menu-header">
                    <h3>${window.i18n?.t('share.title') || '分享成績'}</h3>
                    <button id="close-share-menu" class="close-btn">×</button>
                </div>
                <div class="share-options">
                    <button class="share-option" data-platform="x">
                        <span class="share-icon">𝕏</span>
                        <span>X (Twitter)</span>
                    </button>
                    <button class="share-option" data-platform="copy">
                        <span class="share-icon">📋</span>
                        <span>${window.i18n?.t('share.copy') || '複製連結'}</span>
                    </button>
                    ${navigator.share ? `
                    <button class="share-option" data-platform="native">
                        <span class="share-icon">📤</span>
                        <span>${window.i18n?.t('share.more') || '更多選項'}</span>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(menu);

        // 綁定事件
        document.getElementById('close-share-menu')?.addEventListener('click', () => {
            menu.remove();
        });

        // 點擊背景關閉
        menu.addEventListener('click', (e) => {
            if (e.target === menu) menu.remove();
        });

        // 分享選項點擊
        menu.querySelectorAll('.share-option').forEach(btn => {
            btn.addEventListener('click', async () => {
                const platform = btn.dataset.platform;

                if (platform === 'x') {
                    // 分享到 X (Twitter)
                    const tweetText = encodeURIComponent(`🚗 極簡停車 | Lv.${level} | ${score}分\n來挑戰我！\n${gameUrl}`);
                    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
                    this.sendHapticFeedback('medium');
                } else if (platform === 'copy') {
                    // 複製到剪貼板
                    const fullText = `🚗 極簡停車 | Lv.${level} | ${score}分\n來挑戰我！\n${gameUrl}`;
                    await navigator.clipboard.writeText(fullText);
                    this.showCopyToast();
                    this.sendHapticFeedback('light');
                } else if (platform === 'native') {
                    // 使用原生分享
                    try {
                        await navigator.share({
                            title: '極簡停車 🚗',
                            text: `極簡停車 | Lv.${level} | ${score}分\n來挑戰我！`,
                            url: gameUrl,
                        });
                        this.sendHapticFeedback('medium');
                    } catch (e) {
                        console.log('分享取消或失敗');
                    }
                }

                menu.remove();
            });
        });
    }

    // 顯示複製成功提示
    showCopyToast() {
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = window.i18n?.t('share.copied') || '已複製！';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
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

