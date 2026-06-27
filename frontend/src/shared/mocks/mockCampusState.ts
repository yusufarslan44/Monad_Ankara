import type {
  ActivityItem,
  CampusIdentityStatus,
  CreditLimit,
  DashboardSnapshot,
  GuaranteeRequest,
  GuaranteeSnapshot,
  GuarantorExposure,
  HistorySnapshot,
  LoanPosition,
  LoanQuote,
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
  exposures: GuarantorExposure[];
  requests: GuaranteeRequest[];
  activity: ActivityItem[];
}

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
    guaranteedMON: 2.2,
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
  exposures: [
    {
      id: 'gx-1',
      friendName: 'Ece Demir',
      amountMON: 1.4,
      risk: 'Dusuk',
      status: 'Aktif',
      note: '2 parcali odeme ritminde.',
    },
    {
      id: 'gx-2',
      friendName: 'Mert Ayaz',
      amountMON: 2.1,
      risk: 'Orta',
      status: 'Bekliyor',
      note: 'Limit asimi icin ek teyit bekleniyor.',
    },
  ],
  requests: [
    {
      id: 'gr-1',
      friendName: 'Selin Arin',
      amountMON: 1.8,
      message: 'Kantin ve ulasim gideri icin 72 saatlik destek istiyor.',
      requestedAt: '10 dk once',
      status: 'Bekliyor',
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
      type: 'kefalet',
      title: 'Yeni kefalet talebi alindi',
      description: 'Selin Arin senden 1.8 MON kefalet tamponu istedi.',
      at: 'Bugun 09:05',
      amountMON: 1.8,
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
  guarantorExposure: clone(state.exposures),
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
  async submitCampusEmail(name: string, university: string, email: string) {
    await delay(350);

    if (!email.endsWith('.edu.tr')) {
      throw new Error('Lutfen gecerli bir universite e-postasi gir.');
    }

    state.studentProfile.name = name;
    state.studentProfile.university = university;
    state.studentProfile.email = email;
    state.identity = {
      status: 'dogrulandi',
      emailEligible: true,
      email,
      verifiedAt: 'Az once',
      soulboundReady: true,
    };

    state.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'itibar',
      title: 'Kampus kimligi olusturuldu',
      description: 'Soulbound ogrenci kimligi cuzdana hazir hale geldi.',
      at: 'Simdi',
      tone: 'positive',
    });

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
  async getGuaranteeSnapshot(): Promise<GuaranteeSnapshot> {
    await delay();
    return {
      exposures: clone(state.exposures),
      requests: clone(state.requests),
    };
  },
  async getHistorySnapshot(): Promise<HistorySnapshot> {
    await delay();
    return {
      items: clone(state.activity),
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
      state.requests.unshift({
        id: `gr-${Date.now()}`,
        friendName: 'Acil Kefalet Havuzu',
        amountMON: Number((amountMON - state.creditLimit.availableMON).toFixed(2)),
        message: `${purpose} icin limit ustu talep acildi.`,
        requestedAt: 'Simdi',
        status: 'Bekliyor',
      });

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
  async approveGuaranteeRequest(requestId: string) {
    await delay(250);
    const request = state.requests.find((item) => item.id === requestId);

    if (!request) {
      throw new Error('Talep bulunamadi.');
    }

    request.status = 'Onaylandi';
    state.exposures.unshift({
      id: `gx-${Date.now()}`,
      friendName: request.friendName,
      amountMON: request.amountMON,
      risk: request.amountMON > 2 ? 'Orta' : 'Dusuk',
      status: 'Aktif',
      note: 'Yeni kefalet tamponu eklendi.',
    });
    state.creditLimit.guaranteedMON = Number((state.creditLimit.guaranteedMON + request.amountMON).toFixed(2));
    state.activity.unshift({
      id: `act-${Date.now()}`,
      type: 'kefalet',
      title: 'Kefalet talebi onaylandi',
      description: `${request.friendName} icin sosyal guven tamponu aktiflesti.`,
      at: 'Simdi',
      amountMON: request.amountMON,
      tone: 'neutral',
    });

    return {
      exposures: clone(state.exposures),
      requests: clone(state.requests),
    };
  },
  reset() {
    Object.assign(state, createInitialState());
  },
};
