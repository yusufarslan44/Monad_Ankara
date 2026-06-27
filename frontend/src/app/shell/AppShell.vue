<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { investorNavigation, mobileMoreNavigation, mobileNavigation } from '@/app/config/navigation';
import { useSessionStore } from '@/stores/session';
import TopNav from '@/app/shell/TopNav.vue';
import MobileTabBar from '@/app/shell/MobileTabBar.vue';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseSheet from '@/shared/components/BaseSheet.vue';

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const { isInvestorMode } = storeToRefs(session);
const showMore = ref(false);

const filteredMobileNavigation = computed(() =>
  isInvestorMode.value ? investorNavigation : mobileNavigation,
);

const filteredMobileMoreNavigation = computed(() =>
  isInvestorMode.value ? [] : mobileMoreNavigation,
);

const currentHeading = computed(() => {
  if (route.path === '/uygulama/havuz') {
    return isInvestorMode.value
      ? { title: 'Yatirim', subtitle: 'Likidite kilitle ve faiz kazan' }
      : { title: 'Havuz', subtitle: 'Likidite kilitle ve faiz kazan' };
  }

  const map: Record<string, { title: string; subtitle: string }> = {
    '/uygulama/panel': { title: 'Panel', subtitle: '' },
    '/uygulama/borc-al': { title: 'Borc Al', subtitle: '' },
    '/uygulama/odeme': { title: 'Odeme', subtitle: '' },
    '/uygulama/itibar': { title: 'Itibar', subtitle: '' },
    '/uygulama/gecmis': { title: 'Gecmis', subtitle: '' },
  };

  return (
    map[route.path] ?? {
      title: 'KampusMON',
      subtitle: '',
    }
  );
});

const disconnectWallet = async () => {
  await session.disconnectWallet();
  await router.push('/uygulama');
};
</script>

<template>
  <div class="min-h-dvh px-4 pb-28 pt-4">
    <div class="mx-auto max-w-[24rem] space-y-4">
      <main class="space-y-5">
        <TopNav
          :title="currentHeading.title"
          :subtitle="currentHeading.subtitle"
          :show-exit-action="isInvestorMode"
          @disconnect="disconnectWallet"
        />
        <slot />
      </main>
    </div>

    <MobileTabBar
      :items="filteredMobileNavigation"
      :show-more="filteredMobileMoreNavigation.length > 0"
      @more="showMore = true"
    />

    <BaseSheet :open="showMore" title="Daha fazla" @close="showMore = false">
      <div class="space-y-3">
        <RouterLink
          v-for="item in filteredMobileMoreNavigation"
          :key="item.label"
          :to="item.to"
          class="focus-ring flex min-h-16 items-center gap-3 rounded-[1.35rem] border border-ink-300/50 bg-surface-1 px-4 py-3"
          @click="showMore = false"
        >
          <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-brand-700 shadow-[var(--shadow-soft)]">
            <component :is="item.icon" class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-ink-950">{{ item.label }}</p>
            <p class="mt-0.5 text-sm text-ink-700">{{ item.description }}</p>
          </div>
        </RouterLink>
        <BaseButton variant="ghost" block @click="disconnectWallet">
          Cuzdani ayir
        </BaseButton>
      </div>
    </BaseSheet>
  </div>
</template>
