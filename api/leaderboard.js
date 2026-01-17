// api/leaderboard.js
// 排行榜 API

import { kv } from '@vercel/kv';
import {
  setCorsHeaders,
  validateNullifierHash
} from './lib/tokenomics.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { nullifier_hash } = req.query;

    // 獲取全域玩家計數
    const totalDrivers = await kv.get('global:player_count') || 0;

    // 獲取所有用戶 key
    const userKeys = await kv.keys('user:*');

    if (!userKeys || userKeys.length === 0) {
      return res.status(200).json({
        success: true,
        leaderboard: [],
        total_players: 0,
        total_drivers: totalDrivers,
        my_rank: null
      });
    }

    // 批量獲取用戶資料
    const usersData = await kv.mget(...userKeys);

    // 過濾有效用戶並排序
    const validUsers = usersData
      .filter(user => user && user.verified && user.total_score > 0)
      .map(user => ({
        nullifier_hash: user.nullifier_hash,
        display_id: user.nullifier_hash.substring(0, 6) + '...' + user.nullifier_hash.slice(-4),
        total_score: user.total_score || 0,
        highest_level: user.highest_level || 1,
        total_games: user.total_games || 0,
        player_number: user.player_number || null,
        active_badge: getActiveBadge(user.badges) // 當前有效徽章
      }))
      .sort((a, b) => b.total_score - a.total_score);

    // 前 10 名
    const top10 = validUsers.slice(0, 10).map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    // 如果有提供 nullifier_hash，計算用戶自己的排名
    let myRankInfo = null;
    let myPlayerNumber = null;
    if (nullifier_hash && validateNullifierHash(nullifier_hash)) {
      const myIndex = validUsers.findIndex(u => u.nullifier_hash === nullifier_hash);

      if (myIndex !== -1) {
        const myRank = myIndex + 1;
        const isInTop10 = myRank <= 10;
        myPlayerNumber = validUsers[myIndex].player_number;

        myRankInfo = {
          rank: myRank,
          total_score: validUsers[myIndex].total_score,
          is_in_top10: isInTop10,
          player_number: myPlayerNumber
        };

        // 如果不在前 10，提供前一名和後一名
        if (!isInTop10) {
          myRankInfo.neighbors = [];

          // 前一名
          if (myIndex > 0) {
            myRankInfo.neighbors.push({
              rank: myIndex,
              ...validUsers[myIndex - 1]
            });
          }

          // 自己
          myRankInfo.neighbors.push({
            rank: myRank,
            ...validUsers[myIndex],
            is_me: true
          });

          // 後一名
          if (myIndex < validUsers.length - 1) {
            myRankInfo.neighbors.push({
              rank: myRank + 1,
              ...validUsers[myIndex + 1]
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      leaderboard: top10,
      total_players: validUsers.length,
      total_drivers: totalDrivers,
      my_rank: myRankInfo
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 獲取用戶當前有效的最高等級徽章
function getActiveBadge(badges) {
  if (!badges) return null;

  const now = Date.now();

  // 按優先級檢查：L3 > L2 > L1
  if (badges.l3?.active && badges.l3.expires_at > now) {
    return 'l3';
  }
  if (badges.l2?.active && badges.l2.expires_at > now) {
    return 'l2';
  }
  if (badges.l1?.active && badges.l1.expires_at > now) {
    return 'l1';
  }

  return null;
}
