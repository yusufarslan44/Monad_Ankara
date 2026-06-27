import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia, setActivePinia } from 'pinia';
import { RouterLinkStub } from '@vue/test-utils';
import type { Plugin } from 'vue';
import { dataAdapter } from '@/shared/adapters/dataAdapter';

export const setupTestContext = () => {
  dataAdapter.reset();
  const pinia = createPinia();
  setActivePinia(pinia);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    pinia,
    queryClient,
    vueQueryPlugin: [VueQueryPlugin as Plugin, { queryClient }] as [Plugin, { queryClient: QueryClient }],
    stubs: {
      RouterLink: RouterLinkStub,
    },
  };
};
