<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  description?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/45 px-4"
        @click.self="emit('close')"
      >
        <div class="surface-card w-full max-w-lg p-6">
          <div class="space-y-2">
            <h3 class="font-display text-2xl font-bold text-ink-950">
              {{ title }}
            </h3>
            <p v-if="description" class="text-sm text-ink-700">
              {{ description }}
            </p>
          </div>
          <div class="mt-5">
            <slot />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
