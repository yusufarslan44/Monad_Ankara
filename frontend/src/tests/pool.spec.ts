import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PoolView from '@/features/pool/views/PoolView.vue';
import { useSessionStore } from '@/stores/session';
import { setupTestContext } from '@/tests/test-utils';

describe('pool view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders pool metrics and deposit form', async () => {
    const { pinia, vueQueryPlugin, stubs } = setupTestContext();
    const session = useSessionStore();
    session.wallet = {
      ...session.wallet,
      status: 'bagli',
      address: '0x9f4202C0B16bD96ce821bFCC0C4BbA9469522635',
      isSupportedNetwork: true,
    };

    const wrapper = mount(PoolView, {
      global: {
        plugins: [pinia, vueQueryPlugin],
        stubs,
      },
    });

    await vi.runAllTimersAsync();
    await flushPromises();

    expect(wrapper.text()).toContain('Toplam havuz');
    expect(wrapper.text()).toContain('Yillik getiri');
    expect(wrapper.text()).toContain('Havza yatir');
  });
});
