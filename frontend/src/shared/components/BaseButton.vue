<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    block?: boolean;
    disabled?: boolean;
  }>(),
  {
    type: 'button',
    variant: 'primary',
    block: false,
    disabled: false,
  },
);

const classes = computed(() => {
  const base =
    'focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-transform duration-200 ease-[var(--ease-fluid)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]';
  const block = props.block ? ' w-full' : '';
  const tone = {
    primary: 'bg-brand-600 text-white shadow-lg shadow-brand-600/15 hover:bg-brand-700',
    secondary: 'bg-ink-950 text-white hover:bg-ink-900',
    ghost: 'border border-ink-300/50 bg-white text-ink-900 hover:bg-cream-50',
    danger: 'bg-danger-500 text-white hover:bg-danger-500/90',
  }[props.variant];

  return `${base}${block} ${tone}`;
});
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
