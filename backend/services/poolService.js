const { ethers } = require("ethers");

const LENDING_POOL_ABI = [
  "function deposits(address user) view returns (uint256)",
  "function totalDeposited() view returns (uint256)",
  "function totalBorrowed() view returns (uint256)",
  "function availableLiquidity() view returns (uint256)",
  "function ANNUAL_RATE_BPS() view returns (uint256)",
];

function resolveLendingPoolAddress() {
  if (process.env.LENDING_POOL_ADDRESS && ethers.isAddress(process.env.LENDING_POOL_ADDRESS)) {
    return process.env.LENDING_POOL_ADDRESS;
  }

  try {
    const deployment = require("../../shared/deployments/monad-testnet.json");
    const addr = deployment?.contracts?.LendingPool;
    if (addr && ethers.isAddress(addr)) return addr;
  } catch (_) {
    /* deployment dosyasi yoksa yok say */
  }

  return null;
}

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz");
}

function getLendingPoolContract() {
  const address = resolveLendingPoolAddress();
  if (!address) {
    throw new Error("LendingPool kontrat adresi yapilandirilmamis");
  }

  const provider = getProvider();
  return new ethers.Contract(address, LENDING_POOL_ABI, provider);
}

function toMON(wei) {
  return Number(ethers.formatEther(wei || 0n));
}

function generateFallbackSnapshot(address, walletBalanceMON) {
  return {
    walletBalanceMON,
    totalDepositedMON: 24.5,
    totalBorrowedMON: 8.2,
    availableLiquidityMON: 16.3,
    globalApyBps: 500,
    projectedInterestMON: 0.21,
    userDeposits: [
      {
        id: "pd-fallback-1",
        amountMON: 2,
        lockDays: 30,
        apyBps: 500,
        depositedAt: "Bugun 09:05",
        maturesAt: "30 gun sonra",
        status: "Aktif",
        projectedInterestMON: 0.08,
      },
    ],
    fallback: true,
  };
}

async function getPoolSnapshot(address) {
  const normalizedAddress = String(address).toLowerCase().trim();
  const provider = getProvider();

  const walletBalanceWei = await provider.getBalance(normalizedAddress);
  const walletBalanceMON = toMON(walletBalanceWei);

  try {
    const contract = getLendingPoolContract();
    const [depositWei, totalDepositedWei, totalBorrowedWei, availableLiquidityWei, apyBpsWei] = await Promise.all([
      contract.deposits(normalizedAddress),
      contract.totalDeposited(),
      contract.totalBorrowed(),
      contract.availableLiquidity(),
      contract.ANNUAL_RATE_BPS(),
    ]);

    const depositMON = toMON(depositWei);
    const totalDepositedMON = toMON(totalDepositedWei);
    const totalBorrowedMON = toMON(totalBorrowedWei);
    const availableLiquidityMON = toMON(availableLiquidityWei);
    const apyBps = Number(apyBpsWei);

    const lockDays = 30;
    const projectedInterestMON = Number(((depositMON * apyBps * lockDays) / (10_000 * 365)).toFixed(4));

    return {
      walletBalanceMON,
      totalDepositedMON,
      totalBorrowedMON,
      availableLiquidityMON,
      globalApyBps: apyBps || 500,
      projectedInterestMON,
      userDeposits:
        depositMON > 0
          ? [
              {
                id: "pd-onchain-1",
                amountMON: depositMON,
                lockDays,
                apyBps: apyBps || 500,
                depositedAt: "Mevcut",
                maturesAt: `${lockDays} gun sonra`,
                status: "Aktif",
                projectedInterestMON,
              },
            ]
          : [],
      fallback: false,
    };
  } catch (err) {
    console.warn("Havuz on-chain verisi okunamadi, fallback kullaniliyor:", err.message);
    return generateFallbackSnapshot(normalizedAddress, walletBalanceMON);
  }
}

module.exports = { getPoolSnapshot };
