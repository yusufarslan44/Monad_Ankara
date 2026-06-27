<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import AppShell from '@/app/shell/AppShell.vue';
import { useSessionStore } from '@/stores/session';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const { isAppReady, isWalletReady, isInvestorMode } = storeToRefs(session);

watch([isAppReady, isWalletReady], async ([ready, walletReady]) => {
  if (!ready && route.meta.requiresReady) {
    await router.replace('/uygulama');
  }

  if (isInvestorMode.value && !walletReady && route.meta.requiresWallet) {
    await router.replace('/uygulama');
  }
});
</script>

<template>
  <AppShell v-if="route.meta.layout === 'app'">
    <RouterView />
  </AppShell>
  <div v-else class="min-h-full">
    <RouterView />
  </div>
</template>
