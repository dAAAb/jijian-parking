// api/session-reset.js
// 死亡時重置當局狀態

import { kv } from '@vercel/kv';
import {
  createNewSession,
  calculateSpeedMultiplier,
  updateBadgeStatus,
  setCorsHeaders,
  validateNullifierHash
} from './lib/tokenomics.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { nullifier_hash } = req.body;

    if (!nullifier_hash) {
      return res.status(400).json({ success: false, error: 'Missing nullifier_hash' });
    }

    if (!validateNullifierHash(nullifier_hash)) {
      return res.status(400).json({ success: false, error: 'Invalid nullifier_hash format' });
    }

    const userKey = `user:${nullifier_hash}`;
    let userData = await kv.get(userKey);

    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 記錄本局花費（用於統計）
    const wldSpentThisSession = userData.current_session.wld_spent_this_session;
    const slowdownsUsed = userData.current_session.single_slowdowns;

    // 重置當局狀態（單次降速失效，L2 臨時徽章失效）
    userData.current_session = createNewSession();
    userData.last_active = Date.now();

    // 更新徽章狀態（檢查過期）
    userData = updateBadgeStatus(userData);

    await kv.set(userKey, userData);

    // 計算新的速度乘數（只剩徽章效果）
    const speedMultiplier = calculateSpeedMultiplier(userData);

    console.log(`Session reset for ${nullifier_hash.substring(0, 10)}... - Lost ${slowdownsUsed} slowdowns`);

    return res.status(200).json({
      success: true,
      message: 'Session reset - single slowdowns and L2 temp badge cleared',
      wld_spent_lost: wldSpentThisSession,
      slowdowns_lost: slowdownsUsed,
      speed_multiplier: speedMultiplier,
      effective_slowdown: Math.round((1 - speedMultiplier) * 100),
      badges: userData.badges
    });

  } catch (error) {
    console.error('Error resetting session:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
