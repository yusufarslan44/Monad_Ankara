import type { PoolDepositInput } from '@/shared/types/domain';
import { mockCampusApi } from '@/shared/mocks/mockCampusState';

export const dataAdapter = {
  getSessionSnapshot: () => mockCampusApi.getSessionSnapshot(),
  getDashboardSnapshot: () => mockCampusApi.getDashboardSnapshot(),
  getHistorySnapshot: () => mockCampusApi.getHistorySnapshot(),
  getPoolSnapshot: () => mockCampusApi.getPoolSnapshot(),
  getPoolQuote: (amountMON: number, lockDays: number) => mockCampusApi.getPoolQuote(amountMON, lockDays),
  deposit: (input: PoolDepositInput) => mockCampusApi.deposit(input),
  withdraw: (depositId: string) => mockCampusApi.withdraw(depositId),
  getLoanQuote: (amountMON: number) => mockCampusApi.getLoanQuote(amountMON),
  submitLoanRequest: (amountMON: number, purpose: string) =>
    mockCampusApi.submitLoanRequest(amountMON, purpose),
  submitRepayment: (amountMON: number) => mockCampusApi.submitRepayment(amountMON),
  reset: () => mockCampusApi.reset(),
};
