const { ethers } = require("ethers");
const User = require("../models/User");
const chainService = require("./chainService");
const CreditScore = require("./../models/CreditScore");

/**
 * Adres icin AI kredi-skoru varsa dashboard reputation'ini onunla degistirir.
 * Sekil (score/trend/streak/rehabEligible/summary) korunur; frontend degismez.
 */
async function applyAiReputation(address, fallbackReputation) {
  try {
    const ai = await CreditScore.findOne({ address });
    if (!ai) return fallbackReputation;
    return {
      score: ai.score,
      trend: ai.trend,
      streak: fallbackReputation && fallbackReputation.streak != null ? fallbackReputation.streak : 0,
      rehabEligible: fallbackReputation ? Boolean(fallbackReputation.rehabEligible) : false,
      summary: ai.summary || (fallbackReputation && fallbackReputation.summary) || "",
    };
  } catch (_) {
    return fallbackReputation;
  }
}

const LENDING_POOL_ABI = [
  "function creditLimit(address user) view returns (uint256)",
  "function borrowed(address user) view returns (uint256)",
  "function borrowedAt(address user) view returns (uint256)",
  "function repayCount(address user) view returns (uint256)",
  "function deposits(address user) view returns (uint256)",
  "function totalDeposited() view returns (uint256)",
  "function totalBorrowed() view returns (uint256)",
  "function availableLiquidity() view returns (uint256)",
  "function ANNUAL_RATE_BPS() view returns (uint256)",
  "function currentDebt(address user) view returns (uint256)",
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

function generateFallbackSnapshot(user) {
  // Kontrat yapilandirilmamissa demo veri doner (UI test edilebilir).
  return {
    studentProfile: {
      id: `student-${user.address.slice(-6)}`,
      name: user.name || "Kampus Kullanicisi",
      university: user.university || "",
      email: user.emailDomain ? `@${user.emailDomain}` : "",
      campusSegment: "",
      joinedAt: new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
    },
    campusIdentity: {
      status: user.verified ? "dogrulandi" : "baslamadi",
      emailEligible: Boolean(user.emailDomain),
      email: user.emailDomain ? `*@${user.emailDomain}` : "",
      verifiedAt: user.createdAt,
      soulboundReady: user.registered,
    },
    creditLimit: {
      totalMON: 12.5,
      availableMON: 5.8,
      guaranteedMON: 0,
      scoreBand: "Baslangic+",
      nextUnlockMON: 2.4,
    },
    loanPosition: {
      principalMON: 3.1,
      outstandingMON: 3.42,
      microFeeMON: 0.32,
      accruedInterestMON: 0.18,
      status: "Acil ihtiyac aktif",
    },
    poolPosition: {
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
    },
    reputation: {
      score: 74,
      trend: "Yukseliyor",
      streak: 0,
      rehabEligible: false,
      summary: "On-chain veri okunamadigi icin demo veri gosteriliyor. Kontratlari deploy edip LENDING_POOL_ADDRESS eklersen gercek veriler akacak.",
    },
    repaymentSchedule: [],
    activity: [
      {
        id: "act-fallback-1",
        type: "itibar",
        title: "Kampus kimligi olusturuldu",
        description: "E-posta dogrulamasi tamamlandi.",
        at: "Simdi",
        tone: "positive",
      },
    ],
    nextAction: "borc-al",
  };
}

function buildRepaymentSchedule(outstandingMON) {
  if (outstandingMON <= 0) {
    return [];
  }

  const installmentCount = 3;
  const base = Number((outstandingMON / installmentCount).toFixed(2));
  const schedule = [];
  const labels = ["Bugun uygun", "30 gun icinde", "60 gun icinde"];
  const notes = [
    "Ilk taksit; duzenli odeme itibari guclendirir.",
    "Ikinci taksit; gecikme olmadan odeme limiti acar.",
    "Son taksit; borc tamamen kapanir.",
  ];

  for (let i = 0; i < installmentCount; i++) {
    const amount = i === installmentCount - 1 ? Number((outstandingMON - base * (installmentCount - 1)).toFixed(2)) : base;
    schedule.push({
      id: `rp-${i + 1}`,
      amountMON: amount,
      dueLabel: labels[i],
      status: i === 0 ? "siradaki" : "riskli",
      note: notes[i],
    });
  }

  return schedule;
}

function calculateReputation(repayCount, hasDebt) {
  const base = 50;
  const score = Math.min(99, base + repayCount * 10 + (hasDebt ? 0 : 5));
  let trend = "Dengeli";
  if (repayCount >= 2) trend = "Yukseliyor";
  if (hasDebt) trend = "Baski Altinda";

  return {
    score,
    trend,
    streak: repayCount,
    rehabEligible: false,
    summary: hasDebt
      ? "Acik borc var; duzenli odeme itibari toparlar."
      : "Acik borc yok; yatirim ve odeme ritmi skoru yukseltir.",
  };
}

async function isRegisteredOnChain(address) {
  try {
    return await chainService.isRegistered(address);
  } catch {
    return false;
  }
}

async function getDashboardSnapshot(address) {
  const normalizedAddress = String(address).toLowerCase().trim();
  const user = await User.findOne({ address: normalizedAddress });

  if (!user) {
    return null;
  }

  const registered = await isRegisteredOnChain(normalizedAddress);

  let contractData;
  try {
    const contract = getLendingPoolContract();
    const creditLimitWei = await contract.creditLimit(normalizedAddress);
    const borrowedWei = await contract.borrowed(normalizedAddress);
    const repayCount = await contract.repayCount(normalizedAddress);
    const depositWei = await contract.deposits(normalizedAddress);
    const totalDepositedWei = await contract.totalDeposited();
    const totalBorrowedWei = await contract.totalBorrowed();
    const availableLiquidityWei = await contract.availableLiquidity();
    const apyBpsWei = await contract.ANNUAL_RATE_BPS();
    const baseCreditWei = await contract.BASE_CREDIT();
    const currentDebtWei = await contract.currentDebt(normalizedAddress);
    const principalMON = toMON(borrowedWei);
    const outstandingMON = toMON(currentDebtWei);
    const accruedInterestMON = Number(Math.max(0, outstandingMON - principalMON).toFixed(4));
    const baseCreditMON = toMON(baseCreditWei);
    // Yeni ogrencinin zincirdeki limiti 0'dir; ilk borc'ta kontrat BASE_CREDIT atar.
    // Bu yuzden gercek kullanilabilir limit = mevcut limit veya (limit 0 ise) BASE_CREDIT.
    const effectiveLimitMON = toMON(creditLimitWei) > 0 ? toMON(creditLimitWei) : baseCreditMON;
    const creditLimitMON = effectiveLimitMON;
    const depositMON = toMON(depositWei);
    const totalDepositedMON = toMON(totalDepositedWei);
    const totalBorrowedMON = toMON(totalBorrowedWei);
    const availableLiquidityMON = toMON(availableLiquidityWei);
    const apyBps = Number(apyBpsWei);
    const repayCountNum = Number(repayCount);

    const lockDays = 30;
    const projectedInterestMON = Number(((depositMON * apyBps * lockDays) / (10_000 * 365)).toFixed(4));

    contractData = {
      creditLimit: {
        totalMON: creditLimitMON,
        availableMON: Number(Math.max(0, creditLimitMON - principalMON).toFixed(4)),
        guaranteedMON: 0,
        scoreBand: creditLimitMON > 0 ? "Baslangic+" : "-",
        nextUnlockMON: 0,
      },
      loanPosition: {
        principalMON,
        outstandingMON,
        microFeeMON: 0,
        accruedInterestMON,
        status: outstandingMON > 0 ? "Acik borc" : "Acik borc yok",
      },
      poolPosition: {
        totalDepositedMON,
        totalBorrowedMON,
        availableLiquidityMON,
        globalApyBps: apyBps || 500,
        projectedInterestMON,
        userDeposits: depositMON > 0
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
      },
      reputation: calculateReputation(repayCountNum, outstandingMON > 0),
      repaymentSchedule: buildRepaymentSchedule(outstandingMON),
      activity: [
        ...(depositMON > 0
          ? [
              {
                id: "act-deposit",
                type: "havuz",
                title: "Havuz yatirimi aktif",
                description: `${depositMON.toFixed(2)} MON havuza kilitli.`,
                at: "Simdi",
                amountMON: depositMON,
                tone: "neutral",
              },
            ]
          : []),
        ...(outstandingMON > 0
          ? [
              {
                id: "act-loan",
                type: "borc",
                title: "Acik borc",
                description: `${outstandingMON.toFixed(2)} MON geri odeme bekleniyor.`,
                at: "Simdi",
                amountMON: outstandingMON,
                tone: "warning",
              },
            ]
          : []),
        {
          id: "act-identity",
          type: "itibar",
          title: "Kampus kimligi aktif",
          description: registered ? "Soulbound ogrenci kimligi zincirde dogrulandi." : "E-posta dogrulamasi tamamlandi.",
          at: "Simdi",
          tone: "positive",
        },
      ],
      nextAction: outstandingMON > 1 ? "odeme-yap" : "borc-al",
    };
  } catch (err) {
    console.warn("On-chain veri okunamadi, fallback snapshot kullaniliyor:", err.message);
    const snapshot = generateFallbackSnapshot(user);
    snapshot.reputation = await applyAiReputation(normalizedAddress, snapshot.reputation);
    return snapshot;
  }

  // AI kredi-skoru varsa reputation'i onunla degistir (yoksa deterministik kalir).
  contractData.reputation = await applyAiReputation(normalizedAddress, contractData.reputation);

  return {
    studentProfile: {
      id: `student-${user.address.slice(-6)}`,
      name: user.name || "Kampus Kullanicisi",
      university: user.university || "",
      email: user.emailDomain ? `*@${user.emailDomain}` : "",
      campusSegment: "",
      joinedAt: new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
    },
    campusIdentity: {
      status: user.verified ? "dogrulandi" : "baslamadi",
      emailEligible: Boolean(user.emailDomain),
      email: user.emailDomain ? `*@${user.emailDomain}` : "",
      verifiedAt: user.createdAt,
      soulboundReady: user.registered,
    },
    ...contractData,
  };
}

module.exports = { getDashboardSnapshot };
