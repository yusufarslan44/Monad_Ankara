import type {
  ActivityItem,
  CampusIdentityStatus,
  CreditLimit,
  DashboardSnapshot,
  HistorySnapshot,
  LoanPosition,
  LoanQuote,
  PoolDeposit,
  PoolDepositInput,
  PoolQuote,
  PoolSnapshot,
  RepaymentInstallment,
  ReputationSnapshot,
  SessionSnapshot,
  StudentProfile,
  WalletState,
} from '@/shared/types/domain';
import { calculateLoanFee, getPrimaryAction } from '@/shared/lib/calculations';

interface MockCampusState {
  studentProfile: StudentProfile;
  identity: CampusIdentityStatus;
  wallet: WalletState;
  creditLimit: CreditLimit;
  loanPosition: LoanPosition;
  reputation: ReputationSnapshot;
  repaymentSchedule: RepaymentInstallment[];
  activity: ActivityItem[];
  poolPosition: PoolSnapshot;
}

const GLOBAL_APY_BPS = 500;

const calculatePoolInterest = (amountMON: number, lockDays: number, apyBps: number): number => {
  return Number(((amountMON * apyBps * lockDays) / (10_000 * 365)).toFixed(4));
};

const createInitialState = (): MockCampusState => ({
  studentProfile: {
    id: 'student-01',
    name: 'Derya Kaya',
    university: 'Yildiz Teknik Universitesi',
    email: '',
    campusSegment: 'Davutpasa',
    joinedAt: 'Haziran 2026',
  },
  identity: {
    status: 'baslamadi',
    emailEligible: false,
    email: '',
    soulboundReady: false,
  },
  wallet: {
    status: 'bagli-degil',
    network: 'Monad Testnet',
    isInstalled: true,
    isSupportedNetwork: true,
    providerLabel: 'MetaMask',
  },
  creditLimit: {
    totalMON: 12.5,
    availableMON: 5.8,
    guaranteedMON: 0,
    scoreBand: 'Baslangic+',
    nextUnlockMON: 2.4,
  },
  loanPosition: {
    principalMON: 3.1,
    outstandingMON: 3.42,
    microFeeMON: 0.32,
    accruedInterestMON: 0.18,
    status: 'Acil ihtiyac aktif',
  },
  reputation: {
    score: 74,
    trend: 'Yukseliyor',
    streak: 4,
    rehabEligible: false,
    summary: 'Son iki odemede duzen korundugu icin limit toparlanmasi hizlandi.',
  },
  repaymentSchedule: [
    {
      id: 'rp-1',
      amountMON: 1.2,
      dueLabel: 'Bugun uygun',
      status: 'siradaki',
      note: 'Bugun bu tutar odenirse limitte hizli toparlanma olur.',
    },
    {
      id: 'rp-2',
      amountMON: 0.8,
      dueLabel: '48 saat icinde',
      status: 'siradaki',
      note: 'Gecikme olmadan parcali odeme secenegi.',
    },
    {
      id: 'rp-3',
      amountMON: 0.5,
      dueLabel: 'Dun kacirildi',
      status: 'riskli',
      note: 'Ufak bir gecikme sinyali. Itibar puani etkilenmeden kapatilabilir.',
    },
  ],
  activity: [
    {
      id: 'act-1',
      type: 'odeme',
      title: 'Parcali odeme yapildi',
      description: '0.7 MON odeme sonrasinda kullanilabilir limit yeniden acildi.',
      at: 'Bugun 11:20',
      amountMON: 0.7,
      tone: 'positive',
    },
    {
      id: 'act-2',
      type: 'havuz',
      title: 'Havuz yatirimi yapildi',
      description: '2.0 MON, 30 gunlugune kilitlendi; tahmini faiz 0.08 MON.',
      at: 'Bugun 09:05',
      amountMON: 2,
      tone: 'neutral',
    },
    {
      id: 'act-3',
      type: 'itibar',
      title: 'Itibar bandi guclendi',
      description: 'Duzenli odeme ritmi sayesinde Baslangic+ skorunda artis var.',
      at: 'Dun',
      tone: 'positive',
    },
  ],
  poolPosition: {
    walletBalanceMON: 12.34,
    totalDepositedMON: 24.5,
    totalBorrowedMON: 8.2,
    availableLiquidityMON: 16.3,
    globalApyBps: GLOBAL_APY_BPS,
    projectedInterestMON: 0.21,
    userDeposits: [
      {
        id: 'pd-1',
        amountMON: 2,
        lockDays: 30,
        apyBps: GLOBAL_APY_BPS,
        depositedAt: 'Bugun 09:05',
        maturesAt: '30 gun sonra',
        status: 'Aktif',
        projectedInterestMON: calculatePoolInterest(2, 30, GLOBAL_APY_BPS),
      },
      {
        id: 'pd-2',
        amountMON: 1.5,
        lockDays: 7,
        apyBps: GLOBAL_APY_BPS,
        depositedAt: 'Dun',
        maturesAt: '5 gun sonra',
        status: 'Cozulebilir',
        projectedInterestMON: calculatePoolInterest(1.5, 7, GLOBAL_APY_BPS),
      },
    ],
  },
});

