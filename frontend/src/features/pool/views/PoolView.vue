<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Landmark,
  Lock,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-vue-next';
import { usePoolQuery } from '@/shared/composables/useAppQueries';
import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { calculatePoolInterest } from '@/shared/lib/calculations';
import { formatMON } from '@/shared/lib/formatters';
import { createPoolDepositSchema } from '@/shared/lib/formSchemas';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseCard from '@/shared/components/BaseCard.vue';
import BaseFormField from '@/shared/components/BaseFormField.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import StatusBadge from '@/shared/components/StatusBadge.vue';

const queryClient = useQueryClient();
const { data, isLoading, isError, error } = usePoolQuery();

const selectedDepositId = ref<string | null>(null);

const lockOptions = [
  { days: 7, label: '7 gun', apyMultiplier: 1 },
  { days: 30, label: '30 gun', apyMultiplier: 1 },
  { days: 90, label: '90 gun', apyMultiplier: 1 },
  { days: 180, label: '180 gun', apyMultiplier: 1 },
];

const maxDepositMON = computed(() => {
  const balance = data.value?.walletBalanceMON ?? 0;
  return Math.max(0.1, Number(balance.toFixed(4)));
});

const schema = computed(() => toTypedSchema(createPoolDepositSchema(maxDepositMON.value)));

const { errors, defineField, handleSubmit, resetForm, setFieldValue, values } = useForm({
  validationSchema: schema,
  initialValues: {
    amountMON: 1,
    lockDays: 30,
  },
});

const [amount, amountAttrs] = defineField('amountMON');
const [lockDays, lockDaysAttrs] = defineField('lockDays');

watch(maxDepositMON, (max) => {
  if (values.amountMON > max) {
    setFieldValue('amountMON', max);
  }
});

const projectedInterest = computed(() => {
  if (!data.value || !values.amountMON || !values.lockDays) {
    return 0;
  }

  return calculatePoolInterest(values.amountMON, values.lockDays, data.value.globalApyBps);
});

const apyPercent = computed(() => {
  if (!data.value) {
    return 0;
  }

  return data.value.globalApyBps / 100;
});

const selectedDeposit = computed(() =>
  data.value?.userDeposits.find((deposit) => deposit.id === selectedDepositId.value),
);

const depositMutation = useMutation({
  mutationFn: (input: { amountMON: number; lockDays: number }) => dataAdapter.deposit(input),
  onSuccess: async () => {
    resetForm();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pool'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['history'] }),
    ]);
  },
});

const withdrawMutation = useMutation({
  mutationFn: (depositId: string) => dataAdapter.withdraw(depositId),
  onSuccess: async () => {
    selectedDepositId.value = null;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pool'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['history'] }),
    ]);
  },
});

const isDepositing = computed(() => depositMutation.isPending.value);
const isWithdrawing = computed(() => withdrawMutation.isPending.value);

const onDeposit = handleSubmit(async (formValues) => {
  await depositMutation.mutateAsync({
    amountMON: Number(formValues.amountMON),
    lockDays: Number(formValues.lockDays),
  });
});

