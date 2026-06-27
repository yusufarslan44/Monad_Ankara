<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, WalletCards } from 'lucide-vue-next';
import { useDashboardQuery } from '@/shared/composables/useAppQueries';
import { formatMON } from '@/shared/lib/formatters';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseCard from '@/shared/components/BaseCard.vue';
import TimelineList from '@/shared/components/TimelineList.vue';

const { data, isLoading } = useDashboardQuery();

const firstName = computed(() => data.value?.studentProfile.name.split(' ')[0] ?? 'Kullanici');
const hasDebt = computed(() => (data.value?.loanPosition.outstandingMON || 0) > 0);

const primaryAction = computed(() => {
  if (!data.value) {
    return { label: 'Yukleniyor', href: '#' };
  }

  return hasDebt.value
    ? { label: 'Borc odeme', href: '/uygulama/odeme' }
    : { label: 'Hemen borc al', href: '/uygulama/borc-al' };
});
</script>

<template>
  <div v-if="data" class="mx-auto max-w-[28rem] space-y-5">
    <!-- Karsilama ve ana aksiyon -->
    <BaseCard class="relative overflow-hidden">
      <div class="relative z-10 flex flex-col gap-5">
        <div>
          <p class="text-sm font-medium text-ink-700">Hos geldin, {{ firstName }}</p>
          <h2 class="mt-2 font-display text-3xl font-bold text-ink-950">
            {{ hasDebt ? 'Acik borcun var.' : 'Limitin hazir.' }}
          </h2>
          <p class="mt-2 text-sm text-ink-700">
            {{ hasDebt ? 'Kademeli odeyerek limitini yeniden ac.' : 'Ihtiyac aninda teminatsiz kredi cekebilirsin.' }}
          </p>
        </div>
        <RouterLink :to="primaryAction.href">
          <BaseButton>
            {{ primaryAction.label }}
            <ArrowRight class="h-4 w-4" />
          </BaseButton>
        </RouterLink>
      </div>
    </BaseCard>

    <!-- Temel iki kart -->
    <section class="grid gap-4">
      <BaseCard>
        <div class="flex items-start gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-success-100 text-success-500">
            <WalletCards class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-semibold text-ink-700">Kullanilabilir limit</p>
            <p class="mt-1 font-display text-3xl font-bold text-ink-950">{{ formatMON(data.creditLimit.availableMON) }} MON</p>
            <p class="mt-1 text-xs text-ink-600">Toplam: {{ formatMON(data.creditLimit.totalMON) }} MON</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="flex items-start gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <ArrowRight class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-semibold text-ink-700">Acik borc</p>
            <p class="mt-1 font-display text-3xl font-bold text-ink-950">{{ formatMON(data.loanPosition.outstandingMON) }} MON</p>
            <p class="mt-1 text-xs text-ink-600">Anapara: {{ formatMON(data.loanPosition.principalMON) }} MON</p>
          </div>
        </div>
      </BaseCard>
    </section>

    <!-- Son hareketler -->
    <BaseCard>
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-display text-xl font-bold text-ink-950">Son hareketler</h3>
        <RouterLink to="/uygulama/gecmis">
          <BaseButton variant="ghost" class="text-sm">Tumunu gor</BaseButton>
        </RouterLink>
      </div>
      <div class="mt-4">
        <TimelineList :items="data.activity.slice(0, 3)" :show-description="false" />
      </div>
    </BaseCard>
  </div>

    <div v-else-if="isLoading" class="mx-auto max-w-[28rem] space-y-5">
      <BaseCard class="min-h-32 animate-pulse bg-surface-0" />
    <div class="grid gap-4">
      <BaseCard class="min-h-32 animate-pulse bg-surface-0" />
      <BaseCard class="min-h-32 animate-pulse bg-surface-0" />
    </div>
  </div>
</template>
