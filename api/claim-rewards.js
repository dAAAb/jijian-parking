// api/claim-rewards.js
// 領取 CPK 獎勵（鏈上轉帳）

import { kv } from '@vercel/kv';
import { ethers } from 'ethers';
import {
  CPK_TOKEN_ADDRESS,
  WORLD_CHAIN_RPC,
  setCorsHeaders,
  validateNullifierHash
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

    const userKey = `user:${nullifier_hash}`;
    let userData = await kv.get(userKey);

    if (!userData) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const cpkToClaim = userData.cpk_pending;

    if (cpkToClaim <= 0) {
      return res.status(400).json({ success: false, error: 'No rewards to claim' });
    }

    // 最小領取門檻（防止小額交易浪費 Gas）
    const MIN_CLAIM_AMOUNT = 100;
    if (cpkToClaim < MIN_CLAIM_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: `Minimum claim amount is ${MIN_CLAIM_AMOUNT} CPK`
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
    userData.cpk_pending = 0;
    userData.cpk_claimed_total += cpkToClaim;
    userData.last_claim_at = Date.now();
    userData.wallet_address = wallet_address;

    await kv.set(userKey, userData);

    console.log(`Claimed ${cpkToClaim} CPK to ${wallet_address} - TX: ${txResult.txHash}`);

    return res.status(200).json({
      success: true,
      cpk_claimed: cpkToClaim,
      tx_hash: txResult.txHash,
      cpk_claimed_total: userData.cpk_claimed_total
    });

  } catch (error) {
    console.error('Error claiming rewards:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function sendCPKTokens(toAddress, amount) {
  try {
    const privateKey = process.env.REWARD_WALLET_PRIVATE_KEY;

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
