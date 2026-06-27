import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { calculateRepaymentLift } from '@/shared/lib/calculations';
import { useSessionStore } from '@/stores/session';

export const useDashboardQuery = () => {
  const session = useSessionStore();

  return useQuery({
    queryKey: ['dashboard', () => session.wallet.address],
    queryFn: () => dataAdapter.getDashboardSnapshot(session.wallet.address),
    enabled: () => Boolean(session.wallet.address),
  });
};

export const usePoolQuery = () => {
  const session = useSessionStore();

  return useQuery({
    queryKey: ['pool', () => session.wallet.address],
    queryFn: () => dataAdapter.getPoolSnapshot(session.wallet.address),
    enabled: () => Boolean(session.wallet.address),
  });
};

export const useHistoryQuery = () => {
  const session = useSessionStore();

  return useQuery({
    queryKey: ['history', () => session.wallet.address],
    queryFn: () => dataAdapter.getHistorySnapshot(session.wallet.address),
    enabled: () => Boolean(session.wallet.address),
  });
};

export const useRepaymentProjection = (amount: () => number) => {
  const { data } = useDashboardQuery();
  const session = useSessionStore();

  return computed(() => {
    if (!data.value || !session.isAppReady) {
      return 0;
    }

    return calculateRepaymentLift(amount(), data.value.loanPosition, data.value.creditLimit);
  });
};
