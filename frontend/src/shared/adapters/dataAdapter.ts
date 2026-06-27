import { dashboardApi } from '@/shared/adapters/dashboardApi';
import { poolApi } from '@/shared/adapters/poolApi';
import { walletAdapter } from '@/shared/adapters/walletAdapter';
import {
  encodeDeposit,
  encodeWithdraw,
  LENDING_POOL_ADDRESS,
  toHexWei,
} from '@/shared/lib/contractHelpers';
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
  deposit: IS_TEST
    ? (input: PoolDepositInput) => mockCampusApi.deposit(input)
    : async (input: PoolDepositInput) => {
        const txHash = await walletAdapter.sendContractTx({
          to: LENDING_POOL_ADDRESS,
          data: encodeDeposit(),
          value: toHexWei(input.amountMON),
        });
        return { txHash };
      },
  withdraw: IS_TEST
    ? (depositId: string) => mockCampusApi.withdraw(depositId)
    : async (input: { amountMON: number }) => {
        const txHash = await walletAdapter.sendContractTx({
          to: LENDING_POOL_ADDRESS,
          data: encodeWithdraw(input.amountMON),
        });
        return { txHash };
      },
  getLoanQuote: (amountMON: number) => mockCampusApi.getLoanQuote(amountMON),
  submitLoanRequest: (amountMON: number, purpose: string) =>
    mockCampusApi.submitLoanRequest(amountMON, purpose),
  submitRepayment: (amountMON: number) => mockCampusApi.submitRepayment(amountMON),
  reset: () => mockCampusApi.reset(),
};
