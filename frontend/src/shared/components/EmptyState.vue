<script setup lang="ts">
defineProps<{
  title: string;
  detail: string;
}>();
</script>

<template>
  <div class="surface-muted p-6 text-center">
    <p class="font-display text-2xl font-bold text-ink-950">{{ title }}</p>
    <p class="mx-auto mt-3 max-w-[36ch] text-sm text-ink-700">{{ detail }}</p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
