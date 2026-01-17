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
        <button id="claim-btn" class="claim-btn" disabled>
          ${window.i18n?.t('btn.claim') || '領取'}
        </button>
      </div>

      <div class="slowdown-section">
        <div class="slowdown-indicator">
          <span>🐢 ${window.i18n?.t('ui.slowdown') || '降速'}</span>
          <span id="slowdown-percent" class="slowdown-value">0%</span>
        </div>

        <div class="slowdown-actions">
          <button id="buy-single" class="slowdown-btn">
            ⏬ 1 WLD (-20%)
          </button>
        </div>
      </div>

      <div class="promo-hint">
        🎁 ${window.i18n?.t('ui.promoHint') || '特惠期間：課金享 50% $CPK 返還！'}
      </div>

      <div class="badge-section">
        <button id="buy-l1" class="badge-btn l1">
          🥉 L1<br>
          <small>10 WLD | -20% | 3天</small>
        </button>
        <button id="buy-l2" class="badge-btn l2">
          🥈 L2<br>
          <small>15 WLD | -40% | 3天</small>
        </button>
        <button id="buy-l3" class="badge-btn l3">
          🥇 L3<br>
          <small>30 WLD | -80% | 3天</small>
        </button>
      </div>

      <div class="feature-hint">
        <small>🐢 ${window.i18n?.t('ui.slowdownHint') || '減速功能讓車子變慢，更容易控制停車'}</small>
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
      badges.push('⚡ L2臨時');
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

    statusEl.textContent = badges.length > 0 ? badges.join(' | ') : '無啟用效果';
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
        this.showToast('請在 World App 中使用支付功能');
        return;
      }

      // 生成唯一 reference
      const reference = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.showToast('正在發起支付...');

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
        description: `極簡停車 - ${this.getPurchaseDescription(type)}`
      });

      if (finalPayload.status === 'success') {
        this.showToast('支付成功，處理中...');

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
          this.showToast(`✅ ${result.message}\n+${result.cpk_cashback} CPK 返還`);

          // 震動反饋
          if (window.worldMiniKit?.sendHapticFeedback) {
            window.worldMiniKit.sendHapticFeedback('success');
          }
        } else {
          this.showToast(`❌ ${result.error || '購買處理失敗'}`);
        }
      } else {
        this.showToast('支付已取消');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      this.showToast('購買失敗，請重試');
    }
  }

  // 領取 CPK 獎勵
  async claimRewards() {
    try {
      let walletAddress = this.userState?.wallet_address;

      // 如果沒有錢包地址，嘗試獲取
      if (!walletAddress && window.MiniKit?.isInstalled?.()) {
        this.showToast('正在獲取錢包地址...');

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
        this.showToast('請先連接錢包');
        return;
      }

      this.showToast('正在領取 CPK...');

      const response = await fetch(`${this.apiBase}/api/claim-rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nullifier_hash: this.nullifierHash,
          wallet_address: walletAddress
        })
      });

      const result = await response.json();

      if (result.success) {
        this.userState.cpk_pending = 0;
        this.userState.cpk_claimed_total = result.cpk_claimed_total;
        this.userState.wallet_address = walletAddress;

        this.updateUI();

        this.showToast(`✅ 成功領取 ${result.cpk_claimed.toLocaleString()} CPK！\nTX: ${result.tx_hash.substring(0, 10)}...`);

        if (window.worldMiniKit?.sendHapticFeedback) {
          window.worldMiniKit.sendHapticFeedback('success');
        }
      } else {
        this.showToast(`❌ ${result.error || '領取失敗'}`);
      }
    } catch (error) {
      console.error('Claim failed:', error);
      this.showToast('領取失敗，請重試');
    }
  }

  // 過關時新增獎勵
  async addReward(score, level) {
    console.log('🎮 addReward called:', { score, level, nullifierHash: this.nullifierHash?.substring(0, 10) });

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
          level: level
        })
      });

      const result = await response.json();
      console.log('🎮 addReward response:', result);

      if (result.success) {
        this.userState.cpk_pending = result.cpk_pending_total;
        this.updateUI();

        // 顯示獲得的 CPK
        this.showRewardPopup(result.cpk_earned);
        console.log('✅ CPK reward added:', result.cpk_earned);
      } else {
        console.error('❌ addReward failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Failed to add reward:', error);
    }
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
          this.showToast(`降速效果已重置 (損失 ${result.slowdowns_lost} 次)`);
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
      case 'single': return '單次降速 (-20%)';
      case 'l1_badge': return 'L1 徽章 (3天)';
      case 'l2_badge': return 'L2 徽章 (3天)';
      case 'l3_badge': return 'L3 徽章 (3天)';
      default: return '購買';
    }
  }

  // 格式化剩餘時間
  formatTimeRemaining(expiresAt) {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return '已過期';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}天${remainingHours}時`;
    }
    return `${hours}小時`;
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
        html += `
          <div class="leaderboard-row ${isMe ? 'is-me' : ''}">
            <span class="rank">${rankIcon}</span>
            <span class="player-id">${isMe ? (window.i18n?.t('leaderboard.you') || '你') : player.display_id}</span>
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
        html += `
          <div class="leaderboard-row ${player.is_me ? 'is-me' : ''}">
            <span class="rank">${player.rank}.</span>
            <span class="player-id">${player.is_me ? (window.i18n?.t('leaderboard.you') || '你') : player.display_id}</span>
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
