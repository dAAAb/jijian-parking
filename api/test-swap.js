// api/test-swap.js
// 測試 DEX swap 功能（僅供測試用，上線前移除）

import { setCorsHeaders } from './lib/tokenomics.js';
import { getSwapQuote, swapWLDtoCPK, getPoolStatus, processPaymentWithSwap } from './lib/dex-swap.js';

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
    const { amount, secret, mode } = req.body;

    // 安全檢查：使用環境變數（不在代碼中暴露）
    const testSecret = process.env.TEST_SWAP_SECRET;
    if (!testSecret || secret !== testSecret) {
      return res.status(403).json({ success: false, error: 'Invalid secret' });
    }

    const testAmount = parseFloat(amount) || 0.05;

    // 限制測試金額
    if (testAmount > 1) {
      return res.status(400).json({ success: false, error: 'Test amount limited to 1 WLD max' });
    }

    try {
      // mode: 'swap' = 只測試 swap, 'full' = 測試完整流程（90% 轉帳 + 10% swap）
      if (mode === 'full') {
        console.log(`Test full payment flow: ${testAmount} WLD`);

        const result = await processPaymentWithSwap(testAmount, 0.10);  // 10% cashback

        if (result.success) {
          return res.status(200).json({
            success: true,
            mode: 'full',
            totalAmount: testAmount,
            treasuryAmount: result.treasuryAmount,
            treasuryTxHash: result.treasuryTxHash,
            cpkCashback: result.cpkCashback,
            swapTxHash: result.swapTxHash,
            wldSwapped: result.wldSwapped
          });
        } else {
          return res.status(400).json({
            success: false,
            error: result.error
          });
        }
      } else {
        // 預設：只測試 swap
        console.log(`Test swap: ${testAmount} WLD → CPK`);

        const result = await swapWLDtoCPK(testAmount, 3); // 3% 滑點

        if (result.success) {
          return res.status(200).json({
            success: true,
            mode: 'swap',
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
      }
    } catch (error) {
      console.error('Test error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
