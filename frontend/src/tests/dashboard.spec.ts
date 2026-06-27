import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import DashboardView from '@/features/dashboard/views/DashboardView.vue';
import { useSessionStore } from '@/stores/session';
import { setupTestContext } from '@/tests/test-utils';

describe('dashboard view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders simplified dashboard metrics', async () => {
    const { pinia, vueQueryPlugin, stubs } = setupTestContext();
    const session = useSessionStore();
    session.wallet = {
      ...session.wallet,
      status: 'bagli',
      address: '0x9f4202C0B16bD96ce821bFCC0C4BbA9469522635',
      isSupportedNetwork: true,
    };

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [pinia, vueQueryPlugin],
        stubs,
      },
    });

    await vi.runAllTimersAsync();
    await flushPromises();

    expect(wrapper.text()).toContain('Kullanilabilir limit');
    expect(wrapper.text()).toContain('Acik borc');
    expect(wrapper.text()).toContain('Son hareketler');
  });
});
