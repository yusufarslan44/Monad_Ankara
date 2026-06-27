<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
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

const mutation = useMutation({
  mutationFn: (amount: number) => dataAdapter.submitRepayment(amount),
  onSuccess: async () => {
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
</script>

<template>
  <div v-if="dashboard" class="mx-auto max-w-5xl space-y-5">
    <BaseCard>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="font-display text-3xl font-bold text-ink-950">Parcali odeme</h2>
          <p class="mt-2 text-sm text-ink-700">Kucuk odemelerle limitini toparla.</p>
        </div>
        <StatusBadge
          :tone="dashboard.loanPosition.outstandingMON > 3 ? 'warning' : 'success'"
          :label="dashboard.loanPosition.outstandingMON > 3 ? 'Odeme baskisi var' : 'Ritim dengede'"
        />
      </div>
    </BaseCard>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="surface-muted p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">Acik borc</p>
        <p class="mt-2 font-display text-2xl font-bold text-ink-950">{{ formatMON(dashboard.loanPosition.outstandingMON) }} MON</p>
      </div>
      <div class="surface-muted p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">Mevcut limit</p>
        <p class="mt-2 font-display text-2xl font-bold text-ink-950">{{ formatMON(dashboard.creditLimit.availableMON) }} MON</p>
      </div>
      <div class="surface-muted p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">Acilacak alan</p>
        <p class="mt-2 font-display text-2xl font-bold text-ink-950">{{ formatMON(dashboard.creditLimit.nextUnlockMON) }} MON</p>
      </div>
    </section>

    <BaseCard>
      <h3 class="font-display text-2xl font-bold text-ink-950">Odeme tutari</h3>
      <form class="mt-6 space-y-5" @submit="onSubmit">
        <BaseFormField
          label="Bugun ne kadar odemek istiyorsun?"
          :error="errors.amountMON"
          required
        >
          <input
            v-model="amountMON"
            v-bind="amountAttrs"
            type="number"
            min="0.3"
            step="0.1"
            class="focus-ring min-h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-ink-950"
          />
        </BaseFormField>

        <BaseButton type="submit" :disabled="isSubmittingRepayment">
          Parcali odemeyi isle
        </BaseButton>
      </form>
    </BaseCard>

    <section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <BaseCard>
        <h3 class="font-display text-2xl font-bold text-ink-950">Anlik etki</h3>
        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <div class="surface-muted p-4">
            <p class="text-sm text-ink-700">Tahmini yeni limit</p>
            <p class="mt-2 font-display text-3xl font-bold text-ink-950">{{ formatMON(projectedAvailable) }} MON</p>
          </div>
          <div class="surface-muted p-4">
            <p class="text-sm text-ink-700">Artan alan</p>
            <p class="mt-2 font-display text-3xl font-bold text-ink-950">{{ formatMON(nextLift) }} MON</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <h3 class="font-display text-2xl font-bold text-ink-950">Siradaki odemeler</h3>
        <ul class="mt-4 space-y-3">
          <li v-for="installment in dashboard.repaymentSchedule" :key="installment.id" class="surface-muted p-4">
            <div class="flex items-center justify-between gap-3">
              <p class="font-semibold text-ink-950">{{ formatMON(installment.amountMON) }} MON</p>
              <StatusBadge
                :tone="installment.status === 'riskli' ? 'danger' : installment.status === 'tamamlandi' ? 'success' : 'neutral'"
                :label="installment.dueLabel"
              />
            </div>
          </li>
        </ul>
      </BaseCard>
    </section>

    <BaseDialog
      :open="successOpen"
      title="Odeme kaydedildi"
      description="Parcali odeme panel ve gecmis akisina islendi."
      @close="successOpen = false"
    >
      <div class="flex flex-col gap-3 sm:flex-row">
        <RouterLink to="/uygulama/panel">
          <BaseButton>Panele don</BaseButton>
        </RouterLink>
        <BaseButton variant="ghost" @click="successOpen = false">Kapat</BaseButton>
      </div>
    </BaseDialog>
  </div>
</template>
