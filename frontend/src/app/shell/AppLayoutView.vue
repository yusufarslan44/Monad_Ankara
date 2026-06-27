<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '@/app/shell/AppShell.vue';

const route = useRoute();
const transitionName = ref('page-slide-forward');
const previousOrder = ref(0);

type LayoutMeta = {
  layout?: 'plain' | 'app';
  pageOrder?: number;
};

watch(
  () => route.fullPath,
  () => {
    const nextOrder = Number((route.meta as LayoutMeta).pageOrder ?? 0);
    transitionName.value = nextOrder >= previousOrder.value ? 'page-slide-forward' : 'page-slide-back';
    previousOrder.value = nextOrder;
  },
  { immediate: true },
);
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="transitionName" mode="out-in" appear>
      <AppShell
        v-if="(route.meta as LayoutMeta).layout === 'app'"
        :key="route.fullPath"
      >
        <component :is="Component" />
      </AppShell>
      <div v-else :key="route.fullPath" class="min-h-dvh">
        <component :is="Component" />
      </div>
    </Transition>
  </RouterView>
</template>
