import { defineStore } from 'pinia';
import { authApi } from '@/shared/adapters/authApi';
import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { walletAdapter } from '@/shared/adapters/walletAdapter';
import type { CampusIdentityStatus, StudentProfile, WalletState } from '@/shared/types/domain';

let removeWalletSubscription: (() => void) | null = null;

const IS_TEST = import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true';
const SESSION_KEY = 'campusmon.session';

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

type UserMode = 'student' | 'investor';

type PersistedSession = {
  studentProfile: StudentProfile;
  identity: CampusIdentityStatus;
  wallet: WalletState;
  mode: UserMode;
};

const loadPersistedSession = (): PersistedSession | null => {
  if (IS_TEST || typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed.identity || !parsed.studentProfile || !parsed.wallet) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const persistSession = (session: PersistedSession) => {
  if (IS_TEST || typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage yazilamiyorsa sessizce gec
  }
};

const clearPersistedSession = () => {
  if (IS_TEST || typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};

export const useSessionStore = defineStore('session', {
  state: () => ({
    studentProfile: emptyProfile,
    identity: emptyIdentity,
    wallet: emptyWallet,
    mode: 'student' as UserMode,
    loading: false,
    bootstrapped: false,
  }),
  getters: {
    isIdentityReady: (state) => state.identity.status === 'dogrulandi',
    isWalletReady: (state) => state.wallet.status === 'bagli' && state.wallet.isSupportedNetwork !== false,
    isAppReady(): boolean {
      return this.isIdentityReady && this.isWalletReady;
    },
    isInvestorMode: (state) => state.mode === 'investor',
  },
  actions: {
    async hydrate() {
      this.loading = true;

      try {
        const persisted = loadPersistedSession();
        const snapshot = await dataAdapter.getSessionSnapshot();
        const walletSnapshot = await walletAdapter.hydrate();

        this.studentProfile = persisted?.studentProfile ?? snapshot.studentProfile;
        this.identity = persisted?.identity ?? snapshot.identity;
        this.wallet = walletSnapshot ?? persisted?.wallet ?? snapshot.wallet;
        this.mode = persisted?.mode ?? 'student';

        // Cuzdan degismisse kimlik bilgilerini gecersiz kil
        if (
          this.wallet.address &&
          persisted?.wallet?.address &&
          this.wallet.address.toLowerCase() !== persisted.wallet.address.toLowerCase()
        ) {
          this.identity = emptyIdentity;
          this.studentProfile = {
            ...emptyProfile,
            name: this.studentProfile.name,
            university: this.studentProfile.university,
          };
        }

        this.bootstrapped = true;
        this.bindWalletEvents();
        this.persist();
      } finally {
        this.loading = false;
      }
    },
    async startVerification(name: string, university: string, email: string, referralCode?: string) {
      this.studentProfile = {
        ...this.studentProfile,
        name,
        university,
        email,
      };
      if (!this.wallet.address) {
        throw new Error('Once cuzdanini baglamalisin.');
      }

      this.loading = true;

      try {
        if (IS_TEST) {
          // Test ortaminda backend cagrisi simule edilir
          this.identity = {
            status: 'dogrulaniyor',
            emailEligible: true,
            email,
            soulboundReady: false,
          };
        } else {
          await authApi.requestCode(this.wallet.address, email, name, university, referralCode);

          this.identity = {
            status: 'dogrulaniyor',
            emailEligible: true,
            email,
            soulboundReady: false,
          };
        }

        this.persist();
      } finally {
        this.loading = false;
      }
    },
    async verifyCode(code: string) {
      if (!this.wallet.address || !this.identity.email) {
        throw new Error('Dogrulama icin gerekli bilgiler eksik.');
      }

      this.loading = true;

      try {
        if (IS_TEST) {
          this.identity = {
            status: 'dogrulandi',
            emailEligible: true,
            email: this.identity.email,
            verifiedAt: 'Az once',
            soulboundReady: true,
          };
        } else {
          const response = await authApi.verifyCode(this.wallet.address, this.identity.email, code);

          this.identity = {
            status: 'dogrulandi',
            emailEligible: true,
            email: this.identity.email,
            verifiedAt: 'Az once',
            soulboundReady: response.registered,
          };
        }

        this.persist();
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
        this.persist();
      } finally {
        this.loading = false;
      }
    },
    async disconnectWallet() {
      this.loading = true;

      try {
        const snapshot = await walletAdapter.disconnect();
        this.wallet = snapshot.wallet;
        this.persist();
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
        this.persist();
      });
    },
    setMode(mode: UserMode) {
      this.mode = mode;
      this.persist();
    },
    persist() {
      persistSession({
        studentProfile: this.studentProfile,
        identity: this.identity,
        wallet: this.wallet,
        mode: this.mode,
      });
    },
    clearSession() {
      this.studentProfile = emptyProfile;
      this.identity = emptyIdentity;
      this.wallet = emptyWallet;
      this.mode = 'student';
      clearPersistedSession();
    },
  },
});
