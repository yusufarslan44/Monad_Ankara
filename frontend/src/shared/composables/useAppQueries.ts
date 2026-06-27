import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { calculateRepaymentLift } from '@/shared/lib/calculations';
import { useSessionStore } from '@/stores/session';

export const useDashboardQuery = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dataAdapter.getDashboardSnapshot(),
  });

export const useGuaranteeQuery = () =>
  useQuery({
    queryKey: ['guarantees'],
    queryFn: () => dataAdapter.getGuaranteeSnapshot(),
  });

export const useHistoryQuery = () =>
  useQuery({
    queryKey: ['history'],
    queryFn: () => dataAdapter.getHistorySnapshot(),
  });

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
