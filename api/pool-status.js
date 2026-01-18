// api/pool-status.js - 查詢 WLD/CPK 匯率
// v1.0.0

import { getPoolStatus } from './lib/dex-swap.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const poolData = await getPoolStatus();

    if (!poolData.success) {
      return res.status(500).json({
        success: false,
        error: poolData.error || 'Failed to get pool status'
      });
    }

    // 計算 100 CPK = ? WLD
    // rateWLDtoCPK 是 1 WLD = ? CPK
    // 所以 100 CPK = 100 / rateWLDtoCPK WLD
    const rate = parseFloat(poolData.rateWLDtoCPK);
    const cpk100ToWLD = rate > 0 ? (100 / rate).toFixed(4) : '0';

    return res.status(200).json({
      success: true,
      rateWLDtoCPK: poolData.rateWLDtoCPK,  // 1 WLD = ? CPK
      cpk100ToWLD: cpk100ToWLD,              // 100 CPK = ? WLD
      reserveWLD: poolData.reserveWLD,
      reserveCPK: poolData.reserveCPK,
      pair: poolData.pair
    });

  } catch (error) {
    console.error('Pool status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
