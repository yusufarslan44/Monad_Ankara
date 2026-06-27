<script setup lang="ts">
import { computed } from 'vue';
import { LogOut, Wallet } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useSessionStore } from '@/stores/session';
import { formatShortAddress } from '@/shared/lib/formatters';
import StatusBadge from '@/shared/components/StatusBadge.vue';

withDefaults(defineProps<{
  title: string;
  subtitle: string;
  showExitAction?: boolean;
}>(), {
  showExitAction: false,
});

const emit = defineEmits<{
  disconnect: [];
}>();

const session = useSessionStore();
const { identity, studentProfile, wallet, isInvestorMode } = storeToRefs(session);

const firstName = computed(() => studentProfile.value.name.split(' ')[0] || 'Kullanici');
const walletLabel = computed(() => {
  if (!wallet.value.isInstalled) {
    return 'MetaMask yok';
  }

  if (wallet.value.status !== 'bagli') {
    return wallet.value.error || 'Bagli degil';
  }

  return formatShortAddress(wallet.value.address);
});

const identityTone = computed(() => {
  if (isInvestorMode.value) return 'neutral';
  return identity.value.status === 'dogrulandi' ? 'success' : 'warning';
});

const identityLabel = computed(() => {
  if (isInvestorMode.value) return 'Yatirimci mod';
  return identity.value.status === 'dogrulandi' ? 'Kimlik aktif' : 'Kimlik eksik';
});
</script>

<template>
  <header class="surface-card relative z-10 flex flex-col gap-4 p-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2 mb-3">
          <img src="/logo.png" alt="Monbank Logo" class="h-6 w-6 object-contain rounded-md" />
          <span class="font-display text-sm font-bold text-ink-950 tracking-tight">Monbank</span>
        </div>
        <p class="text-sm font-medium text-ink-700">Merhaba, {{ firstName }}</p>
        <h1 class="mt-1 font-display text-[1.8rem] font-bold text-ink-950">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-sm text-ink-700">{{ subtitle }}</p>
      </div>

      <button
        v-if="showExitAction"
        class="focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-ink-300/50 bg-surface-0 px-3 py-2 text-sm font-semibold text-ink-900"
        @click="emit('disconnect')"
      >
        <LogOut class="h-4 w-4 text-ink-700" />
        Cikis
      </button>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-[1.25rem] border border-ink-300/50 bg-surface-0 px-4 py-3">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">Durum</p>
        <div class="mt-2">
          <StatusBadge
            :tone="identityTone"
            :label="identityLabel"
          />
        </div>
      </div>

      <div class="rounded-[1.25rem] border border-ink-300/50 bg-surface-0 px-4 py-3">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">Cuzdan</p>
        <div class="mt-2 inline-flex min-h-8 items-center gap-2 text-sm font-semibold text-ink-900">
          <Wallet class="h-4 w-4 text-brand-700" />
          <span class="truncate">{{ walletLabel }}</span>
        </div>
      </div>
    </div>
  </header>
</template>
