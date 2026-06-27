import { defineStore } from 'pinia';
import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { walletAdapter } from '@/shared/adapters/walletAdapter';
import type { CampusIdentityStatus, StudentProfile, WalletState } from '@/shared/types/domain';

let removeWalletSubscription: (() => void) | null = null;

const emptyProfile: StudentProfile = {
  id: '',
  name: '',
  university: '',
  email: '',
  campusSegment: '',
  joinedAt: '',
};

const emptyIdentity: CampusIdentityStatus = {
  status: 'baslamadi',
  emailEligible: false,
  email: '',
  soulboundReady: false,
};

const emptyWallet: WalletState = {
  status: 'bagli-degil',
  network: 'Monad Testnet',
  isInstalled: false,
  isSupportedNetwork: false,
  providerLabel: 'MetaMask',
};

export const useSessionStore = defineStore('session', {
  state: () => ({
    studentProfile: emptyProfile,
    identity: emptyIdentity,
    wallet: emptyWallet,
    loading: false,
    bootstrapped: false,
  }),
  getters: {
    isIdentityReady: (state) => state.identity.status === 'dogrulandi' && state.identity.soulboundReady,
    isWalletReady: (state) => state.wallet.status === 'bagli' && state.wallet.isSupportedNetwork !== false,
    isAppReady(): boolean {
      return this.isIdentityReady && this.isWalletReady;
    },
  },
  actions: {
    async hydrate() {
      this.loading = true;

      try {
        const snapshot = await dataAdapter.getSessionSnapshot();
        const walletSnapshot = await walletAdapter.hydrate();
        this.studentProfile = snapshot.studentProfile;
        this.identity = snapshot.identity;
        this.wallet = walletSnapshot ?? snapshot.wallet;
        this.bootstrapped = true;
        this.bindWalletEvents();
      } finally {
        this.loading = false;
      }
    },
    async submitCampusEmail(name: string, university: string, email: string) {
      this.loading = true;

      try {
        const snapshot = await dataAdapter.submitCampusEmail(name, university, email);
        this.studentProfile = snapshot.studentProfile;
        this.identity = snapshot.identity;
      } finally {
        this.loading = false;
      }
    },
    async connectWallet() {
      this.loading = true;
      this.wallet = {
        ...this.wallet,
        status: 'baglaniyor',
        error: '',
      };

      try {
        const snapshot = await walletAdapter.connect();
        this.studentProfile = snapshot.studentProfile;
        this.identity = snapshot.identity;
        this.wallet = snapshot.wallet;
        this.bindWalletEvents();
      } finally {
        this.loading = false;
      }
    },
    async disconnectWallet() {
      this.loading = true;

      try {
        const snapshot = await walletAdapter.disconnect();
        this.wallet = snapshot.wallet;
      } finally {
        this.loading = false;
      }
    },
    bindWalletEvents() {
      if (removeWalletSubscription) {
        removeWalletSubscription();
      }

      removeWalletSubscription = walletAdapter.subscribe((wallet) => {
        this.wallet = wallet;
      });
    },
  },
});
