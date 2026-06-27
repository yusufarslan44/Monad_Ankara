<script setup lang="ts">
defineProps<{
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
}>();
</script>

<template>
  <label class="block space-y-2">
    <span class="text-sm font-semibold text-ink-900">
      {{ label }}
      <span v-if="required" class="text-coral-500">*</span>
    </span>
    <slot />
    <p v-if="helper && !error" class="text-sm text-ink-700">
      {{ helper }}
    </p>
    <p v-if="error" class="text-sm font-medium text-danger-500" role="alert">
      {{ error }}
    </p>
  </label>
</template>
