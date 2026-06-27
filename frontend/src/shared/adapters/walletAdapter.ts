import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { getMonadAddChainParams, monadNetwork } from '@/shared/config/monadNetwork';
import { mockCampusApi } from '@/shared/mocks/mockCampusState';
import type { SessionSnapshot, WalletState } from '@/shared/types/domain';

type EthereumRequestParams = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

type EthereumProvider = {
  isMetaMask?: boolean;
  request: <T = unknown>(params: EthereumRequestParams) => Promise<T>;
  on: (event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void) => void;
  removeListener: (event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void) => void;
};

type WalletListener = (wallet: WalletState) => void;

const DISCONNECT_KEY = 'campusmon.wallet.disconnected';
const IS_TEST =
  import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true';

const getProvider = (): EthereumProvider | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
};

const isManuallyDisconnected = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(DISCONNECT_KEY) === '1';
};

const setManualDisconnect = (value: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (value) {
    window.localStorage.setItem(DISCONNECT_KEY, '1');
    return;
  }

  window.localStorage.removeItem(DISCONNECT_KEY);
};

const buildWalletState = (overrides: Partial<WalletState> = {}): WalletState => ({
  status: 'bagli-degil',
  network: monadNetwork.chainName,
  isInstalled: Boolean(getProvider()),
  isSupportedNetwork: false,
  providerLabel: 'MetaMask',
  ...overrides,
});

const isSupportedChain = (chainId?: string) => chainId === monadNetwork.chainIdHex;

const mapProviderError = (error: unknown) => {
  if (typeof error === 'object' && error && 'code' in error) {
    const walletError = error as { code?: number; message?: string };

    if (walletError.code === 4001) {
      return 'MetaMask baglanti istegi reddedildi.';
    }

    if (walletError.code === 4902) {
      return 'Monad agi MetaMask icinde tanimli degil.';
    }

    if (walletError.message) {
      return walletError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'MetaMask baglantisi tamamlanamadi.';
};

const getDisconnectedSnapshot = async (wallet: WalletState) => {
  const session = await dataAdapter.getSessionSnapshot();

  return {
    ...session,
    wallet,
  };
};

const readWalletState = async (
  provider: EthereumProvider,
  accountsOverride?: string[],
): Promise<WalletState> => {
  const chainId = await provider.request<string>({ method: 'eth_chainId' });
  const accounts =
    accountsOverride ?? (await provider.request<string[]>({ method: 'eth_accounts' }));
  const address = accounts[0];
  const supported = isSupportedChain(chainId);

  if (!address || isManuallyDisconnected()) {
    return buildWalletState({
      chainId,
      isInstalled: true,
      isSupportedNetwork: supported,
      network: supported ? monadNetwork.chainName : `Uyumsuz ag (${chainId})`,
    });
  }

  if (!supported) {
    return buildWalletState({
      address,
      chainId,
      isInstalled: true,
      isSupportedNetwork: false,
      network: `Uyumsuz ag (${chainId})`,
      error: `${monadNetwork.chainName} agina gecis yap.`,
    });
  }

  return buildWalletState({
    status: 'bagli',
    address,
    chainId,
    isInstalled: true,
    isSupportedNetwork: true,
    network: monadNetwork.chainName,
    error: '',
  });
};

const ensureMonadNetwork = async (provider: EthereumProvider) => {
  const currentChainId = await provider.request<string>({ method: 'eth_chainId' });

  if (isSupportedChain(currentChainId)) {
    return;
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: monadNetwork.chainIdHex }],
    });
  } catch (error) {
    const walletError = error as { code?: number };

    if (walletError.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [getMonadAddChainParams()],
      });
      return;
    }

    throw error;
  }
};

let removeProviderListeners: (() => void) | null = null;

const attachProviderListeners = (listener: WalletListener) => {
  if (removeProviderListeners) {
    removeProviderListeners();
    removeProviderListeners = null;
  }

  const provider = getProvider();

  if (!provider) {
    return () => {};
  }

  const syncAccounts = async (accounts: unknown) => {
    const nextAccounts = Array.isArray(accounts)
      ? (accounts.filter((value): value is string => typeof value === 'string') as string[])
      : undefined;

    if (nextAccounts && nextAccounts.length === 0) {
      setManualDisconnect(true);
    } else if (nextAccounts && nextAccounts.length > 0) {
      setManualDisconnect(false);
    }

    const wallet = await readWalletState(provider, nextAccounts);
    listener(wallet);
  };

  const syncChain = async () => {
    const wallet = await readWalletState(provider);
    listener(wallet);
  };

  provider.on('accountsChanged', syncAccounts);
  provider.on('chainChanged', syncChain);

  removeProviderListeners = () => {
    provider.removeListener('accountsChanged', syncAccounts);
    provider.removeListener('chainChanged', syncChain);
  };

  return removeProviderListeners;
};

export const walletAdapter = {
  async hydrate() {
    if (IS_TEST) {
      return null;
    }

    const provider = getProvider();

    if (!provider) {
      return buildWalletState({
        isInstalled: false,
        error: 'MetaMask bulunamadi.',
      });
    }

    return readWalletState(provider);
  },
  async connect(): Promise<SessionSnapshot> {
    if (IS_TEST) {
      return mockCampusApi.connectWallet();
    }

    const provider = getProvider();

    if (!provider) {
      return getDisconnectedSnapshot(
        buildWalletState({
          isInstalled: false,
          error: 'MetaMask yuklu degil. Devam etmek icin MetaMask kur.',
        }),
      );
    }

    try {
      setManualDisconnect(false);
      const accounts = await provider.request<string[]>({ method: 'eth_requestAccounts' });
      await ensureMonadNetwork(provider);
      const wallet = await readWalletState(provider, accounts);
      const session = await dataAdapter.getSessionSnapshot();

      return {
        ...session,
        wallet,
      };
    } catch (error) {
      return getDisconnectedSnapshot(
        buildWalletState({
          isInstalled: true,
          error: mapProviderError(error),
        }),
      );
    }
  },
  async disconnect(): Promise<SessionSnapshot> {
    if (IS_TEST) {
      return mockCampusApi.disconnectWallet();
    }

    setManualDisconnect(true);

    return getDisconnectedSnapshot(
      buildWalletState({
        isInstalled: Boolean(getProvider()),
      }),
    );
  },
  subscribe(listener: WalletListener) {
    if (IS_TEST) {
      return () => {};
    }

    return attachProviderListeners(listener);
  },
};
