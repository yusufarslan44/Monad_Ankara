<template>
  <div class="phone-stage min-h-dvh px-3 py-4">
    <div class="phone-frame mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-[26.5rem] flex-col overflow-hidden rounded-[2.75rem] border border-white/70 bg-cream-50 shadow-[0_30px_80px_rgba(17,24,39,0.22)]">
      <div class="pointer-events-none flex justify-center pt-3">
        <div class="h-1.5 w-24 rounded-full bg-ink-950/85" />
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <slot />
      </div>
    </div>
  </div>
</template>
