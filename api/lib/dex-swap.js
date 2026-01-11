// api/lib/dex-swap.js
// DEX Swap 功能 - 使用 PUFSwapVM 在 World Chain 上交換代幣

import { ethers } from 'ethers';
import { CPK_TOKEN_ADDRESS, WORLD_CHAIN_RPC } from './tokenomics.js';

// WLD 代幣地址 (World Chain)
export const WLD_TOKEN_ADDRESS = '0x2cfc85d8e48f8eab294be644d9e25c3030863003';

// Uniswap V2 Pair (WLD/CPK) - 用於報價計算
export const WLD_CPK_PAIR = '0x3D1Ec7119a5cC8f17B2789A3f00655C91ebcfe5A';

// PUFSwapVM Router (World Chain 上實際有效的 DEX)
export const PUFSWAP_ROUTER = '0xF1A7bD6CDDc9fE3704F5233c84D57a081B11B23b';

// Permit2 合約地址 (Canonical address)
export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// World Chain ID
export const WORLD_CHAIN_ID = 480;

// ERC-20 ABI
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function transfer(address to, uint256 amount) external returns (bool)'
];

// Uniswap V2 Pair ABI
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external'
];

// PUFSwapVM ABI
const PUFSWAP_ABI = [
  `function swap(tuple(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    tuple(uint8 registry, uint8 swapType, address tokenIn, address tokenOut, uint24 v3PoolFee, uint256 minAmountOut)[] steps,
    uint256 permitNonce,
    uint256 permitDeadline,
    bytes permitSignature
  ) params) external returns (uint256 finalAmountOut)`
];

// Permit2 ABI
const PERMIT2_ABI = [
  'function allowance(address owner, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)',
  'function approve(address token, address spender, uint160 amount, uint48 expiration) external',
  `function permit(address owner, tuple(tuple(address token, uint160 amount, uint48 expiration, uint48 nonce) details, address spender, uint256 sigDeadline) permitSingle, bytes signature) external`
];

/**
 * 獲取 WLD → CPK 的預估輸出數量（使用 V2 pair 的 reserves 計算）
 * @param {number|string} amountInWLD - WLD 數量（以整數表示，如 1 = 1 WLD）
 * @returns {Promise<{success: boolean, amountOut?: string, rate?: number, error?: string}>}
 */
export async function getSwapQuote(amountInWLD) {
  try {
    const provider = new ethers.JsonRpcProvider(WORLD_CHAIN_RPC);
    const pair = new ethers.Contract(WLD_CPK_PAIR, PAIR_ABI, provider);

    // 獲取 reserves
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();

    // 確定哪個是 WLD，哪個是 CPK
    const isWLDToken0 = token0.toLowerCase() === WLD_TOKEN_ADDRESS.toLowerCase();
    const reserveWLD = isWLDToken0 ? reserve0 : reserve1;
    const reserveCPK = isWLDToken0 ? reserve1 : reserve0;

    // WLD 有 18 位小數
    const amountIn = ethers.parseUnits(amountInWLD.toString(), 18);

    // Uniswap V2 公式: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
    const amountInWithFee = amountIn * 997n;
    const numerator = amountInWithFee * reserveCPK;
    const denominator = reserveWLD * 1000n + amountInWithFee;
    const amountOut = numerator / denominator;

    // CPK 有 18 位小數（標準 ERC-20）
    const amountOutFormatted = ethers.formatUnits(amountOut, 18);

    // 計算匯率
    const rate = parseFloat(amountOutFormatted) / parseFloat(amountInWLD.toString());

    return {
      success: true,
      amountOut: amountOutFormatted,
      amountOutRaw: amountOut.toString(),
      rate: rate,
      reserveWLD: ethers.formatUnits(reserveWLD, 18),
      reserveCPK: ethers.formatUnits(reserveCPK, 18)
    };

  } catch (error) {
    console.error('Error getting swap quote:', error);
    return { success: false, error: error.message };
  }
}

// Permit2 EIP-712 Domain
const PERMIT2_DOMAIN = {
  name: 'Permit2',
  chainId: WORLD_CHAIN_ID,
  verifyingContract: PERMIT2_ADDRESS
};

