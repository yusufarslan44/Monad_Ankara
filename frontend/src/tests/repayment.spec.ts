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
        isInstalled: true,
        isSupportedNetwork: true,
        providerLabel: 'MetaMask',
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
    const amountButton = wrapper.findAll('button').find((button) => button.text().includes('2 MON'));
    expect(amountButton).toBeTruthy();
    await amountButton!.trigger('click');
    await vi.runAllTimersAsync();
    await flushPromises();

    expect(wrapper.text()).toContain('7,20 MON');
    expect(wrapper.text()).toContain('Tahmini yeni limit');
  });
});
