// api/user-state.js
// 用戶狀態查詢 API

import { kv } from '@vercel/kv';
import {
  createNewUser,
  updateBadgeStatus,
  calculateSpeedMultiplier,
  setCorsHeaders,
  validateNullifierHash
} from './lib/tokenomics.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { nullifier_hash } = req.query;

    if (!nullifier_hash) {
      return res.status(400).json({ success: false, error: 'Missing nullifier_hash' });
    }

    if (!validateNullifierHash(nullifier_hash)) {
      return res.status(400).json({ success: false, error: 'Invalid nullifier_hash format' });
    }

    const userKey = `user:${nullifier_hash}`;
    let userData = await kv.get(userKey);

    // 如果用戶不存在，創建新用戶
    if (!userData) {
      userData = createNewUser(nullifier_hash);
      await kv.set(userKey, userData);
      console.log(`Created new user: ${nullifier_hash.substring(0, 10)}...`);
    }

    // 檢查並更新徽章狀態
    userData = updateBadgeStatus(userData);

    // 計算當前有效的降速百分比
    const speedMultiplier = calculateSpeedMultiplier(userData);

    return res.status(200).json({
      success: true,
      user: {
        cpk_pending: userData.cpk_pending,
        cpk_claimed_total: userData.cpk_claimed_total,
        total_games: userData.total_games,
        total_score: userData.total_score,
        highest_level: userData.highest_level,
        current_session: userData.current_session,
        badges: userData.badges
      },
      speed_multiplier: speedMultiplier,
      effective_slowdown: Math.round((1 - speedMultiplier) * 100)
    });

  } catch (error) {
    console.error('Error fetching user state:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
