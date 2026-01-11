// api/purchase-slowdown.js
// 購買降速功能（驗證 WLD 支付）

import { kv } from '@vercel/kv';
import {
  SLOWDOWN_CONFIG,
  CASHBACK_RATE,
  calculateSpeedMultiplier,
  setCorsHeaders,
  validateNullifierHash,
  checkRateLimit
} from './lib/tokenomics.js';
import { processPaymentWithSwap } from './lib/dex-swap.js';

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
      purchase_type,    // 'single' | 'l1_badge' | 'l3_badge'
      transaction_id,   // World App 支付的交易 ID
      reference         // 支付請求的 reference
    } = req.body;

    // 驗證參數
    if (!nullifier_hash || !purchase_type || !transaction_id) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    if (!validateNullifierHash(nullifier_hash)) {
      return res.status(400).json({ success: false, error: 'Invalid nullifier_hash format' });
    }

    if (!['single', 'l1_badge', 'l3_badge'].includes(purchase_type)) {
      return res.status(400).json({ success: false, error: 'Invalid purchase type' });
    }

    // Rate Limiting 檢查
    const rateLimit = await checkRateLimit(kv, nullifier_hash, 'purchase');
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimit.error,
        resetIn: rateLimit.resetIn
      });
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

    const userKey = `user:${nullifier_hash}`;
    let userData = await kv.get(userKey);

    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let wldCost = 0;
    let message = '';

    switch (purchase_type) {
      case 'single':
        // 單次降速：1 WLD，+20%，累加
        wldCost = SLOWDOWN_CONFIG.single.cost;
        userData.current_session.single_slowdowns += 1;
        userData.current_session.single_slowdown_percent += SLOWDOWN_CONFIG.single.percent;
        message = `Single slowdown purchased (+${SLOWDOWN_CONFIG.single.percent}%)`;
        break;

      case 'l1_badge':
        // L1 徽章：10 WLD，20%，3 天
        wldCost = SLOWDOWN_CONFIG.l1_badge.cost;
        userData.badges.l1 = {
          active: true,
          purchased_at: Date.now(),
          expires_at: Date.now() + SLOWDOWN_CONFIG.l1_badge.duration
        };
        message = `L1 Badge purchased (${SLOWDOWN_CONFIG.l1_badge.percent}% slowdown, 3 days)`;
        break;

      case 'l3_badge':
        // L3 徽章：30 WLD，80%，3 天
        wldCost = SLOWDOWN_CONFIG.l3_badge.cost;
        userData.badges.l3 = {
          active: true,
          purchased_at: Date.now(),
          expires_at: Date.now() + SLOWDOWN_CONFIG.l3_badge.duration
        };
        message = `L3 Badge purchased (${SLOWDOWN_CONFIG.l3_badge.percent}% slowdown, 3 days)`;
        break;
    }

    // 執行完整課金流程：90% 轉給 TREASURY + 10% swap 成 CPK
    let cpkCashback = 0;
    let cashbackTxHash = null;
    let treasuryTxHash = null;

    // 處理收到的 WLD：90% 轉給金庫，10% swap 造市
    const paymentResult = await processPaymentWithSwap(wldCost, CASHBACK_RATE);
    if (paymentResult.success) {
      cpkCashback = paymentResult.cpkCashback || 0;
      cashbackTxHash = paymentResult.swapTxHash;
      treasuryTxHash = paymentResult.treasuryTxHash;
      console.log(`Payment processed: ${paymentResult.treasuryAmount} WLD → TREASURY, ${paymentResult.wldSwapped} WLD → ${cpkCashback} CPK`);
    } else {
      console.error('Payment processing failed:', paymentResult.error);
      // 如果轉帳失敗，返回錯誤（這是關鍵操作）
      return res.status(500).json({
        success: false,
        error: 'Payment processing failed: ' + paymentResult.error
      });
    }

    userData.cpk_pending += cpkCashback;

    // 更新本局 WLD 花費（用於 L2 臨時徽章判定）
    userData.current_session.wld_spent_this_session += wldCost;

    // 檢查是否觸發 L2 臨時徽章（本局充值滿 3 WLD）
    if (userData.current_session.wld_spent_this_session >= SLOWDOWN_CONFIG.l2_temp.threshold &&
        !userData.current_session.l2_temp_active) {
      userData.current_session.l2_temp_active = true;
      message += ` + L2 Temp Badge activated (+${SLOWDOWN_CONFIG.l2_temp.percent}%)!`;
    }

    userData.last_active = Date.now();
    await kv.set(userKey, userData);

    // 記錄交易（防重放）
    await kv.set(txKey, {
      tx_id: transaction_id,
      user_nullifier: nullifier_hash,
      type: purchase_type,
      wld_amount: wldCost,
      cpk_cashback: cpkCashback,
      status: 'confirmed',
      created_at: Date.now()
    }, { ex: 86400 * 7 }); // 7 天過期

    // 計算新的速度乘數
    const speedMultiplier = calculateSpeedMultiplier(userData);

    console.log(`Purchase: ${purchase_type} by ${nullifier_hash.substring(0, 10)}... - Cashback: ${cpkCashback} CPK`);

    return res.status(200).json({
      success: true,
      message,
      wld_spent: wldCost,
      cpk_cashback: cpkCashback,
      cpk_pending_total: userData.cpk_pending,
      treasury_tx_hash: treasuryTxHash,  // 90% WLD 轉帳交易
      cashback_tx_hash: cashbackTxHash,  // 10% DEX swap 交易
      speed_multiplier: speedMultiplier,
      effective_slowdown: Math.round((1 - speedMultiplier) * 100),
      l2_temp_active: userData.current_session.l2_temp_active,
      badges: userData.badges
    });

  } catch (error) {
    console.error('Error processing purchase:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function verifyWorldAppPayment(transactionId, reference, maxRetries = 5) {
  const appId = process.env.WORLD_APP_ID || 'app_8759766ce92173ee6e1ce6568a9bc9e6';
  const apiKey = process.env.WORLD_API_KEY;

  if (!apiKey) {
    console.warn('WORLD_API_KEY not configured - skipping payment verification in dev mode');
    // 開發模式：跳過驗證
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
      return { success: true, data: { status: 'mined', reference } };
    }
    return { success: false, error: 'API key not configured' };
  }

  // Polling 機制：等待交易確認（最多重試 maxRetries 次，每次間隔 2 秒）
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Payment verification attempt ${attempt}/${maxRetries}...`);

      const response = await fetch(
        `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${appId}&type=payment`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment verification failed:', response.status, errorText);
        return { success: false, error: `Payment verification failed (${response.status})` };
      }

      const data = await response.json();
      console.log(`Attempt ${attempt} - Payment API response:`, JSON.stringify(data));

      const txStatus = data.transactionStatus || data.transaction_status || data.status;
      const referenceMatch = !reference || data.reference === reference;

      // 交易已確認
      if (['mined', 'confirmed', 'success'].includes(txStatus) && referenceMatch) {
        console.log('✅ Payment confirmed!');
        return { success: true, data };
      }

      // 交易失敗
      if (txStatus === 'failed') {
        console.error('❌ Payment failed');
        return { success: false, error: 'Payment transaction failed' };
      }

      // 交易還在 pending，等待後重試
      if (txStatus === 'pending' && attempt < maxRetries) {
        console.log(`⏳ Payment pending, waiting 2s before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      // Reference 不匹配
      if (!referenceMatch) {
        console.error('Reference mismatch:', { expected: reference, actual: data.reference });
        return { success: false, error: 'Payment reference mismatch' };
      }

      // 最後一次嘗試仍是 pending
      if (txStatus === 'pending') {
        console.error('Payment still pending after max retries');
        return { success: false, error: 'Payment still pending, please try again later' };
      }

      // 未知狀態
      console.error('Unknown payment status:', txStatus);
      return { success: false, error: `Unknown payment status: ${txStatus}` };

    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error);
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return { success: false, error: 'Payment verification failed after retries' };
}
