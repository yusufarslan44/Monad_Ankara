<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowRight, Mail, ShieldCheck, Wallet } from 'lucide-vue-next';
import { useSessionStore } from '@/stores/session';
import { isMobileMetaMaskEnvironment } from '@/shared/adapters/walletAdapter';
import { onboardingFormSchema, verificationCodeSchema } from '@/shared/lib/formSchemas';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseFormField from '@/shared/components/BaseFormField.vue';
import StatusBadge from '@/shared/components/StatusBadge.vue';

const router = useRouter();
const route = useRoute();
const session = useSessionStore();
const { identity, wallet, loading, isAppReady } = storeToRefs(session);

const submissionError = ref('');

const clearSubmissionError = () => {
  submissionError.value = '';
};

const identitySchema = toTypedSchema(onboardingFormSchema);
const codeSchema = toTypedSchema(verificationCodeSchema);

const { errors: identityErrors, defineField: defineIdentityField, handleSubmit: handleIdentitySubmit } = useForm({
  validationSchema: identitySchema,
  initialValues: {
    name: 'Derya Kaya',
    university: 'Yildiz Teknik Universitesi',
    email: 'derya@std.yildiz.edu.tr',
    referralCode: '',
  },
});

const [name, nameAttrs] = defineIdentityField('name');
const [university, universityAttrs] = defineIdentityField('university');
const [email, emailAttrs] = defineIdentityField('email');
const [referralCode, referralCodeAttrs] = defineIdentityField('referralCode');

const {
  errors: codeErrors,
  defineField: defineCodeField,
  handleSubmit: handleCodeSubmit,
  resetForm: resetCodeForm,
} = useForm({
  validationSchema: codeSchema,
  initialValues: {
    code: '123456',
  },
});

const [code, codeAttrs] = defineCodeField('code');

const isInvestorMode = computed(() => route.query.rol === 'yatirimci');
const isLoginIntent = computed(() => route.query.mod === 'giris' && !isInvestorMode.value);
const isMobileMetaMaskFlow = computed(() => isMobileMetaMaskEnvironment() && !wallet.value.isInstalled);

const isWalletStep = computed(() => wallet.value.status !== 'bagli');
const isIdentityStep = computed(
  () => !isInvestorMode.value && wallet.value.status === 'bagli' && identity.value.status === 'baslamadi',
);
const isVerificationStep = computed(
  () => !isInvestorMode.value && wallet.value.status === 'bagli' && identity.value.status === 'dogrulaniyor',
);

const isInvestorReady = computed(
  () => isInvestorMode.value && wallet.value.status === 'bagli' && wallet.value.isSupportedNetwork !== false,
);

const currentStep = computed(() => {
  if (isAppReady.value || isInvestorReady.value) {
    return 3;
  }

  if (isVerificationStep.value) {
    return 2;
  }

  if (isIdentityStep.value || wallet.value.status === 'bagli') {
    return 1;
  }

  return 0;
});

const walletButtonLabel = computed(() => {
  if (isMobileMetaMaskFlow.value) {
    return 'MetaMask mobilde ac';
  }

  if (!wallet.value.isInstalled) {
    return 'MetaMask kur';
  }

  if (wallet.value.status === 'baglaniyor') {
    return 'MetaMask baglaniyor';
  }

  return 'MetaMask ile baglan';
});

const walletHint = computed(() => {
  if (wallet.value.error) {
    return wallet.value.error;
  }

  if (!wallet.value.isInstalled) {
    if (isMobileMetaMaskFlow.value) {
      return 'MetaMask mobil uygulamasinda acarak baglan. Gerekirse public dapp URL ayarini kullan.';
    }

    return 'Devam etmek icin MetaMask kurulumu gerekli.';
  }

  if (isLoginIntent.value) {
    return 'Kayitli hesabinla devam etmek icin MetaMask bagla.';
  }

  return `${wallet.value.network} uzerinden devam edeceksin.`;
});

const steps = computed(() =>
  isInvestorMode.value
    ? [
        { label: 'Cuzdan' },
        { label: 'Havuz' },
      ]
    : [
        { label: 'Cuzdan' },
        { label: 'Kimlik' },
        { label: 'Dogrulama' },
        { label: 'Panel' },
      ],
);

