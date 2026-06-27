<script setup lang="ts">
import { useHistoryQuery } from '@/shared/composables/useAppQueries';
import BaseCard from '@/shared/components/BaseCard.vue';
import TimelineList from '@/shared/components/TimelineList.vue';

const { data } = useHistoryQuery();
</script>

<template>
  <div v-if="data" class="mx-auto max-w-4xl space-y-5">
    <BaseCard>
      <h2 class="font-display text-3xl font-bold text-ink-950">Tum hareketler</h2>
      <p class="mt-2 text-sm text-ink-700">Islemler sirali sekilde listelenir.</p>
    </BaseCard>

    <BaseCard>
      <TimelineList :items="data.items" />
    </BaseCard>
  </div>
</template>
