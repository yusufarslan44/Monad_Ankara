import { dashboardApi } from '@/shared/adapters/dashboardApi';
import { poolApi } from '@/shared/adapters/poolApi';
import type { PoolDepositInput } from '@/shared/types/domain';
import { mockCampusApi } from '@/shared/mocks/mockCampusState';

const IS_TEST =
  import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true';

const withAddress = (address: string | undefined): string => {
  if (!address) {
    throw new Error('Islem icin cuzdan adresi gerekli.');
  }

  return address;
};

export const dataAdapter = {
  getSessionSnapshot: () => mockCampusApi.getSessionSnapshot(),
  getDashboardSnapshot: (address?: string) =>
    IS_TEST
      ? mockCampusApi.getDashboardSnapshot()
      : dashboardApi.getDashboardSnapshot(withAddress(address)),
  getHistorySnapshot: (address?: string) =>
    IS_TEST
      ? mockCampusApi.getHistorySnapshot()
      : dashboardApi.getDashboardSnapshot(withAddress(address)).then((snapshot) => ({ items: snapshot.activity })),
  getPoolSnapshot: (address?: string) =>
    IS_TEST ? mockCampusApi.getPoolSnapshot() : poolApi.getPoolSnapshot(withAddress(address)),
  getPoolQuote: (amountMON: number, lockDays: number) => mockCampusApi.getPoolQuote(amountMON, lockDays),
  deposit: (input: PoolDepositInput) => mockCampusApi.deposit(input),
  withdraw: (depositId: string) => mockCampusApi.withdraw(depositId),
  getLoanQuote: (amountMON: number) => mockCampusApi.getLoanQuote(amountMON),
  submitLoanRequest: (amountMON: number, purpose: string) =>
    mockCampusApi.submitLoanRequest(amountMON, purpose),
  submitRepayment: (amountMON: number) => mockCampusApi.submitRepayment(amountMON),
  reset: () => mockCampusApi.reset(),
};
