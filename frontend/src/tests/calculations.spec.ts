import { describe, expect, it } from 'vitest';
import { calculateLoanFee, calculateRepaymentLift } from '@/shared/lib/calculations';

describe('financial helpers', () => {
  it('calculates a lower fee for mid reputation borrowers', () => {
    expect(calculateLoanFee(2, 74)).toBe(0.08);
  });

  it('projects limit recovery after a repayment', () => {
    const result = calculateRepaymentLift(
      1.2,
      {
        principalMON: 3.1,
        outstandingMON: 3.42,
        microFeeMON: 0.32,
        accruedInterestMON: 0.18,
        status: 'Acil ihtiyac aktif',
      },
      {
        totalMON: 12.5,
        availableMON: 5.8,
        guaranteedMON: 2.2,
        scoreBand: 'Baslangic+',
        nextUnlockMON: 2.4,
      },
    );

    expect(result).toBe(6.64);
  });
});
