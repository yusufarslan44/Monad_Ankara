<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';
import { MoreHorizontal } from 'lucide-vue-next';
import type { NavItem } from '@/app/config/navigation';

defineProps<{
  items: NavItem[];
  showMore: boolean;
}>();

const emit = defineEmits<{
  more: [];
}>();

const route = useRoute();
</script>

<template>
  <nav class="fixed inset-x-0 bottom-3 z-40 px-3" aria-label="Alt gezinme">
    <div class="mx-auto max-w-[24rem] rounded-[1.75rem] border border-white/80 bg-white/95 p-2 shadow-2xl backdrop-blur">
      <ul class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${items.length + (showMore ? 1 : 0)}, minmax(0, 1fr))` }">
        <li v-for="item in items" :key="item.label">
          <RouterLink
            :to="item.to"
            class="focus-ring flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-semibold transition-all duration-200 ease-[var(--ease-fluid)] active:scale-[0.98]"
            :class="route.path === item.to ? 'bg-ink-950 text-white shadow-lg shadow-ink-950/10' : 'text-ink-700'"
          >
            <component
              :is="item.icon"
              class="h-4 w-4 transition-transform duration-200 ease-[var(--ease-fluid)]"
              :class="route.path === item.to ? 'scale-110' : ''"
            />
            <span class="transition-transform duration-200 ease-[var(--ease-fluid)] whitespace-nowrap text-center" :class="route.path === item.to ? '-translate-y-0.5' : ''">
              {{ item.label }}
            </span>
          </RouterLink>
        </li>
        <li v-if="showMore">
          <button
            class="focus-ring flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-semibold text-ink-700 transition-all duration-200 ease-[var(--ease-fluid)] active:scale-[0.98]"
            @click="emit('more')"
          >
            <MoreHorizontal class="h-4 w-4" />
            <span class="whitespace-nowrap">Daha</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>
