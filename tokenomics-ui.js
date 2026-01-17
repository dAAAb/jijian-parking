// tokenomics-ui.js - Token 經濟 UI 模組
// v1.0.0

class TokenomicsUI {
  constructor() {
    this.userState = null;
    this.nullifierHash = null;
    this.isInitialized = false;
    this.isVisible = false;

    // 後端 API 基礎 URL
    this.apiBase = window.LOCAL_CONFIG?.BACKEND_URL || '';

    // 收款地址（接收 WLD 支付）
    this.treasuryAddress = window.LOCAL_CONFIG?.TREASURY_ADDRESS || '';

    // 降速配置
    this.slowdownConfig = {
      single: { cost: 1, percent: 20 },
      l1_badge: { cost: 10, percent: 20, duration: '3 天' },
      l2_badge: { cost: 15, percent: 40, duration: '3 天' },
      l2_temp: { threshold: 3, percent: 40 },
      l3_badge: { cost: 30, percent: 80, duration: '3 天' }
    };
  }

  // 初始化（在 World ID 驗證成功後調用）
  async init(nullifierHash) {
    if (this.isInitialized) {
      console.log('TokenomicsUI already initialized');
      return;
    }

    this.nullifierHash = nullifierHash;
    console.log('TokenomicsUI initializing...');

    await this.fetchUserState();
    this.renderUI();
    this.setupEventListeners();
    this.isInitialized = true;

    console.log('TokenomicsUI initialized');
  }

