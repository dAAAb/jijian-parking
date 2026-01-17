// api/claim-rewards.js
// 領取 CPK 獎勵（鏈上轉帳）

import { kv } from '@vercel/kv';
import { ethers } from 'ethers';
import {
  CPK_TOKEN_ADDRESS,
  WORLD_CHAIN_RPC,
  setCorsHeaders,
  validateNullifierHash,
  checkRateLimit
} from './lib/tokenomics.js';

// ERC-20 ABI（僅需 transfer 和 decimals）
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)'
];

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { nullifier_hash, wallet_address } = req.body;

    // 驗證參數
    if (!nullifier_hash || !wallet_address) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    if (!validateNullifierHash(nullifier_hash)) {
      return res.status(400).json({ success: false, error: 'Invalid nullifier_hash format' });
    }

    // 驗證錢包地址格式
    if (!ethers.isAddress(wallet_address)) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address' });
    }

    // Rate Limiting 檢查
    const rateLimit = await checkRateLimit(kv, nullifier_hash, 'claimRewards');
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

    const cpkPending = userData.cpk_pending;

    if (cpkPending <= 0) {
      return res.status(400).json({ success: false, error: 'No rewards to claim' });
    }

    // 每日領取上限：10%
    const DAILY_CLAIM_PERCENTAGE = 0.10;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式

    // 檢查是否是新的一天
    const lastClaimDate = userData.last_claim_date || null;
    const dailyClaimed = lastClaimDate === today ? (userData.daily_claimed || 0) : 0;

    // 計算今日可領取的最大金額（pending 的 10%）
    const maxDailyAmount = Math.floor(cpkPending * DAILY_CLAIM_PERCENTAGE);
    const remainingToday = maxDailyAmount - dailyClaimed;

    if (remainingToday <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Daily claim limit reached',
        error_code: 'DAILY_LIMIT_REACHED',
        next_claim_date: getNextDay(today),
        daily_limit: maxDailyAmount,
        daily_claimed: dailyClaimed
      });
    }

    // 實際領取金額（不超過今日剩餘額度）
    const cpkToClaim = Math.min(remainingToday, cpkPending);

    // 最小領取門檻（防止小額交易浪費 Gas）
    const MIN_CLAIM_AMOUNT = 10;  // 降低門檻配合每日 10% 限制
    if (cpkToClaim < MIN_CLAIM_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: `Minimum claim amount is ${MIN_CLAIM_AMOUNT} CPK`,
        available: cpkToClaim
      });
    }

    // 發送 CPK 代幣
    const txResult = await sendCPKTokens(wallet_address, cpkToClaim);

    if (!txResult.success) {
      return res.status(500).json({
        success: false,
        error: txResult.error || 'Failed to send tokens'
      });
    }

    // 更新用戶狀態
    userData.cpk_pending = cpkPending - cpkToClaim;  // 扣除已領取的部分
    userData.cpk_claimed_total = (userData.cpk_claimed_total || 0) + cpkToClaim;
    userData.last_claim_at = Date.now();
    userData.last_claim_date = today;
    userData.daily_claimed = dailyClaimed + cpkToClaim;
    userData.wallet_address = wallet_address;

    await kv.set(userKey, userData);

    console.log(`Claimed ${cpkToClaim} CPK to ${wallet_address} - TX: ${txResult.txHash}`);

    // 計算剩餘可領取額度
    const newRemainingToday = maxDailyAmount - userData.daily_claimed;

    return res.status(200).json({
      success: true,
      cpk_claimed: cpkToClaim,
      tx_hash: txResult.txHash,
      cpk_claimed_total: userData.cpk_claimed_total,
      cpk_remaining: userData.cpk_pending,
      daily_limit: maxDailyAmount,
      daily_claimed: userData.daily_claimed,
      daily_remaining: Math.max(0, newRemainingToday)
    });

  } catch (error) {
    console.error('Error claiming rewards:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// 取得明天的日期（YYYY-MM-DD 格式）
function getNextDay(todayStr) {
  const today = new Date(todayStr);
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
}

async function sendCPKTokens(toAddress, amount) {
  try {
    const privateKey = process.env.REWARD_WALLET_PRIVATE_KEY?.trim();

    if (!privateKey) {
      console.error('REWARD_WALLET_PRIVATE_KEY not configured');
      return { success: false, error: 'Reward wallet not configured' };
    }

    const provider = new ethers.JsonRpcProvider(WORLD_CHAIN_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);
    const cpkContract = new ethers.Contract(CPK_TOKEN_ADDRESS, ERC20_ABI, wallet);

    // 獲取代幣精度
    const decimals = await cpkContract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    // 檢查餘額
    const balance = await cpkContract.balanceOf(wallet.address);
    if (balance < amountWei) {
      console.error(`Insufficient CPK balance: ${balance} < ${amountWei}`);
      return { success: false, error: 'Insufficient reward pool balance' };
    }

    // 發送交易
    const tx = await cpkContract.transfer(toAddress, amountWei);
    console.log(`CPK transfer initiated: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`CPK transfer confirmed: ${receipt.hash}`);

    return { success: true, txHash: receipt.hash };

  } catch (error) {
    console.error('Error sending CPK tokens:', error);
    return { success: false, error: error.message || 'Transaction failed' };
  }
}
