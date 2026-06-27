<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowRight, ShieldCheck, Wallet } from 'lucide-vue-next';
import { useSessionStore } from '@/stores/session';
import { onboardingFormSchema } from '@/shared/lib/formSchemas';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseFormField from '@/shared/components/BaseFormField.vue';
import StatusBadge from '@/shared/components/StatusBadge.vue';

const router = useRouter();
const session = useSessionStore();
const { identity, wallet, loading, isAppReady } = storeToRefs(session);

const schema = toTypedSchema(onboardingFormSchema);

const { errors, defineField, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    name: 'Derya Kaya',
    university: 'Yildiz Teknik Universitesi',
    email: 'derya@std.yildiz.edu.tr',
  },
});

const [name, nameAttrs] = defineField('name');
const [university, universityAttrs] = defineField('university');
const [email, emailAttrs] = defineField('email');

const isIdentityStep = computed(() => identity.value.status !== 'dogrulandi');
const isWalletStep = computed(() => identity.value.status === 'dogrulandi' && wallet.value.status !== 'bagli');

const currentStep = computed(() => {
  if (isAppReady.value) {
    return 2;
  }

  if (identity.value.status === 'dogrulandi') {
    return 1;
  }

  return 0;
});

const steps = [
  {
    label: 'Kimlik',
  },
  {
    label: 'Cuzdan',
  },
  {
    label: 'Panel',
  },
];

const onSubmit = handleSubmit(async (values) => {
  await session.submitCampusEmail(values.name, values.university, values.email);
});

watch(
  isAppReady,
  async (ready) => {
    if (ready) {
      await router.replace('/uygulama/panel');
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="px-4 pb-32 pt-4 sm:px-5 sm:pb-36 lg:px-6">
    <div class="mx-auto max-w-3xl">
      <section class="surface-card p-5 sm:p-7">
        <div class="space-y-3">
          <span class="label-chip">Kayit</span>
          <h1 class="font-display text-[2rem] font-bold text-ink-950 sm:text-[2.5rem]">
            Kampus kimligini olustur
          </h1>
        </div>

        <div class="mt-6 space-y-4 sm:space-y-5">
          <form v-if="isIdentityStep" class="space-y-5" @submit="onSubmit">
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
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <BaseFormField
                label="Ad Soyad"
                :error="errors.name"
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
                :error="errors.university"
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
              :error="errors.email"
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

            <BaseButton :disabled="loading" type="submit" block>
              Kampus kimligini olustur
            </BaseButton>
          </form>

          <div v-else-if="isWalletStep" class="space-y-5">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-500">
                  <Wallet class="h-5 w-5" />
                </div>
                <div>
                  <p class="font-semibold text-ink-950">Cuzdan baglama</p>
                </div>
              </div>
              <StatusBadge tone="success" label="Kimlik dogrulandi" />
            </div>

            <div class="space-y-1 rounded-2xl border border-ink-300/50 bg-white px-4 py-4">
              <p class="break-words font-semibold text-ink-950">{{ identity.email }}</p>
              <p class="text-sm text-ink-700">{{ session.studentProfile.university }}</p>
            </div>

            <BaseButton :disabled="loading" block @click="session.connectWallet()">
              Monad cuzdani bagla
              <ArrowRight class="h-4 w-4" />
            </BaseButton>
          </div>
        </div>
      </section>
    </div>

    <nav class="fixed inset-x-3 bottom-3 z-40" aria-label="Kayit adimlari">
      <div class="mx-auto max-w-xl rounded-[1.75rem] border border-white/80 bg-white/92 p-2 shadow-2xl backdrop-blur">
        <ol class="grid grid-cols-3 gap-2">
          <li v-for="(step, index) in steps" :key="step.label">
            <div
              :aria-current="index === currentStep ? 'step' : undefined"
              :class="
                index <= currentStep
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-ink-700'
              "
              class="flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold"
            >
              <span
                :class="
                  index <= currentStep
                    ? 'bg-brand-600 text-white'
                    : 'bg-cream-100 text-ink-700'
                "
                class="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold"
              >
                {{ index + 1 }}
              </span>
              <span>{{ step.label }}</span>
            </div>
          </li>
        </ol>
      </div>
    </nav>
  </div>
</template>
