import type { CreditLimit, LoanPosition, ReputationSnapshot } from '@/shared/types/domain';

export const calculateUsageRatio = (creditLimit: CreditLimit, loanPosition: LoanPosition) => {
  if (creditLimit.totalMON === 0) {
    return 0;
  }

  return Math.min(loanPosition.outstandingMON / creditLimit.totalMON, 1);
};

export const calculateLoanFee = (amountMON: number, score: number) => {
  const baseRate = score >= 78 ? 0.035 : score >= 65 ? 0.042 : 0.055;
  return Number((amountMON * baseRate).toFixed(2));
};

export const calculateRepaymentLift = (
  amountMON: number,
  loanPosition: LoanPosition,
  creditLimit: CreditLimit,
) => {
  if (loanPosition.outstandingMON === 0) {
    return creditLimit.availableMON;
  }

  const recoveryRatio = Math.min(amountMON / loanPosition.outstandingMON, 1);
  return Number(
    Math.min(
      creditLimit.totalMON - creditLimit.guaranteedMON,
      creditLimit.availableMON + creditLimit.nextUnlockMON * recoveryRatio,
    ).toFixed(2),
  );
};

export const getPrimaryAction = (loanPosition: LoanPosition) =>
  loanPosition.outstandingMON > 1 ? 'odeme-yap' : 'borc-al';

export const calculatePoolInterest = (amountMON: number, lockDays: number, apyBps: number): number => {
  return Number(((amountMON * apyBps * lockDays) / (10_000 * 365)).toFixed(4));
};

export const getReputationDelta = (reputation: ReputationSnapshot) => {
  if (reputation.trend === 'Yukseliyor') {
    return '+';
  }

  if (reputation.trend === 'Baski Altinda') {
    return '-';
  }

  return '0';
};
