// api/cron/daily-reminder.js
// 每日 CPK 領取提醒通知（Vercel Cron Job）
//
// Cron 時間：每天 UTC 00:00（台灣時間 08:00）
// 注意：Vercel Hobby 方案每天只能執行一次 Cron

import { kv } from '@vercel/kv';

const WORLDCOIN_APP_ID = 'app_8759766ce92173ee6e1ce6568a9bc9e6';
const NOTIFICATION_API = 'https://developer.worldcoin.org/api/v2/minikit/send-notification';

// 多語言通知內容
const LOCALISATIONS = [
  {
    language: 'en',
    title: '🪙 CPK Rewards Available!',
    message: 'Hey ${username}, you have unclaimed CPK points waiting! Come play and claim your rewards.'
  },
  {
    language: 'zh_TW',
    title: '🪙 CPK 積分待領取！',
    message: '嗨 ${username}，你有未領取的 CPK 積分！快來玩遊戲並領取獎勵吧。'
  },
  {
    language: 'ja',
    title: '🪙 CPKポイント受取可能！',
    message: '${username}さん、未受取のCPKポイントがあります！ゲームをプレイして報酬を受け取りましょう。'
  },
  {
    language: 'ko',
    title: '🪙 CPK 포인트 수령 가능!',
    message: '${username}님, 미수령 CPK 포인트가 있습니다! 게임을 플레이하고 보상을 받으세요.'
  }
];

export default async function handler(req, res) {
  // 驗證 Cron 請求（Vercel 會傳送 Authorization header）
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 開發環境允許手動觸發
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log('🔔 Starting daily CPK reminder job...');

  try {
    const apiKey = process.env.WORLD_API_KEY;
    if (!apiKey) {
      console.error('WORLD_API_KEY not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // 獲取所有需要通知的用戶
    const usersToNotify = await getUsersToNotify();

    if (usersToNotify.length === 0) {
      console.log('No users to notify');
      return res.status(200).json({
        success: true,
        message: 'No users to notify',
        notified: 0
      });
    }

    console.log(`Found ${usersToNotify.length} users to notify`);

    // 分批發送通知（每批最多 1000 個）
    const BATCH_SIZE = 1000;
    let totalNotified = 0;
    let totalErrors = 0;

    for (let i = 0; i < usersToNotify.length; i += BATCH_SIZE) {
      const batch = usersToNotify.slice(i, i + BATCH_SIZE);
      const walletAddresses = batch.map(u => u.wallet_address);

      try {
        const response = await fetch(NOTIFICATION_API, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            app_id: WORLDCOIN_APP_ID,
            wallet_addresses: walletAddresses,
            localisations: LOCALISATIONS,
            mini_app_path: `worldapp://mini-app?app_id=${WORLDCOIN_APP_ID}&path=/`
          })
        });

        if (response.ok) {
          totalNotified += walletAddresses.length;
          console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Notified ${walletAddresses.length} users`);

          // 更新用戶的 last_notified_at
          await updateLastNotifiedTime(batch);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, errorData);
          totalErrors += walletAddresses.length;
        }
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error);
        totalErrors += batch.length;
      }

      // 避免 rate limiting，批次間隔 1 秒
      if (i + BATCH_SIZE < usersToNotify.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`🔔 Daily reminder job completed: ${totalNotified} notified, ${totalErrors} errors`);

    return res.status(200).json({
      success: true,
      notified: totalNotified,
      errors: totalErrors,
      total_users: usersToNotify.length
    });

  } catch (error) {
    console.error('Error in daily reminder job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 獲取需要通知的用戶
async function getUsersToNotify() {
  const users = [];
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  try {
    // 掃描所有用戶 key
    // 注意：這在大規模時需要優化（使用 sorted set 等）
    let cursor = 0;
    do {
      const [nextCursor, keys] = await kv.scan(cursor, { match: 'user:*', count: 100 });
      cursor = nextCursor;

      for (const key of keys) {
        const userData = await kv.get(key);

        if (!userData) continue;

        // 條件：
        // 1. 有 wallet_address（已領取過）
        // 2. cpk_pending > 0（有待領取的積分）
        // 3. 距離上次通知超過 24 小時
        // 4. 開啟了通知（預設開啟）
        if (
          userData.wallet_address &&
          userData.cpk_pending > 0 &&
          (!userData.last_notified_at || now - userData.last_notified_at > ONE_DAY) &&
          userData.notifications_enabled !== false
        ) {
          users.push({
            nullifier_hash: key.replace('user:', ''),
            wallet_address: userData.wallet_address,
            cpk_pending: userData.cpk_pending
          });
        }
      }
    } while (cursor !== 0);

  } catch (error) {
    console.error('Error scanning users:', error);
  }

  return users;
}

// 更新用戶的最後通知時間
async function updateLastNotifiedTime(users) {
  const now = Date.now();

  for (const user of users) {
    try {
      const key = `user:${user.nullifier_hash}`;
      const userData = await kv.get(key);

      if (userData) {
        userData.last_notified_at = now;
        await kv.set(key, userData);
      }
    } catch (error) {
      console.error(`Error updating last_notified_at for ${user.nullifier_hash}:`, error);
    }
  }
}
