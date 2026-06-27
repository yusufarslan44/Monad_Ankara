<script setup lang="ts">
defineProps<{
  steps: { label: string; detail?: string }[];
  active: number;
}>();
</script>

<template>
  <ol class="grid grid-cols-3 gap-2 sm:gap-3">
    <li
      v-for="(step, index) in steps"
      :key="step.label"
      :class="
        index <= active
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-ink-300/50 bg-white text-ink-700'
      "
      class="rounded-[1.1rem] border px-3 py-3 sm:px-4"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span
          :class="index <= active ? 'bg-brand-600 text-white' : 'bg-cream-100 text-ink-700'"
          class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold"
        >
          {{ index + 1 }}
        </span>
        <div class="min-w-0">
          <p
            :class="index <= active ? 'text-ink-950' : 'text-ink-800'"
            class="text-sm font-semibold sm:text-[0.95rem]"
          >
            {{ step.label }}
          </p>
          <p v-if="step.detail" class="mt-1 text-xs text-ink-700">{{ step.detail }}</p>
        </div>
      </div>
    </li>
  </ol>
</template>
