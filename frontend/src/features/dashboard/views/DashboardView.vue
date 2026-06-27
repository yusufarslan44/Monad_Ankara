<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, Landmark, PiggyBank, TrendingUp, WalletCards } from 'lucide-vue-next';
import { useDashboardQuery } from '@/shared/composables/useAppQueries';
import { formatMON, formatYieldMON } from '@/shared/lib/formatters';
import { useSessionStore } from '@/stores/session';
import { storeToRefs } from 'pinia';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseCard from '@/shared/components/BaseCard.vue';
import TimelineList from '@/shared/components/TimelineList.vue';
import StatusBadge from '@/shared/components/StatusBadge.vue';

const session = useSessionStore();
const { isInvestorMode } = storeToRefs(session);

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

const userPoolTotal = computed(
  () => data.value?.poolPosition.userDeposits.reduce((sum, deposit) => sum + deposit.amountMON, 0) ?? 0,
);

const investorActivity = computed(() => {
  return data.value?.activity.filter((act) => act.type === 'havuz') ?? [];
});
</script>

<template>
  <!-- YATIRIMCI PANELİ -->
  <div v-if="data && isInvestorMode" class="mx-auto max-w-[28rem] space-y-5">
    <BaseCard class="relative overflow-hidden">
      <div class="relative z-10 flex flex-col gap-5">
        <div>
          <p class="text-sm font-medium text-ink-700">Merhaba, {{ firstName }}</p>
          <h2 class="mt-2 font-display text-3xl font-bold text-ink-950">Yatırım Portföyü</h2>
          <p class="mt-2 text-sm text-ink-700">
            Kampüs lending havuzundaki aktif varlıklarınız ve getirileriniz.
          </p>
        </div>
        <RouterLink to="/uygulama/havuz" class="block w-full">
          <BaseButton block>
            Likidite Ekle
            <ArrowRight class="h-4 w-4" />
          </BaseButton>
        </RouterLink>
      </div>
    </BaseCard>

    <section class="grid gap-4">
      <BaseCard>
        <div class="flex items-start gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Landmark class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-semibold text-ink-700">Toplam Yatırılan</p>
            <p class="mt-1 font-display text-3xl font-bold text-ink-950">{{ formatMON(userPoolTotal) }} MON</p>
            <p class="mt-1 text-xs text-ink-600">Havuz APY: %{{ data.poolPosition.globalApyBps / 100 }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="flex items-start gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-success-100 text-success-500">
            <TrendingUp class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-semibold text-ink-700">Tahmini Toplam Faiz</p>
            <p class="mt-1 font-display text-3xl font-bold text-success-600">+{{ formatYieldMON(data.poolPosition.projectedInterestMON) }} MON</p>
            <p class="mt-1 text-xs text-ink-600">Vade sonunda ödenecek</p>
          </div>
        </div>
      </BaseCard>
    </section>

    <BaseCard>
      <h3 class="font-display text-xl font-bold text-ink-950">Aktif Kilitleriniz</h3>
      <div v-if="data.poolPosition.userDeposits.length" class="mt-4 space-y-3">
        <div
          v-for="deposit in data.poolPosition.userDeposits"
          :key="deposit.id"
          class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-ink-950">{{ deposit.lockDays }} Günlük Kilit</p>
              <p class="mt-1 text-xs text-ink-600">Vade: {{ deposit.maturesAt }}</p>
            </div>
            <StatusBadge
              :tone="deposit.status === 'Cozulebilir' ? 'success' : 'neutral'"
              :label="deposit.status === 'Cozulebilir' ? 'Çözülebilir' : 'Aktif Kilit'"
            />
          </div>
          <div class="mt-3 flex justify-between items-end border-t border-ink-100 pt-3">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Miktar</p>
              <p class="font-display text-lg font-bold text-ink-950">
                {{ formatMON(deposit.amountMON) }} MON
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Tahmini Getiri</p>
              <p class="font-display text-lg font-bold text-success-600">
                +{{ formatYieldMON(deposit.projectedInterestMON) }} MON
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="mt-4 py-8 text-center text-sm text-ink-500">
        Aktif yatırım bulunamadı. Hemen likidite ekleyebilirsiniz.
      </div>
    </BaseCard>

    <BaseCard>
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-display text-xl font-bold text-ink-950">Son Havuz İşlemleri</h3>
        <RouterLink to="/uygulama/gecmis">
          <BaseButton variant="ghost" class="text-sm">Tümünü gör</BaseButton>
        </RouterLink>
      </div>
      <div class="mt-4">
        <TimelineList
          v-if="investorActivity.length"
          :items="investorActivity.slice(0, 3)"
          :show-description="false"
        />
        <div v-else class="py-6 text-center text-sm text-ink-500">
          İşlem geçmişi bulunmuyor.
        </div>
      </div>
    </BaseCard>
  </div>

  <!-- ÖĞRENCİ PANELİ -->
  <div v-else-if="data && !isInvestorMode" class="mx-auto max-w-[28rem] space-y-5">
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
        <RouterLink :to="primaryAction.href" class="block w-full">
          <BaseButton block>
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

    <RouterLink to="/uygulama/havuz" class="block">
      <BaseCard class="transition-colors hover:bg-cream-50/50">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="grid h-11 w-11 place-items-center rounded-2xl bg-coral-100 text-coral-500">
              <PiggyBank class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink-700">Havuza yatirdigim</p>
              <p class="mt-1 font-display text-2xl font-bold text-ink-950">{{ formatMON(userPoolTotal) }} MON</p>
              <p class="mt-1 text-xs text-ink-600">APY: %{{ data.poolPosition.globalApyBps / 100 }}</p>
            </div>
          </div>
          <ArrowRight class="h-5 w-5 text-ink-400" />
        </div>
      </BaseCard>
    </RouterLink>

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
