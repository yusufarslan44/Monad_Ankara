const { ethers } = require("ethers");
const User = require("../models/User");

/**
 * creditFeatures — bir adresin kredi-skoru icin on-chain + DB ozelliklerini toplar.
 * Deterministik veri uretir; AI (aiCreditService) bu ozellikleri yorumlar.
 */

// Anlik durum + olaylar icin LendingPool ABI alt kumesi.
const LENDING_POOL_ABI = [
  "function creditLimit(address user) view returns (uint256)",
  "function borrowed(address user) view returns (uint256)",
  "function borrowedAt(address user) view returns (uint256)",
  "function repayCount(address user) view returns (uint256)",
  "function deposits(address user) view returns (uint256)",
  "function currentDebt(address user) view returns (uint256)",
  "function ANNUAL_RATE_BPS() view returns (uint256)",
  "event Borrowed(address indexed student, uint256 amount, uint256 creditLimit)",
  "event Repaid(address indexed student, uint256 principal, uint256 interest)",
  "event DefaultMarked(address indexed student, uint256 debt)",
];

const MAX_BORROW_DURATION_DAYS = 30;
const SECONDS_PER_DAY = 86400;

function resolveLendingPoolAddress() {
  if (process.env.LENDING_POOL_ADDRESS && ethers.isAddress(process.env.LENDING_POOL_ADDRESS)) {
    return process.env.LENDING_POOL_ADDRESS;
  }
  try {
    const deployment = require("../../shared/deployments/monad-testnet.json");
    const addr = deployment?.contracts?.LendingPool;
    if (addr && ethers.isAddress(addr)) return addr;
  } catch (_) {
    /* yok say */
  }
  return null;
}

function resolveDeploymentBlock() {
  try {
    const deployment = require("../../shared/deployments/monad-testnet.json");
    const block = Number(deployment?.block);
    if (Number.isFinite(block) && block > 0) return block;
  } catch (_) {
    /* yok say */
  }
  return 0;
}

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz");
}

function getLendingPoolContract() {
  const address = resolveLendingPoolAddress();
  if (!address) {
    throw new Error("LendingPool kontrat adresi yapilandirilmamis");
  }
  return new ethers.Contract(address, LENDING_POOL_ABI, getProvider());
}

function toMON(wei) {
  return Number(ethers.formatEther(wei || 0n));
}

/** Olay zaman damgalarini blok bazinda (cache'li) cozer. */
async function timestampResolver(provider) {
  const cache = new Map();
  return async (blockNumber) => {
    if (cache.has(blockNumber)) return cache.get(blockNumber);
    const block = await provider.getBlock(blockNumber);
    const ts = block ? Number(block.timestamp) : 0;
    cache.set(blockNumber, ts);
    return ts;
  };
}

/**
 * Olay gecmisinden odeme davranisini turetir.
 * Her Repaid'i ondan onceki en yakin Borrow'a esleyip sure/limit ile on-time/late ayirir.
 */
async function derivePaymentHistory(contract, provider, address) {
  const fromBlock = resolveDeploymentBlock();
  const [borrowEvents, repayEvents, defaultEvents] = await Promise.all([
    contract.queryFilter(contract.filters.Borrowed(address), fromBlock, "latest"),
    contract.queryFilter(contract.filters.Repaid(address), fromBlock, "latest"),
    contract.queryFilter(contract.filters.DefaultMarked(address), fromBlock, "latest"),
  ]);

  const tsOf = await timestampResolver(provider);

  const borrows = [];
  for (const ev of borrowEvents) {
    borrows.push({ at: await tsOf(ev.blockNumber) });
  }
  borrows.sort((a, b) => a.at - b.at);

  let onTimeRepayCount = 0;
  let lateRepayCount = 0;
  for (const ev of repayEvents) {
    const repaidAt = await tsOf(ev.blockNumber);
    // Bu repay'den onceki en yakin borrow
    let borrowAt = 0;
    for (const b of borrows) {
      if (b.at <= repaidAt) borrowAt = b.at;
      else break;
    }
    if (borrowAt > 0 && repaidAt - borrowAt > MAX_BORROW_DURATION_DAYS * SECONDS_PER_DAY) {
      lateRepayCount++;
    } else {
      onTimeRepayCount++;
    }
  }

  return {
    totalBorrows: borrowEvents.length,
    totalRepays: repayEvents.length,
    defaultCount: defaultEvents.length,
    onTimeRepayCount,
    lateRepayCount,
    historyAvailable: true,
  };
}

/**
 * Adres icin kredi-skoru ozelliklerini toplar.
 * @param {string} address
 * @returns {Promise<object>} deterministik ozellik nesnesi
 */
async function gatherFeatures(address) {
  const normalizedAddress = String(address).toLowerCase().trim();
  const user = await User.findOne({ address: normalizedAddress });

  const accountAgeDays = user
    ? Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (SECONDS_PER_DAY * 1000)))
    : null;

  const provider = getProvider();
  const contract = getLendingPoolContract();

  const [creditLimitWei, borrowedWei, borrowedAtRaw, repayCountRaw, depositWei, currentDebtWei, apyBpsRaw] =
    await Promise.all([
      contract.creditLimit(normalizedAddress),
      contract.borrowed(normalizedAddress),
      contract.borrowedAt(normalizedAddress),
      contract.repayCount(normalizedAddress),
      contract.deposits(normalizedAddress),
      contract.currentDebt(normalizedAddress),
      contract.ANNUAL_RATE_BPS(),
    ]);

  const principalMON = toMON(borrowedWei);
  const currentDebtMON = toMON(currentDebtWei);
  const creditLimitMON = toMON(creditLimitWei);
  const depositsMON = toMON(depositWei);
  const accruedInterestMON = Number(Math.max(0, currentDebtMON - principalMON).toFixed(6));
  const repayCount = Number(repayCountRaw);
  const borrowedAt = Number(borrowedAtRaw);
  const hasActiveLoan = principalMON > 0;
  const daysSinceBorrow = hasActiveLoan && borrowedAt > 0
    ? Math.floor((Date.now() / 1000 - borrowedAt) / SECONDS_PER_DAY)
    : 0;
  const overdue = hasActiveLoan && daysSinceBorrow > MAX_BORROW_DURATION_DAYS;
  const utilizationPct = creditLimitMON > 0
    ? Number(Math.min(1, currentDebtMON / creditLimitMON).toFixed(4))
    : 0;

  let history = {
    totalBorrows: null,
    totalRepays: null,
    defaultCount: null,
    onTimeRepayCount: null,
    lateRepayCount: null,
    historyAvailable: false,
  };
  try {
    history = await derivePaymentHistory(contract, provider, normalizedAddress);
  } catch (err) {
    console.warn("Odeme gecmisi olaylari okunamadi, anlik duruma dusuluyor:", err.message);
  }

  return {
    address: normalizedAddress,
    accountAgeDays,
    repayCount,
    hasActiveLoan,
    principalMON,
    currentDebtMON,
    accruedInterestMON,
    creditLimitMON,
    depositsMON,
    utilizationPct,
    daysSinceBorrow,
    overdue,
    maxBorrowDurationDays: MAX_BORROW_DURATION_DAYS,
    annualRateBps: Number(apyBpsRaw),
    ...history,
  };
}

module.exports = { gatherFeatures };