const onIdentitySubmit = handleIdentitySubmit(async (values) => {
  clearSubmissionError();

  try {
    await session.startVerification(values.name, values.university, values.email, values.referralCode || undefined);
    resetCodeForm({
      values: {
        code: '123456',
      },
    });
  } catch (error) {
    submissionError.value = error instanceof Error ? error.message : 'Kod gonderilemedi. Lutfen tekrar dene.';
  }
});

const onCodeSubmit = handleCodeSubmit(async (values) => {
  clearSubmissionError();

  try {
    await session.verifyCode(values.code);
  } catch (error) {
    submissionError.value = error instanceof Error ? error.message : 'Kod dogrulanamadi. Lutfen tekrar dene.';
  }
});

const handleWalletAction = async () => {
  clearSubmissionError();

  if (!wallet.value.isInstalled && !isMobileMetaMaskFlow.value) {
    if (typeof window !== 'undefined') {
      window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
    }
    return;
  }

  try {
    await session.connectWallet();
  } catch (error) {
    submissionError.value = error instanceof Error ? error.message : 'Cuzdan baglanamadi.';
  }
};

watch(
  () => route.query.rol,
  (rol) => {
    session.setMode(rol === 'yatirimci' ? 'investor' : 'student');
  },
  { immediate: true },
);

watch(
  isAppReady,
  async (ready) => {
    if (ready && !isInvestorMode.value) {
      await router.replace('/uygulama/panel');
    }
  },
  { immediate: true },
);

