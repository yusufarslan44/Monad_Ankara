<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  tone: 'success' | 'warning' | 'neutral' | 'danger';
  label: string;
}>();

const classes = computed(() => {
  const variants = {
    success: 'bg-success-100 text-success-500',
    warning: 'bg-amber-100 text-amber-500',
    neutral: 'bg-brand-100 text-brand-700',
    danger: 'bg-danger-100 text-danger-500',
  };

  return variants[props.tone];
});
</script>

<template>
  <span :class="classes" class="inline-flex rounded-full px-3 py-1 text-xs font-semibold">
    {{ label }}
  </span>
</template>
