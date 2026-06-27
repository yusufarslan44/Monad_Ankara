<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { dataAdapter } from '@/shared/adapters/dataAdapter';
import { useDashboardQuery } from '@/shared/composables/useAppQueries';
import { loanFormSchema } from '@/shared/lib/formSchemas';
import { formatMON } from '@/shared/lib/formatters';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseCard from '@/shared/components/BaseCard.vue';
import BaseDialog from '@/shared/components/BaseDialog.vue';
import BaseFormField from '@/shared/components/BaseFormField.vue';
import StatusBadge from '@/shared/components/StatusBadge.vue';

const queryClient = useQueryClient();
const { data: dashboard } = useDashboardQuery();
const successOpen = ref(false);
const submitError = ref('');

const schema = toTypedSchema(loanFormSchema);

const { errors, defineField, resetForm, validate, values } = useForm({
  validationSchema: schema,
  initialValues: {
    amountMON: 2,
    purpose: 'Kantin ve ulasim',
  },
});

const [amountMON, amountAttrs] = defineField('amountMON', {
  validateOnModelUpdate: true,
});
const [purpose, purposeAttrs] = defineField('purpose', {
  validateOnModelUpdate: true,
});

const quoteQuery = useQuery({
  queryKey: computed(() => ['loan-quote', Number(values.amountMON) || 0]),
  queryFn: () => dataAdapter.getLoanQuote(Number(values.amountMON) || 0),
  enabled: computed(() => Number(values.amountMON) > 0),
});

const mutation = useMutation({
  mutationFn: (payload: { amountMON: number; purpose: string }) =>
    dataAdapter.submitLoanRequest(payload.amountMON, payload.purpose),
  onSuccess: async () => {
    submitError.value = '';
    successOpen.value = true;
    resetForm({
      values: {
        amountMON: 2,
        purpose: 'Kantin ve ulasim',
      },
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['guarantees'] }),
      queryClient.invalidateQueries({ queryKey: ['history'] }),
    ]);
  },
  onError: (error) => {
    submitError.value = error instanceof Error ? error.message : 'Kredi istegi tamamlanamadi.';
  },
});

const onSubmit = async (event: Event) => {
  event.preventDefault();
  const result = await validate();

  if (!result.valid) {
    return;
  }

  const safeValues = result.values;

  if (!safeValues) {
    return;
  }

  await mutation.mutateAsync({
    amountMON: safeValues.amountMON ?? 0,
    purpose: safeValues.purpose ?? '',
  });
};

const loanQuote = computed(() => quoteQuery.data.value);
const isGuaranteeRequired = computed(() => loanQuote.value?.requiresGuarantee ?? false);
const availableAfter = computed(() => loanQuote.value?.projectedAvailableMON ?? 0);
const loanFee = computed(() => loanQuote.value?.microFeeMON ?? 0);
const isSubmittingLoan = computed(() => mutation.isPending.value);
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <BaseCard>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="font-display text-3xl font-bold text-ink-950">Yeni kredi istegi</h2>
          <p class="mt-2 text-sm text-ink-700">Tutar sec, teklif gor, sonra onayla.</p>
        </div>
        <StatusBadge
          :tone="isGuaranteeRequired ? 'warning' : 'success'"
          :label="isGuaranteeRequired ? 'Kefalet gerekebilir' : 'Limit yeterli'"
        />
      </div>
    </BaseCard>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="surface-muted p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">Acik limit</p>
        <p class="mt-2 font-display text-2xl font-bold text-ink-950">
          {{ formatMON(dashboard?.creditLimit.availableMON ?? 0) }} MON
        </p>
      </div>
      <div class="surface-muted p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">Mikro ucret</p>
        <p class="mt-2 font-display text-2xl font-bold text-ink-950">
          {{ formatMON(loanFee) }} MON
        </p>
      </div>
      <div class="surface-muted p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">Kalan limit</p>
        <p class="mt-2 font-display text-2xl font-bold text-ink-950">
          {{ formatMON(availableAfter) }} MON
        </p>
      </div>
    </section>

    <BaseCard>
      <h3 class="font-display text-2xl font-bold text-ink-950">Tutar ve amac</h3>
      <form class="mt-6 space-y-5" @submit="onSubmit">
        <BaseFormField
          label="Tutar (MON)"
          :error="errors.amountMON"
          required
        >
          <input
            v-model="amountMON"
            v-bind="amountAttrs"
            type="number"
            step="0.1"
            min="0.5"
            class="focus-ring min-h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-ink-950"
          />
        </BaseFormField>

        <BaseFormField
          label="Kullanim amaci"
          :error="errors.purpose"
          required
        >
          <textarea
            v-model="purpose"
            v-bind="purposeAttrs"
            rows="4"
            class="focus-ring min-h-28 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-ink-950"
          />
        </BaseFormField>

        <div v-if="submitError" class="rounded-2xl bg-danger-100 px-4 py-3 text-sm font-medium text-danger-500">
          {{ submitError }}
          <RouterLink to="/uygulama/kefalet" class="ml-2 underline">
            Kefalet ekranina git
          </RouterLink>
        </div>

        <BaseButton type="submit" :disabled="isSubmittingLoan">
          Nano-krediyi ac
        </BaseButton>
      </form>
    </BaseCard>

    <BaseCard>
      <h3 class="font-display text-2xl font-bold text-ink-950">Durum</h3>
      <p class="mt-3 text-sm text-ink-700">
        {{ isGuaranteeRequired ? 'Secilen tutar mevcut limiti asiyor. Sonraki adim kefalet olabilir.' : 'Secilen tutar mevcut limite sigiyor. Islem tek adimda acilabilir.' }}
      </p>
    </BaseCard>

    <BaseDialog
      :open="successOpen"
      title="Nano-kredi acildi"
      description="Islem mock adapter uzerinden paneline islendi. Dashboard ve gecmis akisi guncellendi."
      @close="successOpen = false"
    >
      <div class="flex flex-col gap-3 sm:flex-row">
        <RouterLink to="/uygulama/panel">
          <BaseButton>Panele don</BaseButton>
        </RouterLink>
        <BaseButton variant="ghost" @click="successOpen = false">Yeni tutar dene</BaseButton>
      </div>
    </BaseDialog>
  </div>
</template>