const state = createInitialState();

const clone = <T>(value: T) => structuredClone(value);
const delay = (ms = 250) => new Promise((resolve) => window.setTimeout(resolve, ms));

const buildSessionSnapshot = (): SessionSnapshot => ({
  studentProfile: clone(state.studentProfile),
  identity: clone(state.identity),
  wallet: clone(state.wallet),
});

const buildDashboardSnapshot = (): DashboardSnapshot => ({
  studentProfile: clone(state.studentProfile),
  campusIdentity: clone(state.identity),
  creditLimit: clone(state.creditLimit),
  loanPosition: clone(state.loanPosition),
  poolPosition: clone(state.poolPosition),
  reputation: clone(state.reputation),
  repaymentSchedule: clone(state.repaymentSchedule),
  activity: clone(state.activity),
  nextAction: getPrimaryAction(state.loanPosition),
});

export const mockCampusApi = {
  async getSessionSnapshot() {
    await delay();
    return buildSessionSnapshot();
  },
  async connectWallet() {
    await delay(300);
    state.wallet = {
      status: 'bagli',
      address: '0x9f4202C0B16bD96ce821bFCC0C4BbA9469522635',
      network: 'Monad Testnet',
      chainId: '0x279f',
      isInstalled: true,
      isSupportedNetwork: true,
      providerLabel: 'MetaMask',
    };
    return buildSessionSnapshot();
  },
  async disconnectWallet() {
    await delay(150);
    state.wallet = {
      status: 'bagli-degil',
      network: 'Monad Testnet',
      isInstalled: true,
      isSupportedNetwork: true,
      providerLabel: 'MetaMask',
    };
    return buildSessionSnapshot();
  },
  async getDashboardSnapshot() {
    await delay();
    return buildDashboardSnapshot();
  },
  async getHistorySnapshot(): Promise<HistorySnapshot> {
    await delay();
    return {
      items: clone(state.activity),
    };
  },
  async getPoolSnapshot(): Promise<PoolSnapshot> {
    await delay();
    return clone(state.poolPosition);
  },
  async getPoolQuote(amountMON: number, lockDays: number): Promise<PoolQuote> {
    await delay(150);
    return {
      amountMON,
      lockDays,
      apyBps: GLOBAL_APY_BPS,
      projectedInterestMON: calculatePoolInterest(amountMON, lockDays, GLOBAL_APY_BPS),
    };
  },
  async getLoanQuote(amountMON: number): Promise<LoanQuote> {
    await delay(150);
    const fee = calculateLoanFee(amountMON, state.reputation.score);
    const requiresGuarantee = amountMON > state.creditLimit.availableMON;
    return {
      amountMON,
      microFeeMON: fee,
      totalRepayableMON: Number((amountMON + fee).toFixed(2)),
      projectedAvailableMON: Number(
        Math.max(state.creditLimit.availableMON - amountMON, 0).toFixed(2),
      ),
      requiresGuarantee,
    };
  },
  async submitLoanRequest(amountMON: number, purpose: string) {
    const quote = await this.getLoanQuote(amountMON);

    if (quote.requiresGuarantee) {
      throw new Error('Bu tutar icin sosyal kefalet tamponu gerekli.');
    }

    state.loanPosition.principalMON = Number((state.loanPosition.principalMON + amountMON).toFixed(2));
    state.loanPosition.microFeeMON = Number((state.loanPosition.microFeeMON + quote.microFeeMON).toFixed(2));
    state.loanPosition.outstandingMON = Number(
      (state.loanPosition.outstandingMON + quote.totalRepayableMON).toFixed(2),
    );
    state.creditLimit.availableMON = quote.projectedAvailableMON;
    state.reputation.summary = 'Yeni kredi cekimine ragmen limit disiplini korunuyor.';
    state.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'borc',
      title: 'Yeni nano-kredi acildi',
      description: `${purpose} ihtiyaci icin hizli kullanim tamamlandi.`,
      at: 'Simdi',
      amountMON,
      tone: 'neutral',
    });

    return buildDashboardSnapshot();
  },
  async submitRepayment(amountMON: number) {
    await delay(250);
    const safeAmount = Number(Math.min(amountMON, state.loanPosition.outstandingMON).toFixed(2));
    state.loanPosition.outstandingMON = Number((state.loanPosition.outstandingMON - safeAmount).toFixed(2));
    state.creditLimit.availableMON = Number(
      Math.min(
        state.creditLimit.totalMON - state.creditLimit.guaranteedMON,
        state.creditLimit.availableMON + safeAmount * 0.72,
      ).toFixed(2),
    );
    state.reputation.score = Math.min(state.reputation.score + 1, 99);
    state.reputation.trend = 'Yukseliyor';
    state.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'odeme',
      title: 'Parcali odeme tamamlandi',
      description: `${safeAmount} MON odeme ile limit baskisi azaldi.`,
      at: 'Simdi',
      amountMON: safeAmount,
      tone: 'positive',
    });

    if (state.loanPosition.outstandingMON === 0) {
      state.loanPosition.status = 'Acik borc yok';
      state.reputation.summary = 'Tum acik borc kapandi. Rehabilitasyon bandi acildi.';
      state.reputation.rehabEligible = true;
    }

    return buildDashboardSnapshot();
  },
  async deposit(input: PoolDepositInput) {
    await delay(250);
    const interest = calculatePoolInterest(input.amountMON, input.lockDays, GLOBAL_APY_BPS);
    const deposit: PoolDeposit = {
      id: `pd-${Date.now()}`,
      amountMON: input.amountMON,
      lockDays: input.lockDays,
      apyBps: GLOBAL_APY_BPS,
      depositedAt: 'Simdi',
      maturesAt: `${input.lockDays} gun sonra`,
      status: input.lockDays > 0 ? 'Aktif' : 'Cozulebilir',
      projectedInterestMON: interest,
    };

    state.poolPosition.userDeposits.unshift(deposit);
    state.poolPosition.totalDepositedMON = Number(
      (state.poolPosition.totalDepositedMON + input.amountMON).toFixed(4),
    );
    state.poolPosition.availableLiquidityMON = Number(
      (state.poolPosition.availableLiquidityMON + input.amountMON).toFixed(4),
    );
    state.poolPosition.projectedInterestMON = Number(
      (state.poolPosition.projectedInterestMON + interest).toFixed(4),
    );
    state.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'havuz',
      title: 'Havuz yatirimi yapildi',
      description: `${input.amountMON} MON, ${input.lockDays} gunlugune kilitlendi.`,
      at: 'Simdi',
      amountMON: input.amountMON,
      tone: 'neutral',
    });

    return clone(state.poolPosition);
  },
  async withdraw(depositId: string) {
    await delay(250);
    const index = state.poolPosition.userDeposits.findIndex((item) => item.id === depositId);

    if (index === -1) {
      throw new Error('Yatirim bulunamadi.');
    }

    const deposit = state.poolPosition.userDeposits[index];
    state.poolPosition.userDeposits.splice(index, 1);
    state.poolPosition.totalDepositedMON = Number(
      Math.max(0, state.poolPosition.totalDepositedMON - deposit.amountMON).toFixed(4),
    );
    state.poolPosition.availableLiquidityMON = Number(
      Math.max(0, state.poolPosition.availableLiquidityMON - deposit.amountMON).toFixed(4),
    );
    state.poolPosition.projectedInterestMON = Number(
      Math.max(0, state.poolPosition.projectedInterestMON - deposit.projectedInterestMON).toFixed(4),
    );
    state.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'havuz',
      title: 'Havuz yatirimi cekildi',
      description: `${deposit.amountMON} MON ana para + faiz geri alindi.`,
      at: 'Simdi',
      amountMON: deposit.amountMON,
      tone: 'positive',
    });

    return clone(state.poolPosition);
  },
  reset() {
    Object.assign(state, createInitialState());
  },
};
