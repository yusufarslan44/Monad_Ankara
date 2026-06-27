<script setup lang="ts">
import { ArrowRight, Coins, PiggyBank, ShieldCheck, TimerReset, WalletCards } from 'lucide-vue-next';
import BaseButton from '@/shared/components/BaseButton.vue';

const pillars = [
  {
    title: 'Teminatsiz limit',
    detail: 'Ogrenci kimligi ve sosyal guven halkasi ile kampus ici nano-kredi acilir.',
    icon: WalletCards,
  },
  {
    title: 'Parcali geri odeme',
    detail: 'Sabit ekstre beklenmez. Para geldikce borc kapanir, limit yeniden acilir.',
    icon: TimerReset,
  },
  {
    title: 'Kefalet agi',
    detail: 'Arkadaslarin limit tamponu acarak ihtiyac aninda sana destek olabilir.',
    icon: ShieldCheck,
  },
  {
    title: 'Monad hizi',
    detail: 'Dusuk ucret ve hizli finality sayesinde mikro tutarlar ekonomik kalir.',
    icon: Coins,
  },
];
</script>

<template>
  <div class="px-4 py-4 sm:px-5 lg:px-6">
    <div class="mx-auto max-w-7xl space-y-5">
      <section class="surface-card overflow-hidden p-6 sm:p-8 lg:p-10">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <span class="label-chip">Kampus ici nano-lending ekosistemi</span>
            <h1 class="mt-5 max-w-[12ch] font-display text-5xl font-bold text-ink-950 sm:text-6xl">
              500 TL'lik ihtiyac icin banka bekleme devri bitsin.
            </h1>
            <p class="mt-5 max-w-[62ch] text-base text-ink-800 sm:text-lg">
              KampusMON, universite ogrencilerinin anlik nakit ihtiyacini Monad uzerinde
              teminatsiz, seffaf ve sosyal guven tabanli bir deneyime donusturur.
            </p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <RouterLink to="/uygulama?mod=kayit">
                <BaseButton>
                  Kayit ol
                  <ArrowRight class="h-4 w-4" />
                </BaseButton>
              </RouterLink>
              <RouterLink to="/uygulama?mod=giris">
                <BaseButton variant="ghost">
                  Giris yap
                </BaseButton>
              </RouterLink>
              <RouterLink to="/uygulama?rol=yatirimci">
                <BaseButton variant="secondary">
                  Yatirimci girisi
                  <PiggyBank class="h-4 w-4" />
                </BaseButton>
              </RouterLink>
              <a href="#neden-monad">
                <BaseButton variant="ghost">Neden Monad?</BaseButton>
              </a>
            </div>
            <dl class="mt-10 grid gap-4 sm:grid-cols-3">
              <div class="surface-muted p-4">
                <dt class="text-sm font-semibold uppercase tracking-[0.16em] text-ink-700">Onay hizi</dt>
                <dd class="mt-2 font-display text-3xl font-bold text-ink-950">~1 sn</dd>
              </div>
              <div class="surface-muted p-4">
                <dt class="text-sm font-semibold uppercase tracking-[0.16em] text-ink-700">Islem maliyeti</dt>
                <dd class="mt-2 font-display text-3xl font-bold text-ink-950">Mikro</dd>
              </div>
              <div class="surface-muted p-4">
                <dt class="text-sm font-semibold uppercase tracking-[0.16em] text-ink-700">Odeme modeli</dt>
                <dd class="mt-2 font-display text-3xl font-bold text-ink-950">Parcali</dd>
              </div>
            </dl>
          </div>

          <div class="rounded-[2rem] bg-ink-950 p-6 text-white">
            <p class="text-sm uppercase tracking-[0.16em] text-white/60">Canli senaryo</p>
            <h2 class="mt-4 font-display text-3xl font-bold">Kantin kasasinda sikisinca</h2>
            <p class="mt-3 text-sm text-white/75">
              Ogrenci e-postan dogrulanmis, cuzdani baglanmis ve limitin acik.
              Ihtiyac tutarini secip saniyeler icinde kredi acabiliyorsun.
            </p>
            <div class="mt-6 space-y-3">
              <div class="rounded-3xl bg-white/10 p-4">
                <p class="text-sm text-white/60">Acik limit</p>
                <p class="mt-2 font-display text-3xl font-bold">5.8 MON</p>
              </div>
              <div class="rounded-3xl bg-brand-600/30 p-4">
                <p class="text-sm text-white/60">Havuz yatirimi</p>
                <p class="mt-2 font-display text-3xl font-bold">2.0 MON</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="pillar in pillars"
          :key="pillar.title"
          class="surface-muted p-5"
        >
          <div class="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <component :is="pillar.icon" class="h-5 w-5" />
          </div>
          <h2 class="mt-4 font-display text-2xl font-bold text-ink-950">{{ pillar.title }}</h2>
          <p class="mt-3 text-sm text-ink-700">{{ pillar.detail }}</p>
        </article>
      </section>

      <section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div class="surface-card p-6 sm:p-8">
          <span class="label-chip">Nasil calisir?</span>
          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <article class="surface-muted p-5">
              <p class="text-sm uppercase tracking-[0.16em] text-ink-700">1</p>
              <h3 class="mt-2 font-semibold text-ink-950">Kampus kimligi kurulur</h3>
              <p class="mt-2 text-sm text-ink-700">Universite e-postasi ile soulbound ogrenci kimligi uretilir.</p>
            </article>
            <article class="surface-muted p-5">
              <p class="text-sm uppercase tracking-[0.16em] text-ink-700">2</p>
              <h3 class="mt-2 font-semibold text-ink-950">Nano-limit acilir</h3>
              <p class="mt-2 text-sm text-ink-700">Yeni kullanici kucuk limit ile baslar, odeme ritmine gore buyur.</p>
            </article>
            <article class="surface-muted p-5">
              <p class="text-sm uppercase tracking-[0.16em] text-ink-700">3</p>
              <h3 class="mt-2 font-semibold text-ink-950">Sosyal kefalet devreye girer</h3>
              <p class="mt-2 text-sm text-ink-700">Yetmeyen tutar icin arkadas limiti tampon olarak bloke edilir.</p>
            </article>
            <article class="surface-muted p-5">
              <p class="text-sm uppercase tracking-[0.16em] text-ink-700">4</p>
              <h3 class="mt-2 font-semibold text-ink-950">Parcali odeme ile itibar toparlanir</h3>
              <p class="mt-2 text-sm text-ink-700">Tek gunde kapatma zorunlulugu olmadan limit tekrar yukselir.</p>
            </article>
          </div>
        </div>

        <aside id="neden-monad" class="surface-card p-6 sm:p-8">
          <span class="label-chip">Neden Monad?</span>
          <h2 class="mt-5 font-display text-3xl font-bold text-ink-950">Nano-islem ekonomisi burada bozulmuyor.</h2>
          <ul class="mt-5 space-y-4 text-sm text-ink-700">
            <li class="surface-muted p-4">
              Dusuk ucretler sayesinde 20 TL karsiligi kredi bile platform icin anlamli kalir.
            </li>
            <li class="surface-muted p-4">
              Hizli finality, kasada bekleyen ogrenci icin banka uygulamasindan hizli bir his yaratir.
            </li>
            <li class="surface-muted p-4">
              Yuksek blok hizi, mikro-faiz ve anlik limit geri kazanimi gibi akislari dogal hale getirir.
            </li>
          </ul>
        </aside>
      </section>
    </div>
  </div>
</template>
