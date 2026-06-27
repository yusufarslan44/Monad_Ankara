import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import router from '@/app/router';
import OnboardingView from '@/features/onboarding/views/OnboardingView.vue';
import { setupTestContext } from '@/tests/test-utils';

describe('onboarding integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('moves from email verification to wallet connect and lands on dashboard', async () => {
    const { pinia } = setupTestContext();

    const navigation = router.push('/uygulama');
    await vi.runAllTimersAsync();
    await navigation;
    await flushPromises();

    const wrapper = mount(OnboardingView, {
      global: {
        plugins: [pinia, router],
      },
    });

    await vi.runAllTimersAsync();
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    await vi.runAllTimersAsync();
    await flushPromises();

    const walletButton = wrapper.findAll('button').find((button) => button.text().includes('MetaMask ile baglan'));
    expect(walletButton).toBeTruthy();

    await walletButton!.trigger('click');
    await vi.runAllTimersAsync();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/uygulama/panel');
  });
});
