import { apiClient } from '@/shared/lib/apiClient';
import type { PoolSnapshot } from '@/shared/types/domain';

export const poolApi = {
  getPoolSnapshot(address: string) {
    return apiClient
      .get<{ success: true; data: PoolSnapshot }>('/pool', { address })
      .then((response) => response.data);
  },
};
