// api/revive.js
// 復活功能 API（支援 WLD 和 CPK 支付）

import { kv } from '@vercel/kv';
import {
  CASHBACK_RATE,
  setCorsHeaders,
  validateNullifierHash,
  checkRateLimit
} from './lib/tokenomics.js';
import { processPaymentWithSwap } from './lib/dex-swap.js';

// 復活費用設定
const REVIVE_CONFIG = {
  wld_cost: 1,      // 1 WLD
  cpk_cost: 100     // 100 CPK
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      nullifier_hash,
      payment_type,     // 'wld' | 'cpk'
      transaction_id,   // World App 支付的交易 ID（僅 WLD 需要）
      reference         // 支付請求的 reference（僅 WLD 需要）
    } = req.body;

    // 驗證參數
    if (!nullifier_hash || !payment_type) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    if (!validateNullifierHash(nullifier_hash)) {
      return res.status(400).json({ success: false, error: 'Invalid nullifier_hash format' });
    }

    if (!['wld', 'cpk'].includes(payment_type)) {
      return res.status(400).json({ success: false, error: 'Invalid payment type' });
    }

    // Rate Limiting 檢查
    const rateLimit = await checkRateLimit(kv, nullifier_hash, 'revive');
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimit.error,
        resetIn: rateLimit.resetIn
      });
    }

    const userKey = `user:${nullifier_hash}`;
    let userData = await kv.get(userKey);

    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 根據支付類型處理
    if (payment_type === 'wld') {
      // WLD 支付
      if (!transaction_id) {
        return res.status(400).json({ success: false, error: 'Missing transaction_id for WLD payment' });
      }

      // 檢查交易是否已處理過（防重放）
      const txKey = `tx:${transaction_id}`;
      const existingTx = await kv.get(txKey);
      if (existingTx) {
        return res.status(400).json({ success: false, error: 'Transaction already processed' });
      }

      // 驗證 World App 支付
      const paymentVerified = await verifyWorldAppPayment(transaction_id, reference);

      if (!paymentVerified.success) {
        return res.status(400).json({
          success: false,
          error: paymentVerified.error || 'Payment verification failed'
        });
      }

      // 處理 WLD 支付（DEX swap + CPK 返還）
      const wldCost = REVIVE_CONFIG.wld_cost;
      const cpkCashback = Math.floor(wldCost * 100 * CASHBACK_RATE);

      try {
        await processPaymentWithSwap(wldCost);
        console.log(`✅ Revive WLD payment processed: ${wldCost} WLD`);
      } catch (swapError) {
        console.error('Revive swap error:', swapError);
        // 即使 swap 失敗，也讓復活成功（用戶體驗優先）
      }

      // 增加 CPK 返還
      userData.cpk_pending = (userData.cpk_pending || 0) + cpkCashback;

      // 記錄交易（24 小時過期）
      await kv.set(txKey, {
        type: 'revive_wld',
        nullifier_hash,
        timestamp: Date.now()
      }, { ex: 86400 });

      // 儲存用戶資料
      await kv.set(userKey, userData);

      console.log(`🔄 User revived with WLD: ${nullifier_hash.substring(0, 10)}... (cashback: ${cpkCashback} CPK)`);

      return res.status(200).json({
        success: true,
        payment_type: 'wld',
        cpk_cashback: cpkCashback,
        cpk_pending: userData.cpk_pending
      });

    } else if (payment_type === 'cpk') {
      // CPK 支付
      const cpkCost = REVIVE_CONFIG.cpk_cost;
      const currentCPK = userData.cpk_pending || 0;

      if (currentCPK < cpkCost) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient CPK balance',
          required: cpkCost,
          current: currentCPK
        });
      }

      // 扣除 CPK
      userData.cpk_pending = currentCPK - cpkCost;

      // 儲存用戶資料
      await kv.set(userKey, userData);

      console.log(`🔄 User revived with CPK: ${nullifier_hash.substring(0, 10)}... (spent: ${cpkCost} CPK)`);

      return res.status(200).json({
        success: true,
        payment_type: 'cpk',
        cpk_spent: cpkCost,
        cpk_pending: userData.cpk_pending
      });
    }

  } catch (error) {
    console.error('Error processing revive:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 驗證 World App 支付（與 purchase-slowdown.js 相同邏輯）
async function verifyWorldAppPayment(transactionId, reference) {
  try {
    const appId = process.env.WORLDCOIN_APP_ID || 'app_8759766ce92173ee6e1ce6568a9bc9e6';
    const apiUrl = `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appId}&type=payment`;

    // Polling 機制：最多重試 5 次，每次間隔 2 秒
    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error(`Payment verification API error (attempt ${attempt}): ${response.status}`);
        if (attempt === maxRetries) {
          return { success: false, error: `API error: ${response.status}` };
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      const data = await response.json();
      console.log(`Payment verification response (attempt ${attempt}):`, JSON.stringify(data));

      // World App API 使用 camelCase
      const txStatus = data.transactionStatus || data.transaction_status || data.status;

      if (['mined', 'confirmed', 'success'].includes(txStatus)) {
        return { success: true, data };
      }

      if (txStatus === 'pending' && attempt < maxRetries) {
        console.log(`Transaction pending, retrying in 2s... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (txStatus === 'failed') {
        return { success: false, error: 'Transaction failed' };
      }

      // 最後一次嘗試還是 pending
      if (attempt === maxRetries) {
        return { success: false, error: `Payment not confirmed (status: ${txStatus})` };
      }
    }

    return { success: false, error: 'Payment verification timeout' };

  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, error: 'Payment verification failed' };
  }
}
