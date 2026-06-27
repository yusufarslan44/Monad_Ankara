<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <transition name="sheet">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-ink-950/45"
        @click.self="emit('close')"
      >
        <div
          class="absolute inset-x-0 bottom-0 rounded-t-[2rem] bg-surface-0 px-5 pb-8 pt-5 shadow-2xl"
        >
          <div class="mx-auto mb-4 h-1.5 w-14 rounded-full bg-ink-300/70" />
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="font-display text-xl font-bold text-ink-950">
              {{ title }}
            </h3>
            <button class="focus-ring rounded-full px-3 py-2 text-sm text-ink-700" @click="emit('close')">
              Kapat
            </button>
          </div>
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 220ms ease;
}

.sheet-enter-active > div,
.sheet-leave-active > div {
  transition: transform 220ms var(--ease-fluid);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from > div,
.sheet-leave-to > div {
  transform: translateY(100%);
}
</style>