watch(
  isInvestorReady,
  async (ready) => {
    if (ready) {
      await router.replace('/uygulama/havuz');
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="px-4 pb-32 pt-4">
    <div class="mx-auto max-w-[28rem]">
      <section class="surface-card p-5">
        <div class="space-y-3">
          <span class="label-chip">{{ isInvestorMode ? 'Yatirimci' : isLoginIntent ? 'Giris' : 'Kayit' }}</span>
          <h1 class="font-display text-[2rem] font-bold text-ink-950">
            {{ isInvestorMode ? 'Cuzdani bagla' : isLoginIntent ? 'Hesabina gir' : 'Kampus kimligini olustur' }}
          </h1>
        </div>

        <div class="mt-6 space-y-4">
          <!-- Adim 1: Cuzdan -->
          <div v-if="isWalletStep" class="space-y-5">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-500">
                  <Wallet class="h-5 w-5" />
                </div>
                <div>
                  <p class="font-semibold text-ink-950">Cuzdan baglama</p>
                </div>
              </div>
              <StatusBadge tone="warning" label="Cuzdan bekleniyor" />
              <StatusBadge v-if="submissionError" tone="danger" :label="submissionError" class="mt-2" />
            </div>

            <div class="space-y-1 rounded-2xl border border-ink-300/50 bg-white px-4 py-4">
              <p class="text-sm text-ink-700">{{ walletHint }}</p>
              <p v-if="wallet.address" class="mt-1 break-words text-sm text-ink-700">{{ wallet.address }}</p>
            </div>

            <BaseButton :disabled="loading" block @click="handleWalletAction()">
              {{ walletButtonLabel }}
              <ArrowRight class="h-4 w-4" />
            </BaseButton>
          </div>

          <!-- Adim 2: Kimlik bilgileri -->
          <form v-else-if="isIdentityStep" class="space-y-5" @submit="onIdentitySubmit">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                  <ShieldCheck class="h-5 w-5" />
                </div>
                <div>
                  <p class="font-semibold text-ink-950">Kampus kimligi</p>
                </div>
              </div>
              <StatusBadge tone="warning" label="E-posta bekleniyor" />
              <StatusBadge v-if="submissionError" tone="danger" :label="submissionError" class="mt-2" />
            </div>

            <div class="grid gap-4">
              <BaseFormField
                label="Ad Soyad"
                :error="identityErrors.name"
                required
              >
                <input
                  v-model="name"
                  v-bind="nameAttrs"
                  autocomplete="name"
                  class="focus-ring min-h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-[16px] text-ink-950"
                  placeholder="Ad soyad"
                />
              </BaseFormField>

              <BaseFormField
                label="Universite"
                :error="identityErrors.university"
                required
              >
                <input
                  v-model="university"
                  v-bind="universityAttrs"
                  autocomplete="organization"
                  class="focus-ring min-h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-[16px] text-ink-950"
                  placeholder="Universite adi"
                />
              </BaseFormField>
            </div>

            <BaseFormField
              label="Okul e-postasi"
              :error="identityErrors.email"
              required
            >
              <input
                v-model="email"
                v-bind="emailAttrs"
                type="email"
                autocomplete="email"
                inputmode="email"
                class="focus-ring min-h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-[16px] text-ink-950"
                placeholder="isim@std.universite.edu.tr"
              />
            </BaseFormField>

            <BaseFormField
              label="Davet kodu (opsiyonel)"
              :error="identityErrors.referralCode"
            >
              <input
                v-model="referralCode"
                v-bind="referralCodeAttrs"
                class="focus-ring min-h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-[16px] text-ink-950"
                placeholder="MON-XXXXXX"
              />
            </BaseFormField>

            <BaseButton :disabled="loading" type="submit" block>
              Dogrulama kodu gonder
              <Mail class="h-4 w-4" />
            </BaseButton>
          </form>

          <!-- Adim 3: Kod dogrulama -->
          <form v-else-if="isVerificationStep" class="space-y-5" @submit="onCodeSubmit">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="grid h-11 w-11 place-items-center rounded-2xl bg-brand-100 text-brand-700">
                  <Mail class="h-5 w-5" />
                </div>
                <div>
                  <p class="font-semibold text-ink-950">E-posta dogrulama</p>
                </div>
              </div>
              <StatusBadge tone="warning" label="Kod bekleniyor" />
              <StatusBadge v-if="submissionError" tone="danger" :label="submissionError" class="mt-2" />
            </div>

            <div class="rounded-2xl border border-ink-300/50 bg-white px-4 py-4">
              <p class="text-sm text-ink-700">
                <span class="font-semibold text-ink-950">{{ identity.email }}</span> adresine 6 haneli kod gonderildi.
                Spam kutusunu da kontrol etmeyi unutma.
              </p>
              <p class="mt-2 text-xs text-ink-500">
                Not: E-posta servisi yapilandirilmamissa kod, backend calistigi terminal ekranina yazilir.
              </p>
            </div>

            <BaseFormField
              label="Dogrulama kodu"
              :error="codeErrors.code"
              required
            >
              <input
                v-model="code"
                v-bind="codeAttrs"
                inputmode="numeric"
                maxlength="6"
                class="focus-ring min-h-11 w-full rounded-2xl border border-ink-300/50 bg-white px-4 py-3 text-[16px] text-ink-950"
                placeholder="123456"
              />
            </BaseFormField>

            <BaseButton :disabled="loading" type="submit" block>
              Kodu dogrula
              <ArrowRight class="h-4 w-4" />
            </BaseButton>
          </form>
        </div>
      </section>
    </div>

    <nav class="fixed inset-x-3 bottom-3 z-40" aria-label="Kayit adimlari">
      <div class="mx-auto max-w-[24rem] rounded-[1.5rem] border border-white/80 bg-white/92 p-1.5 shadow-2xl backdrop-blur">
        <ol :class="isInvestorMode ? 'grid-cols-2' : 'grid-cols-4'" class="grid gap-2">
          <li v-for="(step, index) in steps" :key="step.label">
            <div
              :aria-current="index === currentStep ? 'step' : undefined"
              :class="
                index <= currentStep
                  ? 'bg-brand-100 text-brand-700 shadow-[inset_0_0_0_1px_rgba(229,36,42,0.12)]'
                  : 'text-ink-700'
              "
              class="flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-[1rem] px-1.5 py-1.5 text-[10px] font-semibold transition-all duration-200 ease-[var(--ease-fluid)]"
            >
              <span
                :class="
                  index <= currentStep
                    ? 'bg-brand-600 text-white'
                    : 'bg-cream-100 text-ink-700'
                "
                class="grid h-[1.125rem] w-[1.125rem] place-items-center rounded-full text-[9px] font-bold transition-all duration-200 ease-[var(--ease-fluid)]"
              >
                {{ index + 1 }}
              </span>
              <span
                class="transition-transform duration-200 ease-[var(--ease-fluid)]"
                :class="index === currentStep ? '-translate-y-0.5' : ''"
              >
                {{ step.label }}
              </span>
            </div>
          </li>
        </ol>
      </div>
    </nav>
  </div>
</template>