// Permit2 Types for EIP-712
const PERMIT2_TYPES = {
  PermitSingle: [
    { name: 'details', type: 'PermitDetails' },
    { name: 'spender', type: 'address' },
    { name: 'sigDeadline', type: 'uint256' }
  ],
  PermitDetails: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint160' },
    { name: 'expiration', type: 'uint48' },
    { name: 'nonce', type: 'uint48' }
  ]
};

/**
 * 執行 WLD → CPK 的 swap（使用 PUFSwapVM + Permit2）
 * @param {number|string} amountInWLD - WLD 數量
 * @param {number} slippagePercent - 滑點容忍度（百分比，如 10 = 10%）
 * @returns {Promise<{success: boolean, amountOut?: string, txHash?: string, error?: string}>}
 */
export async function swapWLDtoCPK(amountInWLD, slippagePercent = 10) {
  try {
    const privateKey = process.env.REWARD_WALLET_PRIVATE_KEY?.trim();

    if (!privateKey) {
      console.error('REWARD_WALLET_PRIVATE_KEY not configured');
      return { success: false, error: 'Swap wallet not configured' };
    }

    const provider = new ethers.JsonRpcProvider(WORLD_CHAIN_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 獲取報價
    const quote = await getSwapQuote(amountInWLD);
    if (!quote.success) {
      return quote;
    }

    console.log(`Swap quote: ${amountInWLD} WLD → ${quote.amountOut} CPK (rate: 1 WLD = ${quote.rate.toFixed(2)} CPK)`);

    const amountIn = ethers.parseUnits(amountInWLD.toString(), 18);
    const amountOutMin = BigInt(quote.amountOutRaw) * BigInt(100 - slippagePercent) / 100n;

    // 檢查 WLD 餘額
    const wldContract = new ethers.Contract(WLD_TOKEN_ADDRESS, ERC20_ABI, wallet);
    const balance = await wldContract.balanceOf(wallet.address);
    if (balance < amountIn) {
      return {
        success: false,
        error: `Insufficient WLD balance: ${ethers.formatUnits(balance, 18)} < ${amountInWLD}`
      };
    }

    // Step 1: 確保 WLD 已經 approve 給 Permit2
    const permit2 = new ethers.Contract(PERMIT2_ADDRESS, PERMIT2_ABI, wallet);
    const currentAllowance = await wldContract.allowance(wallet.address, PERMIT2_ADDRESS);
    if (currentAllowance < amountIn) {
      console.log('Approving WLD to Permit2...');
      const approveTx = await wldContract.approve(PERMIT2_ADDRESS, ethers.MaxUint256);
      await approveTx.wait();
      console.log('WLD approved to Permit2');
    }

    // Step 2: 獲取 Permit2 的 nonce
    const [, , permit2Nonce] = await permit2.allowance(wallet.address, WLD_TOKEN_ADDRESS, PUFSWAP_ROUTER);
    console.log('Permit2 nonce:', permit2Nonce);

    // Step 3: 構造 Permit2 簽名
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 小時後過期
    const expiration = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 天後過期

    const permitSingle = {
      details: {
        token: WLD_TOKEN_ADDRESS,
        amount: amountIn,
        expiration: expiration,
        nonce: permit2Nonce
      },
      spender: PUFSWAP_ROUTER,
      sigDeadline: deadline
    };

    console.log('Signing Permit2...');
    const signature = await wallet.signTypedData(PERMIT2_DOMAIN, PERMIT2_TYPES, permitSingle);
    console.log('Permit2 signed');

    // Step 4: 構造 PUFSwapVM swap 參數
    // 根據成功交易：swapType: 3 (REGISTRY_UNISWAP_BUY), registry: 1 (V2)
    const swapStep = {
      registry: 1,  // V2
      swapType: 3,  // REGISTRY_UNISWAP_BUY
      tokenIn: WLD_TOKEN_ADDRESS,
      tokenOut: CPK_TOKEN_ADDRESS,
      v3PoolFee: 0,  // 不用 V3
      minAmountOut: amountOutMin
    };

    const swapParams = {
      tokenIn: WLD_TOKEN_ADDRESS,
      tokenOut: CPK_TOKEN_ADDRESS,
      amountIn: amountIn,
      steps: [swapStep],
      permitNonce: permit2Nonce,
      permitDeadline: deadline,
      permitSignature: signature
    };

    // Step 5: 執行 swap
    console.log('Executing PUFSwapVM swap...');
    const pufSwap = new ethers.Contract(PUFSWAP_ROUTER, PUFSWAP_ABI, wallet);
    const swapTx = await pufSwap.swap(swapParams, { gasLimit: 500000 });
    const receipt = await swapTx.wait();

    console.log(`Swap completed: ${amountInWLD} WLD → ~${quote.amountOut} CPK - TX: ${receipt.hash}`);

    return {
      success: true,
      amountIn: amountInWLD,
      amountOut: quote.amountOut,
      amountOutRaw: quote.amountOutRaw,
      txHash: receipt.hash
    };

  } catch (error) {
    console.error('Error executing swap:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 計算 cashback 的 CPK 數量（通過即時報價）
 * @param {number} wldAmount - WLD 花費金額
 * @param {number} cashbackRate - 返還比例（如 0.10 = 10%）
 * @returns {Promise<{success: boolean, cpkAmount?: number, error?: string}>}
 */
export async function calculateCashbackViaDex(wldAmount, cashbackRate = 0.10) {
  const cashbackWLD = wldAmount * cashbackRate;

  // 如果金額太小，直接返回 0（避免計算誤差）
  if (cashbackWLD < 0.001) {
    return { success: true, cpkAmount: 0 };
  }

  // 獲取報價
  const quote = await getSwapQuote(cashbackWLD);

  if (!quote.success) {
    console.error('Failed to get cashback quote:', quote.error);
    // 如果獲取報價失敗，返回 0 而不是阻止交易
    return { success: true, cpkAmount: 0 };
  }

  return {
    success: true,
    cpkAmount: Math.floor(parseFloat(quote.amountOut)),
    wldSwapped: cashbackWLD,
    rate: quote.rate
  };
}

/**
 * 執行 cashback swap（將 WLD 的一部分換成 CPK）
 * @param {number} wldAmount - WLD 花費總金額
 * @param {number} cashbackRate - 返還比例
 * @returns {Promise<{success: boolean, cpkCashback?: number, txHash?: string, error?: string}>}
 */
export async function executeCashbackSwap(wldAmount, cashbackRate = 0.10) {
  const cashbackWLD = wldAmount * cashbackRate;

  // 如果金額太小，跳過 swap（避免 gas 浪費）
  if (cashbackWLD < 0.01) {
    console.log('Cashback amount too small, skipping swap');
    return { success: true, cpkCashback: 0, skipped: true };
  }

  // 執行 swap
  const swapResult = await swapWLDtoCPK(cashbackWLD, 3); // 3% 滑點

  if (!swapResult.success) {
    console.error('Cashback swap failed:', swapResult.error);
    // 返還失敗不應阻止主交易，返回 0
    return { success: true, cpkCashback: 0, error: swapResult.error };
  }

  return {
    success: true,
    cpkCashback: Math.floor(parseFloat(swapResult.amountOut)),
    wldSwapped: cashbackWLD,
    txHash: swapResult.txHash
  };
}

/**
 * 獲取當前池子狀態（用於監控）
 */
export async function getPoolStatus() {
  try {
    const provider = new ethers.JsonRpcProvider(WORLD_CHAIN_RPC);
    const pair = new ethers.Contract(WLD_CPK_PAIR, PAIR_ABI, provider);

    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();

    const isWLDToken0 = token0.toLowerCase() === WLD_TOKEN_ADDRESS.toLowerCase();
    const reserveWLD = isWLDToken0 ? reserve0 : reserve1;
    const reserveCPK = isWLDToken0 ? reserve1 : reserve0;

    // 計算 1 WLD = ? CPK
    const rateWLDtoCPK = parseFloat(ethers.formatUnits(reserveCPK, 18)) /
                         parseFloat(ethers.formatUnits(reserveWLD, 18));

    return {
      success: true,
      pair: WLD_CPK_PAIR,
      reserveWLD: ethers.formatUnits(reserveWLD, 18),
      reserveCPK: ethers.formatUnits(reserveCPK, 18),
      rateWLDtoCPK: rateWLDtoCPK.toFixed(2)
    };

  } catch (error) {
    console.error('Error getting pool status:', error);
    return { success: false, error: error.message };
  }
}