  // 獲取用戶狀態
  async fetchUserState() {
    try {
      const response = await fetch(
        `${this.apiBase}/api/user-state?nullifier_hash=${this.nullifierHash}`
      );
      const data = await response.json();

      if (data.success) {
        this.userState = data.user;
        this.speedMultiplier = data.speed_multiplier;
        this.effectiveSlowdown = data.effective_slowdown;

        // 通知遊戲更新速度
        this.notifyGameSpeedChange();
      } else {
        console.error('Failed to fetch user state:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch user state:', error);
    }
  }

  // 渲染 UI
  renderUI() {
    // 檢查元素是否已存在，避免重複創建
    if (document.getElementById('token-panel')) {
      this.updateUI();
      return;
    }

    // 創建 Token 面板容器
    const panel = document.createElement('div');
    panel.id = 'token-panel';
    panel.className = 'token-panel hidden';
    panel.innerHTML = `
      <div class="token-header">
        <div class="cpk-balance">
          <span class="token-icon">🪙</span>
          <span id="cpk-pending">0</span> <span class="token-symbol">CPK</span>
        </div>
        <button id="claim-btn" class="claim-btn" disabled data-i18n="btn.claim">
          ${window.i18n?.t('btn.claim') || 'Claim'}
        </button>
      </div>

      <div class="slowdown-section">
        <div class="slowdown-indicator">
          <span>🐢 <span data-i18n="ui.slowdown">${window.i18n?.t('ui.slowdown') || 'Slowdown'}</span></span>
          <span id="slowdown-percent" class="slowdown-value">0%</span>
        </div>

        <div class="slowdown-actions">
          <button id="buy-single" class="slowdown-btn">
            ⏬ 1 WLD (-20%)
          </button>
        </div>
      </div>

      <div class="promo-hint">
        🎁 <span data-i18n="ui.promoHint">${window.i18n?.t('ui.promoHint') || 'Promo: 50% $CPK cashback on purchases!'}</span>
      </div>

      <div class="badge-section">
        <button id="buy-l1" class="badge-btn l1">
          🥉 L1<br>
          <small>10 WLD | -20% | 3hr</small>
        </button>
        <button id="buy-l2" class="badge-btn l2">
          🥈 L2<br>
          <small>15 WLD | -40% | 3hr</small>
        </button>
        <button id="buy-l3" class="badge-btn l3">
          🥇 L3<br>
          <small>30 WLD | -80% | 3hr</small>
        </button>
      </div>

      <div class="feature-hint">
        <small>🐢 <span data-i18n="ui.slowdownHint">${window.i18n?.t('ui.slowdownHint') || 'Slowdown makes your car slower, easier to park'}</span></small>
      </div>

      <div id="badge-status" class="badge-status"></div>

      <button id="close-token-panel" class="close-panel-btn">×</button>
    `;

    document.body.appendChild(panel);

    // 創建觸發按鈕（在遊戲畫面上）
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'token-trigger-btn';
    triggerBtn.className = 'token-trigger-btn';
    triggerBtn.innerHTML = '🪙 <span id="cpk-mini">0</span>';
    document.body.appendChild(triggerBtn);

    this.updateUI();
  }

  // 更新 UI 顯示
  updateUI() {
    if (!this.userState) return;

    // 更新 CPK 餘額
    const cpkPending = this.userState.cpk_pending || 0;
    const cpkDisplay = document.getElementById('cpk-pending');
    const cpkMini = document.getElementById('cpk-mini');

    if (cpkDisplay) cpkDisplay.textContent = cpkPending.toLocaleString();
    if (cpkMini) cpkMini.textContent = this.formatNumber(cpkPending);

    // 更新領取按鈕狀態
    const claimBtn = document.getElementById('claim-btn');
    if (claimBtn) {
      claimBtn.disabled = cpkPending < 100; // 最低 100 CPK 才能領取
    }

    // 更新降速百分比
    const slowdownDisplay = document.getElementById('slowdown-percent');
    if (slowdownDisplay) {
      slowdownDisplay.textContent = `${this.effectiveSlowdown || 0}%`;

      // 根據降速程度改變顏色
      if (this.effectiveSlowdown >= 60) {
        slowdownDisplay.style.color = '#ffd700';
      } else if (this.effectiveSlowdown >= 30) {
        slowdownDisplay.style.color = '#4ade80';
      } else {
        slowdownDisplay.style.color = '#888';
      }
    }

    // 更新徽章狀態
    this.updateBadgeStatus();
  }

  // 更新 CPK 餘額顯示（供外部調用，如復活功能）
  updateCPKDisplay(newAmount) {
    if (this.userState) {
      this.userState.cpk_pending = newAmount;
    }

    const cpkDisplay = document.getElementById('cpk-pending');
    const cpkMini = document.getElementById('cpk-mini');

    if (cpkDisplay) cpkDisplay.textContent = newAmount.toLocaleString();
    if (cpkMini) cpkMini.textContent = this.formatNumber(newAmount);

    // 更新領取按鈕狀態
    const claimBtn = document.getElementById('claim-btn');
    if (claimBtn) {
      claimBtn.disabled = newAmount < 100;
    }
  }

  // 獲取當前 CPK 餘額（供外部檢查）
  get cpkPending() {
    return this.userState?.cpk_pending || 0;
  }

  // 更新徽章狀態顯示
  updateBadgeStatus() {
    const statusEl = document.getElementById('badge-status');
    if (!statusEl || !this.userState) return;

    const badges = [];
    const now = Date.now();

    // L1 徽章
    if (this.userState.badges?.l1?.active &&
        this.userState.badges.l1.expires_at > now) {
      const remaining = this.formatTimeRemaining(this.userState.badges.l1.expires_at);
      badges.push(`🥉 L1 (${remaining})`);
    }

    // L2 徽章（購買的）
    if (this.userState.badges?.l2?.active &&
        this.userState.badges.l2.expires_at > now) {
      const remaining = this.formatTimeRemaining(this.userState.badges.l2.expires_at);
      badges.push(`🥈 L2 (${remaining})`);
    }

    // L2 臨時徽章（累計解鎖的）
    if (this.userState.current_session?.l2_temp_active) {
      badges.push(`⚡ L2 ${window.i18n?.t('ui.tempBadge') || 'Temp'}`);
    }

    // L3 徽章
    if (this.userState.badges?.l3?.active &&
        this.userState.badges.l3.expires_at > now) {
      const remaining = this.formatTimeRemaining(this.userState.badges.l3.expires_at);
      badges.push(`🥇 L3 (${remaining})`);
    }

    // 單次降速
    const singleSlowdowns = this.userState.current_session?.single_slowdowns || 0;
    if (singleSlowdowns > 0) {
      badges.push(`⚡×${singleSlowdowns}`);
    }

    statusEl.textContent = badges.length > 0 ? badges.join(' | ') : (window.i18n?.t('ui.noActiveEffects') || 'No active effects');
  }

  // 設置事件監聽
  setupEventListeners() {
    // 觸發按鈕
    document.getElementById('token-trigger-btn')?.addEventListener('click', () => {
      this.togglePanel();
    });

    // 關閉按鈕
    document.getElementById('close-token-panel')?.addEventListener('click', () => {
      this.hidePanel();
    });

    // 領取按鈕
    document.getElementById('claim-btn')?.addEventListener('click', () => {
      this.claimRewards();
    });

    // 購買單次降速
    document.getElementById('buy-single')?.addEventListener('click', () => {
      this.purchaseSlowdown('single', 1);
    });

    // 購買 L1 徽章
    document.getElementById('buy-l1')?.addEventListener('click', () => {
      this.purchaseSlowdown('l1_badge', 10);
    });

    // 購買 L2 徽章
    document.getElementById('buy-l2')?.addEventListener('click', () => {
      this.purchaseSlowdown('l2_badge', 15);
    });

    // 購買 L3 徽章
    document.getElementById('buy-l3')?.addEventListener('click', () => {
      this.purchaseSlowdown('l3_badge', 30);
    });
  }

  // 切換面板顯示
  togglePanel() {
    const panel = document.getElementById('token-panel');
    if (panel) {
      panel.classList.toggle('hidden');
      this.isVisible = !panel.classList.contains('hidden');
    }
  }

  // 隱藏面板
  hidePanel() {
    const panel = document.getElementById('token-panel');
    if (panel) {
      panel.classList.add('hidden');
      this.isVisible = false;
    }
  }

  // 顯示面板
  showPanel() {
    const panel = document.getElementById('token-panel');
    if (panel) {
      panel.classList.remove('hidden');
      this.isVisible = true;
    }
  }

  // 購買降速功能
  async purchaseSlowdown(type, wldAmount) {
    try {
      // 檢查是否在 World App 環境
      if (!window.MiniKit?.isInstalled?.()) {
        this.showToast(window.i18n?.t('purchase.useWorldApp') || 'Please use World App for payment');
        return;
      }

      // 生成唯一 reference
      const reference = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.showToast(window.i18n?.t('purchase.initiating') || 'Initiating payment...');

      // 使用 MiniKit 發起支付
      // WLD 使用 18 位小數，token_amount 需要是最小單位的字符串
      const tokenAmountWei = BigInt(wldAmount) * BigInt(10 ** 18);

      const { finalPayload } = await MiniKit.commandsAsync.pay({
        reference: reference,
        to: this.treasuryAddress,
        tokens: [
          {
            symbol: 'WLD',
            token_amount: tokenAmountWei.toString()
          }
        ],
        description: `Minimal Parking - ${this.getPurchaseDescription(type)}`
      });

      if (finalPayload.status === 'success') {
        this.showToast(window.i18n?.t('purchase.processing') || 'Payment successful, processing...');

        // 向後端驗證並處理購買
        const response = await fetch(`${this.apiBase}/api/purchase-slowdown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nullifier_hash: this.nullifierHash,
            purchase_type: type,
            transaction_id: finalPayload.transaction_id,
            reference: reference
          })
        });

        const result = await response.json();

        if (result.success) {
          // 更新本地狀態
          this.userState = {
            ...this.userState,
            cpk_pending: result.cpk_pending_total,
            current_session: {
              ...this.userState.current_session,
              l2_temp_active: result.l2_temp_active
            },
            badges: result.badges
          };
          this.speedMultiplier = result.speed_multiplier;
          this.effectiveSlowdown = result.effective_slowdown;

          this.updateUI();
          this.notifyGameSpeedChange();

          // 顯示成功提示
          const cashbackText = window.i18n?.t('purchase.cashback') || 'CPK cashback';
          this.showToast(`✅ ${result.message}\n+${result.cpk_cashback} ${cashbackText}`);

          // 震動反饋
          if (window.worldMiniKit?.sendHapticFeedback) {
            window.worldMiniKit.sendHapticFeedback('success');
          }
        } else {
          this.showToast(`❌ ${result.error || (window.i18n?.t('purchase.failed') || 'Purchase failed')}`);
        }
      } else {
        this.showToast(window.i18n?.t('purchase.cancelled') || 'Payment cancelled');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      this.showToast(window.i18n?.t('purchase.error') || 'Purchase failed, please retry');
    }
  }

  // 領取 CPK 獎勵
  async claimRewards() {
    try {
      let walletAddress = this.userState?.wallet_address;

      // 如果沒有錢包地址，嘗試獲取
      if (!walletAddress && window.MiniKit?.isInstalled?.()) {
        this.showToast(window.i18n?.t('claim.gettingWallet') || 'Getting wallet address...');

        try {
          const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
            nonce: Math.random().toString(36).substr(2, 15)
          });

          if (finalPayload.status === 'success') {
            walletAddress = finalPayload.address;
          }
        } catch (e) {
          console.error('Failed to get wallet address:', e);
        }
      }

      if (!walletAddress) {
        this.showToast(window.i18n?.t('claim.connectWallet') || 'Please connect wallet first');
        return;
      }

      // 顯示等待確認提示
      this.showClaimingOverlay(true);

      const response = await fetch(`${this.apiBase}/api/claim-rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nullifier_hash: this.nullifierHash,
          wallet_address: walletAddress
        })
      });

      // 隱藏等待確認提示
      this.showClaimingOverlay(false);

      const result = await response.json();

      if (result.success) {
        this.userState.cpk_pending = result.cpk_remaining || 0;
        this.userState.cpk_claimed_total = result.cpk_claimed_total;
        this.userState.wallet_address = walletAddress;

        this.updateUI();

        // 顯示領取成功及每日限制資訊
        const claimedText = window.i18n?.t('claim.success') || 'Successfully claimed';
        let message = `✅ ${claimedText} ${result.cpk_claimed.toLocaleString()} CPK!`;
        if (result.cpk_remaining > 0) {
          const remainingText = window.i18n?.t('claim.remaining') || 'Remaining';
          message += `\n📊 ${remainingText}: ${result.cpk_remaining.toLocaleString()} CPK`;
          if (result.daily_remaining > 0) {
            const dailyRemainingText = window.i18n?.t('claim.dailyRemaining') || 'Today can claim';
            message += `\n📅 ${dailyRemainingText}: ${result.daily_remaining.toLocaleString()} CPK`;
          } else {
            const dailyLimitText = window.i18n?.t('claim.dailyLimitReached') || 'Daily limit reached, come back tomorrow!';
            message += `\n📅 ${dailyLimitText}`;
          }
        }

        this.showToast(message);

        if (window.worldMiniKit?.sendHapticFeedback) {
          window.worldMiniKit.sendHapticFeedback('success');
        }

        // 顯示評分提醒（首次 claim 成功後）
        this.showRatingPrompt();
      } else {
        // 處理每日限制已達的情況
        if (result.error_code === 'DAILY_LIMIT_REACHED') {
          const dailyLimitText = window.i18n?.t('claim.dailyLimitReachedFull') || 'Daily limit reached';
          const canClaimText = window.i18n?.t('claim.canClaimTomorrow') || 'Can claim tomorrow';
          this.showToast(`⏰ ${dailyLimitText}\n📅 ${canClaimText}: ${result.daily_limit} CPK`);
        } else {
          this.showToast(`❌ ${result.error || (window.i18n?.t('claim.failed') || 'Claim failed')}`);
        }
      }
    } catch (error) {
      console.error('Claim failed:', error);
      this.showToast(window.i18n?.t('claim.error') || 'Claim failed, please retry');
    }
  }

  // 過關時新增獎勵
  async addReward(score, level, isPerfectBonus = false) {
    console.log('🎮 addReward called:', { score, level, isPerfectBonus, nullifierHash: this.nullifierHash?.substring(0, 10) });

    if (!this.nullifierHash) {
      console.warn('⚠️ addReward: nullifierHash is empty, skipping');
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/api/add-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nullifier_hash: this.nullifierHash,
          score: score,
          level: level,
          is_perfect_bonus: isPerfectBonus
        })
      });

      const result = await response.json();
      console.log('🎮 addReward response:', result);

      if (result.success) {
        this.userState.cpk_pending = result.cpk_pending_total;
        this.updateUI();

        // 顯示獲得的 CPK（完美停車獎勵有特別提示）
        if (isPerfectBonus) {
          this.showPerfectBonusPopup(result.cpk_earned);
        } else {
          this.showRewardPopup(result.cpk_earned);
        }
        console.log('✅ CPK reward added:', result.cpk_earned, isPerfectBonus ? '(Perfect Bonus!)' : '');
      } else {
        console.error('❌ addReward failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Failed to add reward:', error);
    }
  }

  // 顯示完美停車獎勵彈出效果
  showPerfectBonusPopup(cpkEarned) {
    const popup = document.createElement('div');
    popup.className = 'reward-popup perfect-bonus';
    popup.innerHTML = `
      <span class="reward-icon">🎯</span>
      <span class="reward-amount">+${cpkEarned}</span>
      <span class="reward-label">CPK</span>
      <span class="perfect-text">${window.i18n?.t('complete.perfect') || '完美停車'}</span>
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 2500);
  }

  // 死亡時重置當局狀態
  async resetSession() {
    if (!this.nullifierHash) return;

    try {
      const response = await fetch(`${this.apiBase}/api/session-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nullifier_hash: this.nullifierHash
        })
      });

      const result = await response.json();

      if (result.success) {
        this.speedMultiplier = result.speed_multiplier;
        this.effectiveSlowdown = result.effective_slowdown;

        // 重置本地狀態
        this.userState.current_session = {
          single_slowdowns: 0,
          single_slowdown_percent: 0,
          wld_spent_this_session: 0,
          l2_temp_active: false,
          session_start: Date.now()
        };
        this.userState.badges = result.badges;

        this.updateUI();
        this.notifyGameSpeedChange();

        // 如果有損失降速效果，顯示提示
        if (result.slowdowns_lost > 0) {
          const resetText = window.i18n?.t('session.slowdownsReset') || 'Slowdowns reset';
          const lostText = window.i18n?.t('session.lost') || 'lost';
          this.showToast(`${resetText} (${lostText} ${result.slowdowns_lost})`);
        }
      }
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  }

  // 通知遊戲更新速度
  notifyGameSpeedChange() {
    if (window.parkingGame?.updateSpeedFromTokenomics) {
      window.parkingGame.updateSpeedFromTokenomics(this.speedMultiplier || 1);
    }
  }

  // 獲取購買描述
  getPurchaseDescription(type) {
    switch (type) {
      case 'single': return window.i18n?.t('purchase.desc.single') || 'Single Slowdown (-20%)';
      case 'l1_badge': return window.i18n?.t('purchase.desc.l1') || 'L1 Badge (3hr)';
      case 'l2_badge': return window.i18n?.t('purchase.desc.l2') || 'L2 Badge (3hr)';
      case 'l3_badge': return window.i18n?.t('purchase.desc.l3') || 'L3 Badge (3hr)';
      default: return window.i18n?.t('purchase.desc.default') || 'Purchase';
    }
  }

  // 格式化剩餘時間
  formatTimeRemaining(expiresAt) {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return window.i18n?.t('time.expired') || 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    const hourText = window.i18n?.t('time.hour') || 'h';
    const minText = window.i18n?.t('time.min') || 'm';

    if (hours > 0) {
      return `${hours}${hourText}${minutes}${minText}`;
    }
    return `${minutes}${minText}`;
  }

  // 獲取徽章圖標（用於排行榜顯示）
  getBadgeIcon(badgeType) {
    if (!badgeType) return '';

    switch (badgeType) {
      case 'l1': return ' <span class="badge-icon l1" title="L1">🥉</span>';
      case 'l2': return ' <span class="badge-icon l2" title="L2">🥈</span>';
      case 'l3': return ' <span class="badge-icon l3" title="L3">🥇</span>';
      default: return '';
    }
  }

  // 格式化數字
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // 顯示 Toast 提示
  showToast(message) {
    // 移除現有的 toast
    document.querySelectorAll('.token-toast').forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = 'token-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  // 顯示/隱藏領取等待確認提示
  showClaimingOverlay(show) {
    let overlay = document.getElementById('claiming-overlay');

    if (show) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'claiming-overlay';
        overlay.className = 'claiming-overlay';
        overlay.innerHTML = `
          <div class="claiming-content">
            <div class="claiming-spinner"></div>
            <div class="claiming-text">${window.i18n?.t('ui.claimingWait') || '確認中，請稍候...'}</div>
          </div>
        `;
        document.body.appendChild(overlay);
      }
      overlay.classList.remove('hidden');
    } else {
      if (overlay) {
        overlay.classList.add('hidden');
      }
    }
  }

  // 顯示評分提醒彈窗
  showRatingPrompt() {
    // 檢查是否已經顯示過（用 localStorage 追蹤）
    const hasShownRating = localStorage.getItem('cpk_rating_shown');
    if (hasShownRating) {
      return;
    }

    // 延遲一點顯示，讓 claim 成功的 toast 先消失
    setTimeout(() => {
      const overlay = document.createElement('div');
      overlay.id = 'rating-overlay';
      overlay.className = 'rating-overlay';

      const title = window.i18n?.t('rating.title') || 'Enjoying CarParKing?';
      const message = window.i18n?.t('rating.message') || 'If you like our game, please give us a 5-star rating! Your support helps us improve.';
      const rateBtn = window.i18n?.t('rating.rateNow') || '⭐ Rate Now';
      const laterBtn = window.i18n?.t('rating.later') || 'Later';

      overlay.innerHTML = `
        <div class="rating-content">
          <div class="rating-stars">⭐⭐⭐⭐⭐</div>
          <div class="rating-title">${title}</div>
          <div class="rating-message">${message}</div>
          <div class="rating-buttons">
            <button class="rating-btn rating-btn-secondary" id="rating-later">${laterBtn}</button>
            <button class="rating-btn rating-btn-primary" id="rating-now">${rateBtn}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // 「稍後再說」按鈕
      document.getElementById('rating-later').addEventListener('click', () => {
        overlay.remove();
      });

      // 「立即評分」按鈕
      document.getElementById('rating-now').addEventListener('click', () => {
        // 標記已顯示過
        localStorage.setItem('cpk_rating_shown', 'true');
        overlay.remove();

        // 顯示感謝訊息
        const thanksMsg = window.i18n?.t('rating.thanks') || 'Thank you for your support! 💛';
        this.showToast(thanksMsg);

        // 嘗試發送觸覺反饋
        if (window.worldMiniKit?.sendHapticFeedback) {
          window.worldMiniKit.sendHapticFeedback('success');
        }
      });
    }, 1500);
  }

  // 顯示獲得獎勵的彈出效果
  showRewardPopup(cpkEarned) {
    const popup = document.createElement('div');
    popup.className = 'reward-popup';
    popup.innerHTML = `
      <span class="reward-icon">🪙</span>
      <span class="reward-amount">+${cpkEarned}</span>
      <span class="reward-label">CPK</span>
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 2000);
  }

  // ===== 排行榜功能 =====

  // 顯示排行榜
  async showLeaderboard() {
    // 建立排行榜容器
    let leaderboard = document.getElementById('leaderboard-panel');
    if (!leaderboard) {
      leaderboard = document.createElement('div');
      leaderboard.id = 'leaderboard-panel';
      leaderboard.className = 'leaderboard-panel';
      document.body.appendChild(leaderboard);
    }

    // 顯示載入中
    leaderboard.innerHTML = `
      <div class="leaderboard-header">
        <h2>🏆 ${window.i18n?.t('leaderboard.title') || '停車大王真人榜'}</h2>
        <button id="close-leaderboard" class="close-panel-btn">×</button>
      </div>
      <div class="leaderboard-loading">
        ${window.i18n?.t('leaderboard.loading') || '載入中...'}
      </div>
    `;
    leaderboard.classList.remove('hidden');

    // 綁定關閉按鈕
    document.getElementById('close-leaderboard')?.addEventListener('click', () => {
      this.hideLeaderboard();
    });

    try {
      // 獲取排行榜資料
      const response = await fetch(
        `${this.apiBase}/api/leaderboard?nullifier_hash=${this.nullifierHash || ''}`
      );
      const data = await response.json();

      if (data.success) {
        this.renderLeaderboard(leaderboard, data);
      } else {
        leaderboard.querySelector('.leaderboard-loading').textContent =
          window.i18n?.t('leaderboard.error') || '載入失敗';
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      leaderboard.querySelector('.leaderboard-loading').textContent =
        window.i18n?.t('leaderboard.error') || '載入失敗';
    }
  }

  // 渲染排行榜內容
  renderLeaderboard(container, data) {
    const { leaderboard, total_players, total_drivers, my_rank } = data;

    // 我的司機編號
    const myDriverNumber = my_rank?.player_number || this.userState?.player_number;

    let html = `
      <div class="leaderboard-header">
        <h2>🏆 ${window.i18n?.t('leaderboard.title') || '停車大王真人榜'}</h2>
        <button id="close-leaderboard" class="close-panel-btn">×</button>
      </div>
    `;

    // 顯示「你是第 XX 位停車司機」
    if (myDriverNumber) {
      html += `
        <div class="leaderboard-driver-number">
          🚗 ${window.i18n?.t('leaderboard.youAreDriver') || '你是第'} <strong>#${myDriverNumber}</strong> ${window.i18n?.t('leaderboard.driver') || '位停車司機'}
        </div>
      `;
    }

    html += `
      <div class="leaderboard-subtitle">
        ${window.i18n?.t('leaderboard.totalPlayers') || '共'} ${total_drivers || total_players} ${window.i18n?.t('leaderboard.players') || '位玩家'}
      </div>
      <div class="leaderboard-list">
    `;

    // 前 10 名
    if (leaderboard.length === 0) {
      html += `<div class="leaderboard-empty">${window.i18n?.t('leaderboard.empty') || '暫無資料'}</div>`;
    } else {
      leaderboard.forEach(player => {
        const isMe = my_rank && player.rank === my_rank.rank;
        const rankIcon = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `${player.rank}.`;
        const badgeIcon = this.getBadgeIcon(player.active_badge);
        html += `
          <div class="leaderboard-row ${isMe ? 'is-me' : ''}">
            <span class="rank">${rankIcon}</span>
            <span class="player-id">${isMe ? (window.i18n?.t('leaderboard.you') || '你') : player.display_id}${badgeIcon}</span>
            <span class="score">${player.total_score.toLocaleString()}</span>
          </div>
        `;
      });
    }

    // 如果自己不在前 10 名
    if (my_rank && !my_rank.is_in_top10 && my_rank.neighbors) {
      html += `
        <div class="leaderboard-separator">
          <span>···</span>
        </div>
      `;

      my_rank.neighbors.forEach(player => {
        const badgeIcon = this.getBadgeIcon(player.active_badge);
        html += `
          <div class="leaderboard-row ${player.is_me ? 'is-me' : ''}">
            <span class="rank">${player.rank}.</span>
            <span class="player-id">${player.is_me ? (window.i18n?.t('leaderboard.you') || '你') : player.display_id}${badgeIcon}</span>
            <span class="score">${player.total_score.toLocaleString()}</span>
          </div>
        `;
      });
    }

    html += '</div>';

    // 顯示自己的排名摘要
    if (my_rank) {
      html += `
        <div class="leaderboard-my-rank">
          ${window.i18n?.t('leaderboard.yourRank') || '你的排名'}:
          <strong>#${my_rank.rank}</strong> / ${total_players}
        </div>
      `;
    }

    container.innerHTML = html;

    // 重新綁定關閉按鈕
    document.getElementById('close-leaderboard')?.addEventListener('click', () => {
      this.hideLeaderboard();
    });
  }

  // 隱藏排行榜
  hideLeaderboard() {
    const leaderboard = document.getElementById('leaderboard-panel');
    if (leaderboard) {
      leaderboard.classList.add('hidden');
    }
  }
}

// 全域實例
window.tokenomicsUI = new TokenomicsUI();