const chooseLock = (days: number) => {
  setFieldValue('lockDays', days);
};
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <div v-if="isLoading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <BaseCard v-for="i in 5" :key="i" class="h-28 animate-pulse bg-surface-0" />
    </div>

    <BaseCard
      v-else-if="isError"
      class="rounded-[1.25rem] border border-danger-200 bg-danger-50/50"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="mt-0.5 h-5 w-5 text-danger-500" />
        <div>
          <p class="font-semibold text-ink-950">Havuz verileri yuklenemedi</p>
          <p class="mt-1 text-sm text-ink-700">
            {{ error?.message || 'Lutfen daha sonra tekrar dene.' }}
          </p>
        </div>
      </div>
    </BaseCard>

    <template v-else-if="data">
      <BaseCard
        v-if="data.fallback"
        class="rounded-[1.25rem] border border-amber-200 bg-amber-50/50"
      >
        <div class="flex items-start gap-3">
          <AlertTriangle class="mt-0.5 h-5 w-5 text-amber-500" />
          <div>
            <p class="font-semibold text-ink-950">Demo verileri gosteriliyor</p>
            <p class="mt-1 text-sm text-ink-700">
              LendingPool kontrati yapilandirilmamis. Cuzdan bakiyen gercek, havuz metrikleri
              ornek degerlerdir.
            </p>
          </div>
        </div>
      </BaseCard>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <BaseCard>
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <Wallet class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink-700">Cuzdan bakiyen</p>
              <p class="mt-1 font-display text-2xl font-bold text-ink-950">
                {{ formatMON(data.walletBalanceMON) }} MON
              </p>
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <Landmark class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink-700">Toplam havuz</p>
              <p class="mt-1 font-display text-2xl font-bold text-ink-950">
                {{ formatMON(data.totalDepositedMON) }} MON
              </p>
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-500">
              <Wallet class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink-700">Odunc verilen</p>
              <p class="mt-1 font-display text-2xl font-bold text-ink-950">
                {{ formatMON(data.totalBorrowedMON) }} MON
              </p>
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-success-100 text-success-500">
              <TrendingUp class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink-700">Kullanilabilir</p>
              <p class="mt-1 font-display text-2xl font-bold text-ink-950">
                {{ formatMON(data.availableLiquidityMON) }} MON
              </p>
            </div>
          </div>
        </BaseCard>
        <BaseCard>
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-coral-100 text-coral-500">
              <PiggyBank class="h-5 w-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-ink-700">Yillik getiri (APY)</p>
              <p class="mt-1 font-display text-2xl font-bold text-ink-950">%{{ apyPercent }}</p>
            </div>
          </div>
        </BaseCard>
      </section>

      <section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <BaseCard>
          <h2 class="font-display text-2xl font-bold text-ink-950">Yatirimlarin</h2>
          <div v-if="data.userDeposits.length" class="mt-5 space-y-3">
            <article
              v-for="deposit in data.userDeposits"
              :key="deposit.id"
              class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-ink-950">{{ deposit.lockDays }} gunlik kilit</p>
                  <p class="mt-1 text-sm text-ink-700">Vade: {{ deposit.maturesAt }}</p>
                </div>
                <StatusBadge
                  :tone="deposit.status === 'Cozulebilir' ? 'success' : 'neutral'"
                  :label="deposit.status"
                />
              </div>
              <div class="mt-4 grid gap-2 sm:grid-cols-3">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-ink-700">Anapara</p>
                  <p class="font-display text-xl font-bold text-ink-950">
                    {{ formatMON(deposit.amountMON) }} MON
                  </p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Tahmini faiz
                  </p>
                  <p class="font-display text-xl font-bold text-ink-950">
                    +{{ formatMON(deposit.projectedInterestMON) }} MON
                  </p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-ink-700">
                    Getiri orani
                  </p>
                  <p class="font-display text-xl font-bold text-ink-950">
                    %{{ deposit.apyBps / 100 }}
                  </p>
                </div>
              </div>
              <div class="mt-4 flex justify-end">
                <BaseButton
                  v-if="deposit.status === 'Cozulebilir'"
                  variant="secondary"
                  @click="selectedDepositId = deposit.id"
                >
                  Coz ve cek
                  <ArrowRight class="h-4 w-4" />
                </BaseButton>
                <div v-else class="inline-flex items-center gap-1.5 text-sm font-medium text-ink-700">
                  <Lock class="h-4 w-4" />
                  Vade dolmadan cozulemez
                </div>
              </div>
            </article>
          </div>
          <EmptyState
            v-else
            title="Aktif yatirim yok"
            detail="Havza MON yatirarak faiz kazanmaya basla."
          />
        </BaseCard>

        <BaseCard>
          <h2 class="font-display text-2xl font-bold text-ink-950">Havza yatir</h2>
          <form class="mt-5 space-y-5" @submit="onDeposit">
            <BaseFormField label="Miktar (MON)" :error="errors.amountMON" required>
              <input
                v-model.number="amount"
                v-bind="amountAttrs"
                type="number"
                step="0.1"
                min="0.1"
                :max="maxDepositMON"
                class="focus-ring min-h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-[16px] text-ink-950"
                placeholder="Orn: 2"
              />
            </BaseFormField>

            <div>
              <p class="mb-2 text-sm font-semibold text-ink-900">Kilitleme suresi</p>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  v-for="option in lockOptions"
                  :key="option.days"
                  type="button"
                  :class="
                    lockDays === option.days
                      ? 'bg-brand-100 text-brand-700 shadow-[inset_0_0_0_1px_rgba(229,36,42,0.12)]'
                      : 'bg-white text-ink-700 hover:bg-cream-50'
                  "
                  class="focus-ring rounded-2xl border border-ink-300/50 px-3 py-2.5 text-sm font-semibold transition-all"
                  @click="chooseLock(option.days)"
                >
                  {{ option.label }}
                </button>
              </div>
              <input v-model.number="lockDays" v-bind="lockDaysAttrs" type="hidden" />
              <p v-if="errors.lockDays" class="mt-2 text-sm font-medium text-danger-500">
                {{ errors.lockDays }}
              </p>
            </div>

            <div class="rounded-2xl bg-surface-0 p-4">
              <div class="flex items-center gap-2 text-sm text-ink-700">
                <Clock class="h-4 w-4" />
                <span>Tahmini getiri</span>
              </div>
              <p class="mt-1 font-display text-3xl font-bold text-ink-950">
                +{{ formatMON(projectedInterest) }} MON
              </p>
              <p class="text-sm text-ink-700">Vade sonunda anapara + faiz iade edilir.</p>
            </div>

            <BaseButton :disabled="isDepositing" type="submit" block>
              Havuza yatir
              <ArrowRight class="h-4 w-4" />
            </BaseButton>
          </form>
        </BaseCard>
      </section>

      <BaseCard
        v-if="selectedDeposit"
        class="rounded-[1.25rem] border border-success-200 bg-success-50/50"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-semibold text-ink-950">Yatirimi coz ve cek</p>
            <p class="mt-1 text-sm text-ink-700">
              {{ formatMON(selectedDeposit.amountMON) }} MON anapara +
              {{ formatMON(selectedDeposit.projectedInterestMON) }} MON faiz iade alinacak.
            </p>
          </div>
          <div class="flex gap-3">
            <BaseButton :disabled="isWithdrawing" @click="withdrawMutation.mutate(selectedDeposit.id)">
              Onayla
            </BaseButton>
            <BaseButton variant="ghost" @click="selectedDepositId = null">Vazgec</BaseButton>
          </div>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
