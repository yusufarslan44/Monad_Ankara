import { defineStore } from 'pinia';
import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { walletAdapter } from '@/shared/adapters/walletAdapter';
import type { CampusIdentityStatus, StudentProfile, WalletState } from '@/shared/types/domain';

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
    isWalletReady: (state) => state.wallet.status === 'bagli',
    isAppReady(): boolean {
      return this.isIdentityReady && this.isWalletReady;
    },
  },
  actions: {
    async hydrate() {
      this.loading = true;
      const snapshot = await dataAdapter.getSessionSnapshot();
      this.studentProfile = snapshot.studentProfile;
      this.identity = snapshot.identity;
      this.wallet = snapshot.wallet;
      this.bootstrapped = true;
      this.loading = false;
    },
    async submitCampusEmail(name: string, university: string, email: string) {
      this.loading = true;
      const snapshot = await dataAdapter.submitCampusEmail(name, university, email);
      this.studentProfile = snapshot.studentProfile;
      this.identity = snapshot.identity;
      this.loading = false;
    },
    async connectWallet() {
      this.loading = true;
      const snapshot = await walletAdapter.connect();
      this.studentProfile = snapshot.studentProfile;
      this.identity = snapshot.identity;
      this.wallet = snapshot.wallet;
      this.loading = false;
    },
    async disconnectWallet() {
      this.loading = true;
      const snapshot = await walletAdapter.disconnect();
      this.wallet = snapshot.wallet;
      this.loading = false;
    },
  },
});
