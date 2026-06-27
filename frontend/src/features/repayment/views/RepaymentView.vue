<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowRight, Sparkles, WalletCards } from 'lucide-vue-next';
import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { useDashboardQuery, useRepaymentProjection } from '@/shared/composables/useAppQueries';
import { repaymentFormSchema } from '@/shared/lib/formSchemas';
import { formatMON } from '@/shared/lib/formatters';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseCard from '@/shared/components/BaseCard.vue';
import BaseDialog from '@/shared/components/BaseDialog.vue';
import BaseFormField from '@/shared/components/BaseFormField.vue';
import StatusBadge from '@/shared/components/StatusBadge.vue';

const queryClient = useQueryClient();
const { data: dashboard } = useDashboardQuery();
const successOpen = ref(false);

const schema = toTypedSchema(repaymentFormSchema);

const { errors, defineField, handleSubmit, values, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    amountMON: 1.2,
  },
});

const [amountMON, amountAttrs] = defineField('amountMON');

const projectedAvailable = useRepaymentProjection(() => Number(values.amountMON) || 0);

const submitError = ref('');

const mapRepayError = (message: string): string => {
  if (message.includes('User rejected') || message.includes('4001')) {
    return 'MetaMask isteği reddedildi.';
  }
  if (message.includes('insufficient funds')) {
    return 'Cuzdaninda yeterli MON yok.';
  }
  if (message.includes('NoActiveLoan')) {
    return 'Aktif borcun bulunmuyor.';
  }
  return message || 'Odeme tamamlanamadi.';
};

const mutation = useMutation({
  mutationFn: (amount: number) => dataAdapter.submitRepayment(amount),
  onSuccess: async () => {
    submitError.value = '';
    successOpen.value = true;
    resetForm({
      values: {
        amountMON: 1.2,
      },
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['history'] }),
    ]);
  },
  onError: (error) => {
    submitError.value = mapRepayError(error instanceof Error ? error.message : '');
  },
});

const nextLift = computed(() => {
  if (!dashboard.value) {
    return 0;
  }

  return Math.max(projectedAvailable.value - dashboard.value.creditLimit.availableMON, 0);
});

const onSubmit = handleSubmit(async (formValues) => {
  await mutation.mutateAsync(formValues.amountMON);
});

const isSubmittingRepayment = computed(() => mutation.isPending.value);
const quickAmounts = computed(() => {
  const outstanding = dashboard.value?.loanPosition.outstandingMON ?? 0;
  const candidates = [0.5, 1, 2, Number(Math.min(outstanding, 3).toFixed(1))];

  return [...new Set(candidates.map((value) => Number(value.toFixed(1))))]
    .filter((value) => value >= 0.3 && value <= outstanding && value > 0)
    .slice(0, 4);
});
</script>

<template>
  <div v-if="dashboard" class="mx-auto max-w-[28rem] space-y-5">
    <div class="flex flex-col gap-4">
      <h2 class="font-display text-3xl font-bold text-ink-950">Parcali odeme</h2>
      <StatusBadge
        :tone="dashboard.loanPosition.outstandingMON > 3 ? 'warning' : 'success'"
        :label="dashboard.loanPosition.outstandingMON > 3 ? 'Odeme baskisi var' : 'Ritim dengede'"
      />
    </div>

    <section class="grid gap-5">
      <BaseCard>
        <form class="space-y-6" @submit="onSubmit">
          <div class="space-y-3">
            <p class="font-semibold text-ink-950">Bugun ne kadar odeyeceksin?</p>
            <div class="grid gap-3">
              <BaseFormField
                label="Odeme tutari (MON)"
                :error="errors.amountMON"
                required
              >
                <input
                  v-model="amountMON"
                  v-bind="amountAttrs"
                  type="number"
                  min="0.3"
                  step="0.1"
                  class="focus-ring min-h-12 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-[1.1rem] font-semibold text-ink-950"
                />
              </BaseFormField>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="value in quickAmounts"
                  :key="value"
                  type="button"
                  class="focus-ring min-h-11 rounded-2xl border border-ink-300/50 bg-white px-3 py-2 text-sm font-semibold text-ink-900 transition-colors hover:bg-cream-50"
                  @click="amountMON = value"
                >
                  {{ formatMON(value) }} MON
                </button>
              </div>
            </div>
          </div>

          <div class="grid gap-3">
            <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
              <p class="text-sm text-ink-700">Tahmini yeni limit</p>
              <p class="mt-2 font-display text-3xl font-bold text-ink-950">{{ formatMON(projectedAvailable) }} MON</p>
            </div>
            <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
              <p class="text-sm text-ink-700">Toparlanacak alan</p>
              <p class="mt-2 font-display text-3xl font-bold text-ink-950">{{ formatMON(nextLift) }} MON</p>
            </div>
          </div>

          <div v-if="submitError" class="rounded-2xl bg-danger-100 px-4 py-3 text-sm font-medium text-danger-500">
            {{ submitError }}
          </div>

          <BaseButton type="submit" :disabled="isSubmittingRepayment" block>
            {{ isSubmittingRepayment ? 'MetaMask onay bekleniyor...' : 'Odemeyi isle' }}
            <ArrowRight v-if="!isSubmittingRepayment" class="h-4 w-4" />
          </BaseButton>
        </form>
      </BaseCard>

      <div class="space-y-4">
        <div class="rounded-[1.5rem] bg-ink-950 p-5 text-white">
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Canli etki</p>
          <p class="mt-3 font-display text-4xl font-bold">{{ formatMON(nextLift) }} MON</p>
          <p class="mt-2 text-sm text-white/80">Bu odemeyle toparlanacak limit</p>
        </div>

        <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <WalletCards class="h-4 w-4" />
            </div>
            <div>
              <p class="font-semibold text-ink-950">Acik borc</p>
              <p class="mt-1 text-sm text-ink-700">{{ formatMON(dashboard.loanPosition.outstandingMON) }} MON</p>
            </div>
          </div>
        </div>

        <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-success-100 text-success-500">
              <Sparkles class="h-4 w-4" />
            </div>
            <div>
              <p class="font-semibold text-ink-950">Mevcut limit</p>
              <p class="mt-1 text-sm text-ink-700">{{ formatMON(dashboard.creditLimit.availableMON) }} MON</p>
            </div>
          </div>
        </div>

        <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
          <p class="font-semibold text-ink-950">Siradaki odemeler</p>
          <ul class="mt-4 space-y-3">
            <li
              v-for="installment in dashboard.repaymentSchedule"
              :key="installment.id"
              class="rounded-[1rem] border border-ink-300/50 bg-cream-50 px-3 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-semibold text-ink-950">{{ formatMON(installment.amountMON) }} MON</p>
                <StatusBadge
                  :tone="installment.status === 'riskli' ? 'danger' : installment.status === 'tamamlandi' ? 'success' : 'neutral'"
                  :label="installment.dueLabel"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <BaseDialog
      :open="successOpen"
      title="Odeme kaydedildi"
      description="Parcali odeme panel ve gecmis akisina islendi."
      @close="successOpen = false"
    >
      <div class="flex flex-col gap-3">
        <RouterLink to="/uygulama/panel">
          <BaseButton>Panele don</BaseButton>
        </RouterLink>
        <BaseButton variant="ghost" @click="successOpen = false">Kapat</BaseButton>
      </div>
    </BaseDialog>
  </div>
</template>
