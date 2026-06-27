<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { ArrowUpRight, LogOut } from 'lucide-vue-next';
import { desktopNavigation, mobileMoreNavigation } from '@/app/config/navigation';
import { useSessionStore } from '@/stores/session';
import TopNav from '@/app/shell/TopNav.vue';
import MobileTabBar from '@/app/shell/MobileTabBar.vue';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseSheet from '@/shared/components/BaseSheet.vue';

const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const showMore = ref(false);

const headingMap: Record<string, { title: string; subtitle: string }> = {
  '/uygulama/panel': {
    title: 'Panel',
    subtitle: '',
  },
  '/uygulama/borc-al': {
    title: 'Borc Al',
    subtitle: '',
  },
  '/uygulama/odeme': {
    title: 'Odeme',
    subtitle: '',
  },
  '/uygulama/kefalet': {
    title: 'Kefalet',
    subtitle: '',
  },
  '/uygulama/itibar': {
    title: 'Itibar',
    subtitle: '',
  },
  '/uygulama/gecmis': {
    title: 'Gecmis',
    subtitle: '',
  },
};

const currentHeading = computed(
  () =>
    headingMap[route.path] ?? {
      title: 'KampusMON',
      subtitle: '',
    },
);

const disconnectWallet = async () => {
  await session.disconnectWallet();
  await router.push('/uygulama');
};
</script>

<template>
  <div class="min-h-dvh px-4 pb-28 pt-4 sm:px-5 lg:px-6">
    <div class="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside class="hidden lg:block">
        <div class="surface-card sticky top-4 p-5">
          <RouterLink to="/" class="flex items-center gap-3">
            <div class="grid h-12 w-12 place-items-center rounded-2xl bg-ink-950 text-lg font-bold text-white">
              KM
            </div>
            <div>
              <p class="font-display text-xl font-bold text-ink-950">KampusMON</p>
              <p class="text-sm text-ink-700">Teminatsiz nano-lending</p>
            </div>
          </RouterLink>

          <nav class="mt-6 space-y-1.5">
            <RouterLink
              v-for="item in desktopNavigation"
              :key="item.label"
              :to="item.to"
              class="focus-ring flex min-h-11 items-center gap-3 rounded-2xl px-3.5 py-3 transition-colors"
              :class="route.path === item.to ? 'bg-brand-100/80 text-brand-700' : 'text-ink-800 hover:bg-surface-0/90'"
            >
              <component :is="item.icon" class="h-5 w-5 shrink-0" />
              <p class="font-semibold">{{ item.label }}</p>
            </RouterLink>
          </nav>

          <div class="mt-6 rounded-[1.25rem] border border-ink-300/40 bg-surface-1 p-4 text-ink-900">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">Hizli islem</p>
            <p class="mt-2 font-display text-lg font-bold">Yeni borc ac</p>
            <RouterLink
              to="/uygulama/borc-al"
              class="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Borc akisini ac
              <ArrowUpRight class="h-4 w-4" />
            </RouterLink>
          </div>

          <button
            class="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-ink-700"
            @click="disconnectWallet"
          >
            <LogOut class="h-4 w-4" />
            Cuzdani ayir
          </button>
        </div>
      </aside>

      <main class="space-y-5">
        <TopNav :title="currentHeading.title" :subtitle="currentHeading.subtitle" />
        <slot />
      </main>
    </div>

    <MobileTabBar @more="showMore = true" />

    <BaseSheet :open="showMore" title="Daha fazla" @close="showMore = false">
      <div class="space-y-3">
        <RouterLink
          v-for="item in mobileMoreNavigation"
          :key="item.label"
          :to="item.to"
          class="focus-ring flex min-h-11 items-center gap-3 rounded-2xl border border-ink-300/50 bg-white px-4 py-3"
          @click="showMore = false"
        >
          <component :is="item.icon" class="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
          <p class="font-semibold text-ink-950">{{ item.label }}</p>
        </RouterLink>
        <BaseButton variant="ghost" block @click="disconnectWallet">
          Cuzdani ayir
        </BaseButton>
      </div>
    </BaseSheet>
  </div>
</template>
