import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session';
import { setupTestContext } from '@/tests/test-utils';

describe('session store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupTestContext();
  });

  it('hydrates and completes onboarding after wallet, email and code verification', async () => {
    const store = useSessionStore();

    const hydratePromise = store.hydrate();
    await vi.runAllTimersAsync();
    await hydratePromise;

    expect(store.identity.status).toBe('baslamadi');

    const walletPromise = store.connectWallet();
    await vi.runAllTimersAsync();
    await walletPromise;

    expect(store.isWalletReady).toBe(true);

    const verificationPromise = store.startVerification(
      'Derya Kaya',
      'Yildiz Teknik Universitesi',
      'derya@std.yildiz.edu.tr',
    );
    await vi.runAllTimersAsync();
    await verificationPromise;

    expect(store.identity.status).toBe('dogrulaniyor');

    const codePromise = store.verifyCode('123456');
    await vi.runAllTimersAsync();
    await codePromise;

    expect(store.isIdentityReady).toBe(true);
    expect(store.isAppReady).toBe(true);
  });
});
