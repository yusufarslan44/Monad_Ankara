import { createRouter, createWebHistory } from 'vue-router';
import { storeToRefs } from 'pinia';
import LandingView from '@/features/landing/views/LandingView.vue';
import OnboardingView from '@/features/onboarding/views/OnboardingView.vue';
import DashboardView from '@/features/dashboard/views/DashboardView.vue';
import LoanView from '@/features/loan/views/LoanView.vue';
import RepaymentView from '@/features/repayment/views/RepaymentView.vue';
import PoolView from '@/features/pool/views/PoolView.vue';
import ReputationView from '@/features/reputation/views/ReputationView.vue';
import HistoryView from '@/features/history/views/HistoryView.vue';
import AppLayoutView from '@/app/shell/AppLayoutView.vue';
import { isInvestorAllowedPath } from '@/app/config/navigation';
import { useSessionStore } from '@/stores/session';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/uygulama',
      component: AppLayoutView,
      children: [
        {
          path: '',
          name: 'onboarding',
          component: OnboardingView,
          meta: {
            layout: 'plain',
            pageOrder: 0,
          },
        },
        {
          path: 'panel',
          name: 'dashboard',
          component: DashboardView,
          meta: {
            layout: 'app',
            requiresReady: true,
            pageOrder: 1,
          },
        },
        {
          path: 'borc-al',
          name: 'loan',
          component: LoanView,
          meta: {
            layout: 'app',
            requiresReady: true,
            pageOrder: 2,
          },
        },
        {
          path: 'odeme',
          name: 'repayment',
          component: RepaymentView,
          meta: {
            layout: 'app',
            requiresReady: true,
            pageOrder: 3,
          },
        },
        {
          path: 'havuz',
          name: 'pool',
          component: PoolView,
          meta: {
            layout: 'app',
            requiresWallet: true,
            pageOrder: 4,
          },
        },
        {
          path: 'itibar',
          name: 'reputation',
          component: ReputationView,
          meta: {
            layout: 'app',
            requiresReady: true,
            pageOrder: 5,
          },
        },
        {
          path: 'gecmis',
          name: 'history',
          component: HistoryView,
          meta: {
            layout: 'app',
            requiresReady: true,
            pageOrder: 6,
          },
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const session = useSessionStore();
  const { isAppReady, isWalletReady, isInvestorMode, bootstrapped } = storeToRefs(session);

  if (!bootstrapped.value) {
    await session.hydrate();
  }

  if (isInvestorMode.value && !isInvestorAllowedPath(to.path)) {
    if (isWalletReady.value) {
      return {
        name: 'pool',
      };
    }

    return {
      name: 'onboarding',
      query: { rol: 'yatirimci' },
    };
  }

  if (!isInvestorMode.value && to.name === 'pool') {
    if (isAppReady.value) {
      return {
        name: 'dashboard',
      };
    }

    return {
      name: 'onboarding',
    };
  }

  if (to.meta.requiresReady && !isAppReady.value) {
    if (isInvestorMode.value) {
      if (isWalletReady.value) {
        return {
          name: 'pool',
        };
      }

      return {
        name: 'onboarding',
        query: { rol: 'yatirimci' },
      };
    }

    return {
      name: 'onboarding',
    };
  }

  if (to.meta.requiresWallet && !isWalletReady.value) {
    return {
      name: 'onboarding',
      query: { rol: 'yatirimci' },
    };
  }

  if (to.name === 'onboarding' && isAppReady.value) {
    return {
      name: 'dashboard',
    };
  }

  if (to.name === 'onboarding' && isInvestorMode.value && isWalletReady.value) {
    return {
      name: 'pool',
    };
  }

  return true;
});

export default router;
