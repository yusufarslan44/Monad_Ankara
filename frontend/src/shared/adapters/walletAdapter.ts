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

type BrowserEthereum = EthereumProvider & {
  providers?: EthereumProvider[];
};

type WalletListener = (wallet: WalletState) => void;

const DISCONNECT_KEY = 'campusmon.wallet.disconnected';
const MOBILE_USER_AGENT_PATTERN = /android|iphone|ipad|ipod/i;
const MOBILE_DEEPLINK_BASE = 'https://metamask.app.link/dapp/';
const IS_TEST =
  import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true';

const getMetaMaskProvider = (): EthereumProvider | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const ethereum = (window as Window & { ethereum?: BrowserEthereum }).ethereum;
  if (!ethereum) {
    return undefined;
  }

  if (Array.isArray(ethereum.providers)) {
    const metamaskProvider = ethereum.providers.find((provider) => provider.isMetaMask);
    if (metamaskProvider) {
      return metamaskProvider;
    }
  }

  return ethereum.isMetaMask ? ethereum : undefined;
};

const getMetaMaskMobileDappUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const configuredUrl = String(import.meta.env.VITE_METAMASK_DAPP_URL ?? '').trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  return `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
};

const isLocalhostUrl = (value: string) => {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
  } catch {
    return false;
  }
};

export const isMobileMetaMaskEnvironment = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return MOBILE_USER_AGENT_PATTERN.test(window.navigator.userAgent);
};

const getMetaMaskMobileDeeplink = () => {
  const dappUrl = getMetaMaskMobileDappUrl();

  if (!dappUrl || isLocalhostUrl(dappUrl)) {
    return null;
  }

  return `${MOBILE_DEEPLINK_BASE}${encodeURIComponent(dappUrl.replace(/^https?:\/\//, ''))}`;
};

const getMobileWalletUnavailableMessage = () => {
  if (String(import.meta.env.VITE_METAMASK_DAPP_URL ?? '').trim()) {
    return 'MetaMask mobil uygulamasi ile devam etmek icin baglan butonuna dokun.';
  }

  return 'MetaMask mobil baglantisi icin VITE_METAMASK_DAPP_URL ile erisilebilir bir adres tanimla.';
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
  isInstalled: Boolean(getMetaMaskProvider()),
  isSupportedNetwork: false,
  providerLabel: 'MetaMask',
  ...overrides,
});

const normalizeChainId = (chainId?: string) => chainId?.toLowerCase().trim() ?? '';
const isSupportedChain = (chainId?: string) =>
  normalizeChainId(chainId) === monadNetwork.chainIdHex.toLowerCase();

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

let attachedProvider: EthereumProvider | null = null;
let removeProviderListeners: (() => void) | null = null;

const attachProviderListeners = (listener: WalletListener) => {
  const provider = getMetaMaskProvider();

  if (attachedProvider === provider && removeProviderListeners) {
    return removeProviderListeners;
  }

  if (removeProviderListeners) {
    removeProviderListeners();
    removeProviderListeners = null;
  }

  attachedProvider = provider;

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

    const provider = getMetaMaskProvider();

    if (!provider) {
      return buildWalletState({
        isInstalled: false,
        error: isMobileMetaMaskEnvironment()
          ? getMobileWalletUnavailableMessage()
          : 'MetaMask bulunamadi.',
      });
    }

    return readWalletState(provider);
  },
  async connect(): Promise<SessionSnapshot> {
    if (IS_TEST) {
      return mockCampusApi.connectWallet();
    }

    const provider = getMetaMaskProvider();

    if (!provider) {
      if (isMobileMetaMaskEnvironment()) {
        const deeplink = getMetaMaskMobileDeeplink();

        if (deeplink && typeof window !== 'undefined') {
          window.open(deeplink, '_self');

          return getDisconnectedSnapshot(
            buildWalletState({
              isInstalled: false,
              error: 'MetaMask mobil aciliyor. Baglanti tamamlaninca uygulamaya geri don.',
            }),
          );
        }

        return getDisconnectedSnapshot(
          buildWalletState({
            isInstalled: false,
            error: getMobileWalletUnavailableMessage(),
          }),
        );
      }

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
        isInstalled: Boolean(getMetaMaskProvider()),
      }),
    );
  },
  subscribe(listener: WalletListener) {
    if (IS_TEST) {
      return () => {};
    }

    return attachProviderListeners(listener);
  },
  async sendContractTx(params: {
    to: string;
    data: string;
    value?: string;
  }): Promise<string> {
    if (IS_TEST) {
      return '0x' + '0'.repeat(64);
    }

    const provider = getMetaMaskProvider();
    if (!provider) throw new Error('MetaMask bulunamadi.');

    const accounts = await provider.request<string[]>({ method: 'eth_accounts' });
    if (!accounts[0]) throw new Error('Cuzdan bagli degil.');

    const txHash = await provider.request<string>({
      method: 'eth_sendTransaction',
      params: [
        {
          from: accounts[0],
          to: params.to,
          data: params.data,
          ...(params.value ? { value: params.value } : {}),
        },
      ],
    });

    return txHash;
  },
};
