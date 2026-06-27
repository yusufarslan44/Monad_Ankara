import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import router from '@/app/router';
import OnboardingView from '@/features/onboarding/views/OnboardingView.vue';
import { setupTestContext } from '@/tests/test-utils';

describe('onboarding integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('moves from wallet connect to email verification and lands on dashboard', async () => {
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

    // 1. Cuzdan adimi: MetaMask ile baglan
    const walletButton = wrapper.findAll('button').find((button) =>
      button.text().includes('MetaMask ile baglan'),
    );
    expect(walletButton).toBeTruthy();

    await walletButton!.trigger('click');
    await vi.runAllTimersAsync();
    await flushPromises();

    // 2. Kimlik formunu doldur ve gonder
    const identityForm = wrapper.find('form');
    expect(identityForm.exists()).toBe(true);

    const nameInput = wrapper.find('input[autocomplete="name"]');
    const universityInput = wrapper.find('input[autocomplete="organization"]');
    const emailInput = wrapper.find('input[type="email"]');

    if (nameInput.exists()) await nameInput.setValue('Test Kullanici');
    if (universityInput.exists()) await universityInput.setValue('Test Universitesi');
    if (emailInput.exists()) await emailInput.setValue('test@std.test.edu.tr');

    await identityForm.trigger('submit');
    await vi.runAllTimersAsync();
    await flushPromises();

    // 3. Dogrulama kodunu gir ve gonder
    const codeInput = wrapper.find('input[placeholder="123456"]');
    expect(codeInput.exists()).toBe(true);
    await codeInput.setValue('123456');
    await vi.runAllTimersAsync();
    await flushPromises();

    const codeForm = wrapper.find('form');
    expect(codeForm.exists()).toBe(true);

    await codeForm.trigger('submit');
    await vi.runAllTimersAsync();
    await flushPromises();
    await vi.runAllTimersAsync();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/uygulama/panel');
  });
});
