export interface StudentProfile {
  id: string;
  name: string;
  university: string;
  email: string;
  campusSegment: string;
  joinedAt: string;
}

export interface CampusIdentityStatus {
  status: 'baslamadi' | 'dogrulaniyor' | 'dogrulandi';
  emailEligible: boolean;
  email: string;
  verifiedAt?: string;
  soulboundReady: boolean;
}

export interface CreditLimit {
  totalMON: number;
  availableMON: number;
  guaranteedMON: number;
  scoreBand: string;
  nextUnlockMON: number;
}

export interface LoanPosition {
  principalMON: number;
  outstandingMON: number;
  microFeeMON: number;
  accruedInterestMON: number;
  status: string;
}

export interface RepaymentInstallment {
  id: string;
  amountMON: number;
  dueLabel: string;
  status: 'tamamlandi' | 'siradaki' | 'riskli';
  note: string;
}

export interface GuarantorExposure {
  id: string;
  friendName: string;
  amountMON: number;
  risk: 'Dusuk' | 'Orta' | 'Yuksek';
  status: 'Aktif' | 'Bekliyor' | 'Tamamlandi';
  note: string;
}

export interface ReputationSnapshot {
  score: number;
  trend: 'Yukseliyor' | 'Dengeli' | 'Baski Altinda';
  streak: number;
  rehabEligible: boolean;
  summary: string;
}

export interface ActivityItem {
  id: string;
  type: 'odeme' | 'borc' | 'kefalet' | 'itibar';
  title: string;
  description: string;
  at: string;
  amountMON?: number;
  tone: 'positive' | 'neutral' | 'warning';
}

export interface DashboardSnapshot {
  studentProfile: StudentProfile;
  campusIdentity: CampusIdentityStatus;
  creditLimit: CreditLimit;
  loanPosition: LoanPosition;
  guarantorExposure: GuarantorExposure[];
  reputation: ReputationSnapshot;
  repaymentSchedule: RepaymentInstallment[];
  activity: ActivityItem[];
  nextAction: 'borc-al' | 'odeme-yap';
}

export interface LoanRequestInput {
  amountMON: number;
  purpose: string;
}

export interface LoanQuote {
  amountMON: number;
  microFeeMON: number;
  totalRepayableMON: number;
  projectedAvailableMON: number;
  requiresGuarantee: boolean;
}

export interface GuaranteeRequest {
  id: string;
  friendName: string;
  amountMON: number;
  message: string;
  requestedAt: string;
  status: 'Bekliyor' | 'Onaylandi';
}

export interface GuaranteeSnapshot {
  exposures: GuarantorExposure[];
  requests: GuaranteeRequest[];
}

export interface HistorySnapshot {
  items: ActivityItem[];
}

export interface WalletState {
  status: 'bagli-degil' | 'baglaniyor' | 'bagli';
  address?: string;
  network: string;
  chainId?: string;
  isInstalled?: boolean;
  isSupportedNetwork?: boolean;
  providerLabel?: string;
  error?: string;
}

export interface SessionSnapshot {
  studentProfile: StudentProfile;
  identity: CampusIdentityStatus;
  wallet: WalletState;
}
