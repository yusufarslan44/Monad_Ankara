import { apiClient } from '@/shared/lib/apiClient';
import type { DashboardSnapshot } from '@/shared/types/domain';

export const dashboardApi = {
  getDashboardSnapshot(address: string) {
    return apiClient
      .get<{ success: true; data: DashboardSnapshot }>('/dashboard', { address })
      .then((response) => response.data);
  },
};
