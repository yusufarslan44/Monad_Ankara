<script setup lang="ts">
import { computed } from 'vue';
import { useDashboardQuery } from '@/shared/composables/useAppQueries';
import { getReputationDelta } from '@/shared/lib/calculations';
import BaseCard from '@/shared/components/BaseCard.vue';
import CreditGauge from '@/shared/components/CreditGauge.vue';
import StatusBadge from '@/shared/components/StatusBadge.vue';

const { data } = useDashboardQuery();

const reputationGauge = computed(() => (data.value ? data.value.reputation.score / 100 : 0));
</script>

<template>
  <div v-if="data" class="mx-auto max-w-5xl space-y-5">
    <section class="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <CreditGauge
        :value="reputationGauge"
        label="Itibar skoru"
        :detail="data.reputation.summary"
      />

      <BaseCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="font-display text-3xl font-bold text-ink-950">Skor ritmi</h2>
          </div>
          <StatusBadge
            :tone="data.reputation.trend === 'Yukseliyor' ? 'success' : data.reputation.trend === 'Baski Altinda' ? 'danger' : 'neutral'"
            :label="data.reputation.trend"
          />
        </div>
        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <div class="surface-muted p-4">
            <p class="text-sm text-ink-700">Skor</p>
            <p class="mt-2 font-display text-3xl font-bold text-ink-950">{{ data.reputation.score }}/100</p>
          </div>
          <div class="surface-muted p-4">
            <p class="text-sm text-ink-700">Ritim farki</p>
            <p class="mt-2 font-display text-3xl font-bold text-ink-950">{{ getReputationDelta(data.reputation) }}</p>
          </div>
          <div class="surface-muted p-4">
            <p class="text-sm text-ink-700">Ardisik duzen</p>
            <p class="mt-2 font-display text-3xl font-bold text-ink-950">{{ data.reputation.streak }} dongu</p>
          </div>
        </div>
      </BaseCard>
    </section>

    <BaseCard>
      <h2 class="font-display text-2xl font-bold text-ink-950">Rehabilitasyon</h2>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <article class="surface-muted p-4">
          <p class="font-semibold text-ink-950">Gecikme</p>
          <p class="mt-2 text-sm text-ink-700">Limit daralir, sonra yeniden toparlanma sansi acilir.</p>
        </article>
        <article class="surface-muted p-4">
          <p class="font-semibold text-ink-950">Tam kapanis</p>
          <p class="mt-2 text-sm text-ink-700">Yeni itibar bandi daha hizli limit buyumesi saglar.</p>
        </article>
      </div>
      <div class="mt-5">
        <StatusBadge
          :tone="data.reputation.rehabEligible ? 'success' : 'warning'"
          :label="data.reputation.rehabEligible ? 'Rehabilitasyon acik' : 'Henüz tam kapanis yok'"
        />
      </div>
    </BaseCard>
  </div>
</template>
