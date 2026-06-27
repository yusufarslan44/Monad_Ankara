import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session';
import { setupTestContext } from '@/tests/test-utils';

describe('session store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupTestContext();
  });

  it('hydrates and completes onboarding after email plus wallet', async () => {
    const store = useSessionStore();

    const hydratePromise = store.hydrate();
    await vi.runAllTimersAsync();
    await hydratePromise;

    expect(store.identity.status).toBe('baslamadi');

    const emailPromise = store.submitCampusEmail(
      'Derya Kaya',
      'Yildiz Teknik Universitesi',
      'derya@std.yildiz.edu.tr',
    );
    await vi.runAllTimersAsync();
    await emailPromise;

    expect(store.isIdentityReady).toBe(true);

    const walletPromise = store.connectWallet();
    await vi.runAllTimersAsync();
    await walletPromise;

    expect(store.isAppReady).toBe(true);
  });
});
