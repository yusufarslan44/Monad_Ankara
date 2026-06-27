<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppShell from '@/app/shell/AppShell.vue';

const route = useRoute();
</script>

<template>
  <AppShell v-if="route.meta.layout === 'app'">
    <RouterView />
  </AppShell>
  <div v-else class="min-h-dvh">
    <RouterView />
  </div>
</template>
