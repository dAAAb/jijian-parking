// api/add-reward.js
// 過關時新增 CPK 獎勵

import { kv } from '@vercel/kv';
import {
  CPK_REWARD_MULTIPLIER,
  setCorsHeaders,
  validateNullifierHash,
  checkRateLimit
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
    const { nullifier_hash, score, level } = req.body;

    // 驗證參數
    if (!nullifier_hash || score === undefined || level === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    if (!validateNullifierHash(nullifier_hash)) {
      return res.status(400).json({ success: false, error: 'Invalid nullifier_hash format' });
    }

    if (typeof score !== 'number' || score < 0 || score > 10000) {
      return res.status(400).json({ success: false, error: 'Invalid score' });
    }

    if (typeof level !== 'number' || level < 1 || level > 1000) {
      return res.status(400).json({ success: false, error: 'Invalid level' });
    }

    // Rate Limiting 檢查
    const rateLimit = await checkRateLimit(kv, nullifier_hash, 'addReward');
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimit.error,
        resetIn: rateLimit.resetIn
      });
    }

    const userKey = `user:${nullifier_hash}`;
    let userData = await kv.get(userKey);

    // 用戶必須存在（已通過 World ID 驗證才會創建用戶資料）
    if (!userData) {
      return res.status(403).json({
        success: false,
        error: 'User not verified. Please verify with World ID first.'
      });
    }

    // 額外檢查：確認用戶已驗證（防止繞過）
    if (!userData.verified) {
      return res.status(403).json({
        success: false,
        error: 'User verification incomplete.'
      });
    }

    // 計算 CPK 獎勵：單次得分 1:1 兌換
    const cpkReward = Math.floor(score * CPK_REWARD_MULTIPLIER);

    // 更新用戶狀態
    userData.cpk_pending += cpkReward;
    userData.total_score += score;
    userData.total_games += 1;
    userData.highest_level = Math.max(userData.highest_level, level);
    userData.last_active = Date.now();

    await kv.set(userKey, userData);

    console.log(`Added reward: ${cpkReward} CPK for user ${nullifier_hash.substring(0, 10)}... (Level ${level}, Score ${score})`);

    return res.status(200).json({
      success: true,
      cpk_earned: cpkReward,
      cpk_pending_total: userData.cpk_pending,
      total_score: userData.total_score,
      total_games: userData.total_games
    });

  } catch (error) {
    console.error('Error adding reward:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
