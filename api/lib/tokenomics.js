// api/lib/tokenomics.js
// Token-nomics 共用函數

// $CPK 代幣配置
export const CPK_TOKEN_ADDRESS = '0x006201CEEC3Cf7fEFB24638a229784F1D10ADc92';
export const REWARD_WALLET_ADDRESS = '0x3976493CD69B56EA8DBBDdfEd07276aa5915c466';
export const WORLD_CHAIN_RPC = 'https://worldchain-mainnet.g.alchemy.com/public';

// 經濟參數
export const CPK_REWARD_MULTIPLIER = 1;      // 分數 1:1 兌換 CPK
export const CASHBACK_RATE = 0.50;           // 50% 返還（特惠期間）
// 注意：WLD_TO_CPK_RATE 已移除，改用 api/lib/dex-swap.js 即時獲取市場價格

// Rate Limiting 配置
export const RATE_LIMIT_CONFIG = {
  addReward: { maxRequests: 10, windowMs: 60 * 1000 },     // 每分鐘最多 10 次過關獎勵
  claimRewards: { maxRequests: 3, windowMs: 60 * 1000 },   // 每分鐘最多 3 次領取
  purchase: { maxRequests: 5, windowMs: 60 * 1000 }        // 每分鐘最多 5 次購買
};

// 降速配置
export const SLOWDOWN_CONFIG = {
  single: { cost: 1, percent: 20 },          // 單次：1 WLD, 20%
  l1_badge: { cost: 10, percent: 20, duration: 3 * 24 * 60 * 60 * 1000 },  // L1：10 WLD, 20%, 3天
  l2_badge: { cost: 15, percent: 40, duration: 3 * 24 * 60 * 60 * 1000 },  // L2：15 WLD, 40%, 3天
  l2_temp: { threshold: 3, percent: 40 },    // L2 臨時：累計 3 WLD, 40%（與購買的 L2 不累加）
  l3_badge: { cost: 30, percent: 80, duration: 3 * 24 * 60 * 60 * 1000 }   // L3：30 WLD, 80%, 3天
};

// 創建新用戶（只有通過 World ID 驗證後才會調用）
// 注意：player_number 需要在調用處設置
export function createNewUser(nullifierHash, playerNumber = null) {
  return {
    nullifier_hash: nullifierHash,
    created_at: Date.now(),
    last_active: Date.now(),

    // 司機編號（第幾位加入的玩家）
    player_number: playerNumber,

    // World ID 驗證狀態
    verified: true,  // 用戶通過驗證後才會創建，所以默認為 true

    // CPK 獎勵
    cpk_pending: 0,
    cpk_claimed_total: 0,
    last_claim_at: null,

    // 遊戲統計
    total_games: 0,
    total_score: 0,
    highest_level: 1,

    // 當局狀態（死亡時重置）
    current_session: createNewSession(),

    // 徽章
    badges: {
      l1: { active: false, expires_at: null, purchased_at: null },
      l2: { active: false, expires_at: null, purchased_at: null },
      l3: { active: false, expires_at: null, purchased_at: null }
    }
  };
}

// 創建新的當局狀態
export function createNewSession() {
  return {
    single_slowdowns: 0,
    single_slowdown_percent: 0,
    wld_spent_this_session: 0,
    l2_temp_active: false,
    session_start: Date.now()
  };
}

// 更新徽章狀態（檢查過期）
export function updateBadgeStatus(userData) {
  const now = Date.now();

  // 檢查 L1 徽章過期
  if (userData.badges.l1?.active && userData.badges.l1.expires_at <= now) {
    userData.badges.l1.active = false;
  }

  // 檢查 L2 徽章過期
  if (userData.badges.l2?.active && userData.badges.l2.expires_at <= now) {
    userData.badges.l2.active = false;
  }

  // 檢查 L3 徽章過期
  if (userData.badges.l3?.active && userData.badges.l3.expires_at <= now) {
    userData.badges.l3.active = false;
  }

  return userData;
}

// 計算速度乘數
export function calculateSpeedMultiplier(userData) {
  let totalSlowdown = 0;
  const now = Date.now();

  // 1. 單次降速（累加，死亡失效）
  totalSlowdown += userData.current_session?.single_slowdown_percent || 0;

  // 2. L1 徽章：+20%（如果有效）
  if (userData.badges?.l1?.active && userData.badges.l1.expires_at > now) {
    totalSlowdown += SLOWDOWN_CONFIG.l1_badge.percent;
  }

  // 3. L2 效果：購買的 L2 徽章或臨時 L2（取最大，不累加）
  const hasL2Badge = userData.badges?.l2?.active && userData.badges.l2.expires_at > now;
  const hasL2Temp = userData.current_session?.l2_temp_active;
  if (hasL2Badge || hasL2Temp) {
    totalSlowdown += SLOWDOWN_CONFIG.l2_badge.percent; // 兩者效果相同，只加一次
  }

  // 4. L3 徽章：+80%（如果有效）
  if (userData.badges?.l3?.active && userData.badges.l3.expires_at > now) {
    totalSlowdown += SLOWDOWN_CONFIG.l3_badge.percent;
  }

  // 限制最大降速為 95%（避免完全靜止）
  totalSlowdown = Math.min(totalSlowdown, 95);

  // 返回速度乘數（0.05 - 1.0）
  return 1 - (totalSlowdown / 100);
}

// CORS headers
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 驗證 nullifier_hash 格式
export function validateNullifierHash(nullifierHash) {
  if (!nullifierHash || typeof nullifierHash !== 'string') {
    return false;
  }
  // nullifier_hash 是 256-bit hash
  return /^0x[a-fA-F0-9]{64}$/.test(nullifierHash);
}

// Rate Limiting 檢查（使用 Vercel KV）
export async function checkRateLimit(kv, identifier, action) {
  const config = RATE_LIMIT_CONFIG[action];
  if (!config) return { allowed: true };

  const key = `ratelimit:${action}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // 獲取該用戶在時間窗口內的請求記錄
    let requests = await kv.get(key) || [];

    // 過濾掉過期的請求
    requests = requests.filter(timestamp => timestamp > windowStart);

    // 檢查是否超過限制
    if (requests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...requests);
      const resetIn = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
      return {
        allowed: false,
        error: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        resetIn
      };
    }

    // 記錄這次請求
    requests.push(now);
    await kv.set(key, requests, { ex: Math.ceil(config.windowMs / 1000) });

    return { allowed: true, remaining: config.maxRequests - requests.length };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // 如果 KV 出錯，允許請求通過（fail open）
    return { allowed: true };
  }
}
