<script setup lang="ts">
import { ArrowUpRight, ShieldCheck, Sparkles, WalletCards } from 'lucide-vue-next';
import type { ActivityItem } from '@/shared/types/domain';
import { formatMON } from '@/shared/lib/formatters';

withDefaults(
  defineProps<{
    items: ActivityItem[];
    showDescription?: boolean;
  }>(),
  {
    showDescription: true,
  },
);

const iconMap = {
  odeme: WalletCards,
  borc: ArrowUpRight,
  kefalet: ShieldCheck,
  itibar: Sparkles,
};

const toneMap = {
  positive: 'bg-success-100 text-success-500',
  neutral: 'bg-brand-100 text-brand-700',
  warning: 'bg-amber-100 text-amber-500',
};
</script>

<template>
  <ol class="space-y-4">
    <li
      v-for="item in items"
      :key="item.id"
      class="flex gap-4 rounded-[1.25rem] border border-ink-300/50 bg-white p-4"
    >
      <div :class="toneMap[item.tone]" class="grid h-11 w-11 place-items-center rounded-2xl">
        <component :is="iconMap[item.type]" class="h-5 w-5" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-ink-950">{{ item.title }}</p>
            <p v-if="showDescription" class="mt-1 text-sm text-ink-700">{{ item.description }}</p>
          </div>
          <div class="text-right text-sm text-ink-700">
            <p>{{ item.at }}</p>
            <p v-if="item.amountMON" class="font-semibold text-ink-950">
              {{ formatMON(item.amountMON) }} MON
            </p>
          </div>
        </div>
      </div>
    </li>
  </ol>
</template>
