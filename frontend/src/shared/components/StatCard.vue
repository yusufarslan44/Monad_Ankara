<script setup lang="ts">
defineProps<{
  eyebrow: string;
  value: string;
  detail: string;
  trend?: string;
}>();
</script>

<template>
  <article class="surface-muted p-5 sm:p-6">
    <p class="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">
      {{ eyebrow }}
    </p>
    <div class="mt-3 flex items-start justify-between gap-4">
      <div>
        <p class="font-display text-[2rem] font-bold leading-none text-ink-950 sm:text-[2.2rem]">
          {{ value }}
        </p>
        <p class="mt-2 max-w-[26ch] text-sm leading-6 text-ink-700">
          {{ detail }}
        </p>
      </div>
      <span v-if="trend" class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-800 sm:text-sm">
        {{ trend }}
      </span>
    </div>
  </article>
</template>
