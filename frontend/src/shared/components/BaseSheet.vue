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
        class="fixed inset-0 z-50 bg-ink-950/52 backdrop-blur-[2px]"
        @click.self="emit('close')"
      >
        <div class="absolute inset-x-0 bottom-0 px-3 pb-3">
          <div
            class="mx-auto flex max-h-[72dvh] w-full max-w-[24rem] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-surface-0 shadow-[0_30px_80px_rgba(17,24,39,0.28)]"
          >
            <div class="pointer-events-none flex justify-center pt-3">
              <div class="h-1.5 w-14 rounded-full bg-ink-300/70" />
            </div>
            <div class="flex items-center justify-between gap-3 px-5 pb-4 pt-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700">Hizli erisim</p>
                <h3 class="mt-1 font-display text-xl font-bold text-ink-950">
                  {{ title }}
                </h3>
              </div>
              <button
                class="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-300/50 bg-surface-1 text-sm font-semibold text-ink-700"
                @click="emit('close')"
              >
                X
              </button>
            </div>
            <div class="overflow-y-auto px-5 pb-6">
              <slot />
            </div>
          </div>
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
