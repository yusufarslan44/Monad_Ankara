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
  <header class="surface-card flex flex-col gap-4 p-4">
    <div class="flex flex-col gap-4">
      <div>
        <div class="label-chip mb-3">
          Hesap ozeti
        </div>
        <p class="text-sm font-medium text-ink-700">Merhaba, {{ firstName }}</p>
        <h1 class="mt-1 font-display text-[1.9rem] font-bold text-ink-950">{{ title }}</h1>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <StatusBadge
          :tone="identityTone"
          :label="identityLabel"
        />
        <div class="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-300/50 bg-surface-0 px-4 py-2 text-sm font-semibold text-ink-900">
            <Wallet class="h-4 w-4 text-brand-700" />
            {{ walletLabel }}
        </div>
        <button
          v-if="showExitAction"
          class="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-300/50 bg-surface-0 px-4 py-2 text-sm font-semibold text-ink-900"
          @click="emit('disconnect')"
        >
          <LogOut class="h-4 w-4 text-ink-700" />
          Cikis yap
        </button>
      </div>
    </div>
  </header>
</template>
