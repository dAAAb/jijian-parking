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

    // 計算匯率
    // rateWLDtoCPK 是 1 WLD = ? CPK
    // rateCPKtoWLD 是 1 CPK = ? WLD = 1 / rateWLDtoCPK
    const rate = parseFloat(poolData.rateWLDtoCPK);
    const rateCPKtoWLD = rate > 0 ? (1 / rate) : 0;

    return res.status(200).json({
      success: true,
      rateWLDtoCPK: poolData.rateWLDtoCPK,  // 1 WLD = ? CPK
      rateCPKtoWLD: rateCPKtoWLD.toFixed(6), // 1 CPK = ? WLD (華爾街風格)
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
