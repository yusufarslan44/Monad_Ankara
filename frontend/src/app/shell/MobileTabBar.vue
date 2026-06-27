<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';
import { MoreHorizontal } from 'lucide-vue-next';
import { mobileNavigation } from '@/app/config/navigation';

const route = useRoute();
const emit = defineEmits<{
  more: [];
}>();
</script>

<template>
  <nav
    class="fixed inset-x-3 bottom-3 z-40 rounded-[1.75rem] border border-white/80 bg-white/92 p-2 shadow-2xl backdrop-blur md:hidden"
    aria-label="Alt gezinme"
  >
    <ul class="grid grid-cols-5 gap-2">
      <li v-for="item in mobileNavigation" :key="item.label">
        <RouterLink
          :to="item.to"
          class="focus-ring flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold"
          :class="route.path === item.to ? 'bg-brand-100 text-brand-700' : 'text-ink-700'"
        >
          <component :is="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </li>
      <li>
        <button
          class="focus-ring flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold text-ink-700"
          @click="emit('more')"
        >
          <MoreHorizontal class="h-4 w-4" />
          <span>Daha</span>
        </button>
      </li>
    </ul>
  </nav>
</template>
