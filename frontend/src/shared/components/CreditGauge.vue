<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number;
  label: string;
  detail: string;
}>();

const dashOffset = computed(() => 251.2 - 251.2 * props.value);
</script>

<template>
  <div class="surface-muted flex flex-col items-center gap-4 p-5 text-center sm:p-6">
    <div class="relative grid place-items-center">
      <svg class="h-30 w-30 -rotate-90 sm:h-36 sm:w-36" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(23, 48, 54, 0.08)" stroke-width="10" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#19a69d"
          stroke-linecap="round"
          stroke-width="10"
          :stroke-dasharray="251.2"
          :stroke-dashoffset="dashOffset"
        />
      </svg>
      <div class="absolute inset-0 grid place-items-center">
        <span class="font-display text-[1.8rem] font-bold text-ink-950 sm:text-3xl">{{ Math.round(value * 100) }}%</span>
      </div>
    </div>
    <div>
      <p class="font-semibold text-ink-900">{{ label }}</p>
      <p class="mt-2 max-w-[28ch] text-sm leading-6 text-ink-700">{{ detail }}</p>
    </div>
  </div>
</template>
