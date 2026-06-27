import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import RepaymentView from '@/features/repayment/views/RepaymentView.vue';
import { setupTestContext } from '@/tests/test-utils';
import { useSessionStore } from '@/stores/session';

describe('repayment flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('updates the projected limit text when payment amount changes', async () => {
    const { pinia, vueQueryPlugin, stubs } = setupTestContext();
    const session = useSessionStore();
    session.$patch({
      identity: {
        status: 'dogrulandi',
        emailEligible: true,
        email: 'derya@std.yildiz.edu.tr',
        soulboundReady: true,
      },
      wallet: {
        status: 'bagli',
        address: '0x9f4202C0B16bD96ce821bFCC0C4BbA9469522635',
        network: 'Monad Testnet',
      },
      bootstrapped: true,
    });

    const wrapper = mount(RepaymentView, {
      global: {
        plugins: [pinia, vueQueryPlugin],
        stubs,
      },
    });

    await vi.runAllTimersAsync();
    await flushPromises();
    await wrapper.find('input[type="number"]').setValue('2');
    await flushPromises();

    expect(wrapper.text()).toContain('7,20 MON');
    expect(wrapper.text()).toContain('Tahmini yeni limit');
  });
});
