// api/test-swap.js
// 測試 DEX swap 功能（僅供測試用，上線前移除）

import { setCorsHeaders } from './lib/tokenomics.js';
import { getSwapQuote, swapWLDtoCPK, getPoolStatus } from './lib/dex-swap.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允許 GET（查詢）和 POST（執行 swap）
  if (req.method === 'GET') {
    // 查詢池子狀態和報價
    const amount = parseFloat(req.query.amount) || 0.05;

    try {
      const poolStatus = await getPoolStatus();
      const quote = await getSwapQuote(amount);

      return res.status(200).json({
        success: true,
        pool: poolStatus,
        quote: {
          amountIn: amount,
          amountOut: quote.amountOut,
          rate: quote.rate
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    // 執行 swap
    const { amount, secret } = req.body;

    // 簡單的安全檢查（防止意外調用）
    if (secret !== 'test-swap-2024') {
      return res.status(403).json({ success: false, error: 'Invalid secret' });
    }

    const swapAmount = parseFloat(amount) || 0.05;

    // 限制測試金額
    if (swapAmount > 1) {
      return res.status(400).json({ success: false, error: 'Test amount limited to 1 WLD max' });
    }

    try {
      console.log(`Test swap: ${swapAmount} WLD → CPK`);

      const result = await swapWLDtoCPK(swapAmount, 3); // 3% 滑點

      if (result.success) {
        return res.status(200).json({
          success: true,
          amountIn: result.amountIn,
          amountOut: result.amountOut,
          txHash: result.txHash
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Test swap error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
