<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, HandCoins, PiggyBank, Sparkles, WalletCards } from 'lucide-vue-next';
import { useDashboardQuery } from '@/shared/composables/useAppQueries';
import { calculateUsageRatio } from '@/shared/lib/calculations';
import { formatMON } from '@/shared/lib/formatters';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseCard from '@/shared/components/BaseCard.vue';
import CreditGauge from '@/shared/components/CreditGauge.vue';
import StatCard from '@/shared/components/StatCard.vue';
import TimelineList from '@/shared/components/TimelineList.vue';

const { data } = useDashboardQuery();

const usageRatio = computed(() => {
  if (!data.value) {
    return 0;
  }

  return calculateUsageRatio(data.value.creditLimit, data.value.loanPosition);
});

const firstName = computed(() => data.value?.studentProfile.name.split(' ')[0] ?? 'Kullanici');
const actionHref = computed(() => (data.value?.nextAction === 'borc-al' ? '/uygulama/borc-al' : '/uygulama/odeme'));
const actionLabel = computed(() => (data.value?.nextAction === 'borc-al' ? 'Borc al' : 'Odeme yap'));
const userPoolTotal = computed(() =>
  data.value?.poolPosition.userDeposits.reduce((sum, deposit) => sum + deposit.amountMON, 0) ?? 0,
);
</script>

<template>
  <div v-if="data" class="space-y-5">
    <BaseCard>
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-sm font-medium text-ink-700">Hos geldin, {{ firstName }}</p>
          <h2 class="mt-2 font-display text-3xl font-bold text-ink-950 sm:text-[2.3rem]">
            {{ data.nextAction === 'borc-al' ? 'Hazir limitin var.' : 'Odeme zamani.' }}
          </h2>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          <RouterLink :to="actionHref">
            <BaseButton>
              {{ actionLabel }}
              <ArrowRight class="h-4 w-4" />
            </BaseButton>
          </RouterLink>
          <RouterLink to="/uygulama/gecmis">
            <BaseButton variant="ghost">Son hareketler</BaseButton>
          </RouterLink>
        </div>
      </div>
    </BaseCard>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        eyebrow="Kullanilabilir limit"
        :value="`${formatMON(data.creditLimit.availableMON)} MON`"
        detail="Su an kullanilabilir"
        :trend="data.creditLimit.scoreBand"
      />
      <StatCard
        eyebrow="Acik borc"
        :value="`${formatMON(data.loanPosition.outstandingMON)} MON`"
        detail="Kademeli odeme acik"
      />
      <StatCard
        eyebrow="Itibar puani"
        :value="`${data.reputation.score}/100`"
        detail="Odeme ritmiyle guncellenir"
        :trend="data.reputation.trend"
      />
      <StatCard
        eyebrow="Sonraki acilis"
        :value="`${formatMON(data.creditLimit.nextUnlockMON)} MON`"
        detail="Bir sonraki alan"
      />
    </section>

    <section class="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <CreditGauge
        :value="usageRatio"
        label="Limit dengesi"
        detail="Yukselirse baski artar."
      />

      <BaseCard>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="font-display text-2xl font-bold text-ink-950">Son hareketler</h2>
          <RouterLink to="/uygulama/gecmis">
            <BaseButton variant="ghost">Tum gecmis</BaseButton>
          </RouterLink>
        </div>
        <div class="mt-5">
          <TimelineList :items="data.activity.slice(0, 2)" :show-description="false" />
        </div>
      </BaseCard>
    </section>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
        <div class="flex items-start gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <WalletCards class="h-4 w-4" />
          </div>
          <div>
            <p class="font-semibold text-ink-950">Kimlik aktif</p>
            <p class="mt-1 text-sm text-ink-700">{{ data.studentProfile.university }}</p>
          </div>
        </div>
      </div>
      <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
        <div class="flex items-start gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-500">
            <HandCoins class="h-4 w-4" />
          </div>
          <div>
            <p class="font-semibold text-ink-950">Acilabilir alan</p>
            <p class="mt-1 text-sm text-ink-700">{{ formatMON(data.creditLimit.nextUnlockMON) }} MON</p>
          </div>
        </div>
      </div>
      <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
        <div class="flex items-start gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-2xl bg-coral-100 text-coral-500">
            <PiggyBank class="h-4 w-4" />
          </div>
          <div>
            <p class="font-semibold text-ink-950">Havuz yatirimim</p>
            <p class="mt-1 text-sm text-ink-700">{{ formatMON(userPoolTotal) }} MON</p>
          </div>
        </div>
      </div>
      <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
        <div class="flex items-start gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-2xl bg-success-100 text-success-500">
            <Sparkles class="h-4 w-4" />
          </div>
          <div>
            <p class="font-semibold text-ink-950">Itibar</p>
            <p class="mt-1 text-sm text-ink-700">{{ data.reputation.trend }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
