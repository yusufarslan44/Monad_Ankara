import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { WalletState } from '@/shared/types/domain';
import { monadNetwork } from '@/shared/config/monadNetwork';

type WalletAdapterModule = typeof import('@/shared/adapters/walletAdapter');
type MockProvider = {
  isMetaMask: boolean;
  request: Mock;
  on: Mock;
  removeListener: Mock;
  __emit: (event: string, ...args: unknown[]) => void;
  __getChainId: () => string;
};

const createMockProvider = (overrides: {
  chainId?: string;
  accounts?: string[];
  rejectRequest?: boolean;
  rejectSwitch?: boolean;
  switchCode?: number;
} = {}) => {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  let chainId = overrides.chainId ?? monadNetwork.chainIdHex;
  const accounts = overrides.accounts ?? ['0xAbC123'];

  const provider: MockProvider = {
    isMetaMask: true,
    request: vi.fn(async (params: { method: string; params?: unknown[] | Record<string, unknown> }) => {
      if (params.method === 'eth_chainId') {
        return chainId;
      }
      if (params.method === 'eth_accounts') {
        return accounts;
      }
      if (params.method === 'eth_requestAccounts') {
        if (overrides.rejectRequest) {
          const err = Object.assign(new Error('User rejected'), { code: 4001 });
          throw err;
        }
        return accounts;
      }
      if (params.method === 'wallet_switchEthereumChain') {
        if (overrides.rejectSwitch) {
          const err = Object.assign(new Error('Unrecognized chain'), { code: overrides.switchCode ?? 4902 });
          throw err;
        }
        const requested = (params.params as unknown[])[0] as { chainId: string };
        chainId = requested.chainId;
        listeners.chainChanged?.forEach((fn) => fn(chainId));
        return null;
      }
      if (params.method === 'wallet_addEthereumChain') {
        const requested = ((params.params as unknown[])[0] as { chainId: string }).chainId;
        chainId = requested;
        return null;
      }
      return null;
    }),
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(listener);
    }),
    removeListener: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((fn) => fn !== listener);
      }
    }),
    __emit: (event: string, ...args: unknown[]) => {
      listeners[event]?.forEach((fn) => fn(...args));
    },
    __getChainId: () => chainId,
  };

  return provider;
};

const loadWalletAdapter = async (): Promise<WalletAdapterModule> => {
  vi.stubEnv('VITEST', 'false');
  vi.stubEnv('MODE', 'development');
  vi.resetModules();
  return import('@/shared/adapters/walletAdapter');
};

describe('walletAdapter with real path (bypass test mock)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {});
  });

  it('connects when MetaMask is on Monad', async () => {
    const { walletAdapter } = await loadWalletAdapter();
    const provider = createMockProvider();
    (window as unknown as Window & { ethereum?: MockProvider }).ethereum = provider;

    const result = await walletAdapter.connect();
    expect(result.wallet.status).toBe('bagli');
    expect(result.wallet.address).toBe('0xAbC123');
    expect(result.wallet.isSupportedNetwork).toBe(true);
  });

  it('switches chain when on wrong network', async () => {
    const { walletAdapter } = await loadWalletAdapter();
    const provider = createMockProvider({ chainId: '0x1' });
    (window as unknown as Window & { ethereum?: MockProvider }).ethereum = provider;

    const result = await walletAdapter.connect();
    expect(provider.__getChainId().toLowerCase()).toBe(monadNetwork.chainIdHex.toLowerCase());
    expect(result.wallet.status).toBe('bagli');
  });

  it('returns error when user rejects connection', async () => {
    const { walletAdapter } = await loadWalletAdapter();
    const provider = createMockProvider({ rejectRequest: true });
    (window as unknown as Window & { ethereum?: MockProvider }).ethereum = provider;

    const result = await walletAdapter.connect();
    expect(result.wallet.status).toBe('bagli-degil');
    expect(result.wallet.error).toContain('reddedildi');
  });

  it('adds chain when switch fails with 4902', async () => {
    const { walletAdapter } = await loadWalletAdapter();
    const provider = createMockProvider({ chainId: '0x1', rejectSwitch: true, switchCode: 4902 });
    (window as unknown as Window & { ethereum?: MockProvider }).ethereum = provider;

    const result = await walletAdapter.connect();
    expect(provider.__getChainId().toLowerCase()).toBe(monadNetwork.chainIdHex.toLowerCase());
    expect(result.wallet.status).toBe('bagli');
  });

  it('hydrates connected wallet', async () => {
    const { walletAdapter } = await loadWalletAdapter();
    const provider = createMockProvider();
    (window as unknown as Window & { ethereum?: MockProvider }).ethereum = provider;

    const result = await walletAdapter.hydrate();
    expect((result as WalletState).status).toBe('bagli');
  });

  it('detects MetaMask inside window.ethereum.providers array', async () => {
    const { walletAdapter } = await loadWalletAdapter();
    const metamask = createMockProvider();
    const otherWallet = createMockProvider();
    otherWallet.isMetaMask = false;

    (window as unknown as Window & { ethereum?: { isMetaMask?: boolean; providers: MockProvider[] } }).ethereum = {
      isMetaMask: false,
      providers: [otherWallet, metamask],
    };

    const result = await walletAdapter.connect();
    expect(result.wallet.status).toBe('bagli');
    expect(result.wallet.address).toBe('0xAbC123');
  });

  it('treats uppercase chain id as supported', async () => {
    const { walletAdapter } = await loadWalletAdapter();
    const provider = createMockProvider({ chainId: monadNetwork.chainIdHex.toUpperCase() });
    (window as unknown as Window & { ethereum?: MockProvider }).ethereum = provider;

    const result = await walletAdapter.hydrate();
    expect((result as WalletState).isSupportedNetwork).toBe(true);
  });

  it('opens MetaMask mobile deeplink when provider is unavailable on mobile', async () => {
    vi.stubEnv('VITE_METAMASK_DAPP_URL', 'https://campusmon.example/uygulama');
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      configurable: true,
    });
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { walletAdapter } = await loadWalletAdapter();

    (window as unknown as Window & { ethereum?: MockProvider }).ethereum = undefined;

    const result = await walletAdapter.connect();

    expect(openSpy).toHaveBeenCalledWith(
      'https://metamask.app.link/dapp/campusmon.example%2Fuygulama',
      '_self',
    );
    expect(result.wallet.status).toBe('bagli-degil');
    expect(result.wallet.error).toContain('MetaMask mobil aciliyor');
  });
});
