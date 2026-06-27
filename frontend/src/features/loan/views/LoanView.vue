<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowRight, ShieldCheck, Sparkles, WalletCards } from 'lucide-vue-next';
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

const showGuaranteeLink = ref(false);

const mapLoanError = (message: string): { text: string; guarantee: boolean } => {
  if (message.includes('User rejected') || message.includes('4001')) {
    return { text: 'MetaMask isteği reddedildi.', guarantee: false };
  }
  if (message.includes('insufficient funds')) {
    return { text: 'Cuzdaninda islem ucreti (gas) icin yeterli MON yok.', guarantee: false };
  }
  if (message.includes('ExceedsCreditLimit')) {
    return { text: 'Bu tutar kredi limitini asiyor. Daha dusuk tutar dene veya kefalet ekle.', guarantee: true };
  }
  if (message.includes('InsufficientLiquidity')) {
    return { text: 'Havuzda yeterli likidite yok. Daha sonra tekrar dene.', guarantee: false };
  }
  if (message.includes('AlreadyHasLoan')) {
    return { text: 'Zaten aktif bir borcun var. Once mevcut borcu kapat.', guarantee: false };
  }
  if (message.includes('NotStudent')) {
    return { text: 'Once kampus kimligini dogrulamalisin.', guarantee: false };
  }
  return { text: message || 'Kredi istegi tamamlanamadi.', guarantee: false };
};

const mutation = useMutation({
  mutationFn: (payload: { amountMON: number; purpose: string }) =>
    dataAdapter.submitLoanRequest(payload.amountMON, payload.purpose),
  onSuccess: async () => {
    submitError.value = '';
    showGuaranteeLink.value = false;
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
    const message = error instanceof Error ? error.message : '';
    const mapped = mapLoanError(message);
    submitError.value = mapped.text;
    showGuaranteeLink.value = mapped.guarantee;
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
const quickAmounts = computed(() => {
  const available = dashboard.value?.creditLimit.availableMON ?? 0;
  const candidates = [1, 2, 3, Number(available.toFixed(1))];

  return [...new Set(candidates.map((value) => Number(value.toFixed(1))))]
    .filter((value) => value >= 0.5 && value <= available && value > 0)
    .slice(0, 4);
});

const purposeOptions = ['Kantin ve ulasim', 'Yemek', 'Kirtasiye', 'Acil ihtiyac'];
</script>

<template>
  <div class="mx-auto max-w-[28rem] space-y-5">
    <div class="flex flex-col gap-4">
      <h2 class="font-display text-3xl font-bold text-ink-950">Yeni kredi istegi</h2>
      <StatusBadge
        :tone="isGuaranteeRequired ? 'warning' : 'success'"
        :label="isGuaranteeRequired ? 'Kefalet gerekebilir' : 'Limit yeterli'"
      />
    </div>

    <section class="grid gap-5">
      <BaseCard>
        <form class="space-y-6" @submit="onSubmit">
          <div class="space-y-3">
            <p class="font-semibold text-ink-950">Ne kadar lazim?</p>
            <div class="grid gap-3">
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

          <div class="space-y-3">
            <p class="font-semibold text-ink-950">Ne icin kullanacaksin?</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in purposeOptions"
                :key="option"
                type="button"
                class="focus-ring min-h-11 rounded-full border border-ink-300/50 bg-white px-4 py-2 text-sm font-semibold text-ink-800 transition-colors hover:bg-cream-50"
                @click="purpose = option"
              >
                {{ option }}
              </button>
            </div>
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
          </div>

          <div
            :class="isGuaranteeRequired ? 'border-amber-200 bg-amber-100/70 text-amber-500' : 'border-success-100 bg-success-100/60 text-success-500'"
            class="rounded-[1.25rem] border px-4 py-4 text-sm font-medium"
          >
            {{ isGuaranteeRequired ? 'Bu tutar mevcut limiti asiyor. Kefalet adimi gerekebilir.' : 'Bu tutar tek adimda acilabilir.' }}
          </div>

          <div v-if="submitError" class="rounded-2xl bg-danger-100 px-4 py-3 text-sm font-medium text-danger-500">
            {{ submitError }}
            <RouterLink v-if="showGuaranteeLink" to="/uygulama/kefalet" class="ml-2 underline">
              Kefalet ekranina git
            </RouterLink>
          </div>

          <BaseButton type="submit" :disabled="isSubmittingLoan" block>
            {{ isSubmittingLoan ? 'MetaMask onay bekleniyor...' : 'Nano-krediyi ac' }}
            <ArrowRight v-if="!isSubmittingLoan" class="h-4 w-4" />
          </BaseButton>
        </form>
      </BaseCard>

      <div class="space-y-4">
        <div class="rounded-[1.5rem] bg-brand-600 p-5 text-white">
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Canli ozet</p>
          <p class="mt-3 font-display text-4xl font-bold">{{ formatMON(availableAfter) }} MON</p>
          <p class="mt-2 text-sm text-white/80">Islemden sonra kalacak limit</p>
        </div>

        <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <WalletCards class="h-4 w-4" />
            </div>
            <div>
              <p class="font-semibold text-ink-950">Acik limit</p>
              <p class="mt-1 text-sm text-ink-700">{{ formatMON(dashboard?.creditLimit.availableMON ?? 0) }} MON</p>
            </div>
          </div>
        </div>

        <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-500">
              <Sparkles class="h-4 w-4" />
            </div>
            <div>
              <p class="font-semibold text-ink-950">Mikro ucret</p>
              <p class="mt-1 text-sm text-ink-700">{{ formatMON(loanFee) }} MON</p>
            </div>
          </div>
        </div>

        <div class="rounded-[1.25rem] border border-ink-300/50 bg-white p-4">
          <div class="flex items-start gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-2xl bg-coral-100 text-coral-500">
              <ShieldCheck class="h-4 w-4" />
            </div>
            <div>
              <p class="font-semibold text-ink-950">Kalan limit</p>
              <p class="mt-1 text-sm text-ink-700">{{ formatMON(availableAfter) }} MON</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <BaseDialog
      :open="successOpen"
      title="Nano-kredi acildi"
      description="Islem zincire gonderildi. MON cuzdanina aktarildi; panel ve gecmis kisa surede guncellenecek."
      @close="successOpen = false"
    >
      <div class="flex flex-col gap-3">
        <RouterLink to="/uygulama/panel">
          <BaseButton>Panele don</BaseButton>
        </RouterLink>
        <BaseButton variant="ghost" @click="successOpen = false">Yeni tutar dene</BaseButton>
      </div>
    </BaseDialog>
  </div>
</template>
