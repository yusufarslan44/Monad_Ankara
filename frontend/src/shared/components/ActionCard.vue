<script setup lang="ts">
defineProps<{
  title: string;
  detail: string;
  accent: string;
}>();
</script>

<template>
  <article :class="accent" class="rounded-[1.75rem] p-5 text-white shadow-[0_14px_28px_rgba(16,34,38,0.08)] sm:p-6">
    <h3 class="font-display text-[1.7rem] font-bold leading-tight">
      {{ title }}
    </h3>
    <p class="mt-3 max-w-[34ch] text-sm leading-6 text-white/82">
      {{ detail }}
    </p>
    <div class="mt-4">
      <slot />
    </div>
  </article>
</template>
