import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import router from '@/app/router';
import { useSessionStore } from '@/stores/session';
import { setupTestContext } from '@/tests/test-utils';

describe('router guards', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupTestContext();
  });

  it('redirects unopened app routes back to onboarding', async () => {
    const resetNavigation = router.replace('/');
    await vi.runAllTimersAsync();
    await resetNavigation;
    const navigation = router.push('/uygulama/panel');
    await vi.runAllTimersAsync();
    await navigation;
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('onboarding');
  });

  it('sends a ready user from onboarding to dashboard', async () => {
    const session = useSessionStore();

    const hydratePromise = session.hydrate();
    await vi.runAllTimersAsync();
    await hydratePromise;

    const emailPromise = session.submitCampusEmail(
      'Derya Kaya',
      'Yildiz Teknik Universitesi',
      'derya@std.yildiz.edu.tr',
    );
    await vi.runAllTimersAsync();
    await emailPromise;

    const walletPromise = session.connectWallet();
    await vi.runAllTimersAsync();
    await walletPromise;

    await router.replace('/');
    const navigation = router.push('/uygulama');
    await vi.runAllTimersAsync();
    await navigation;
    await flushPromises();

    expect(router.currentRoute.value.name).toBe('dashboard');
  });
});
