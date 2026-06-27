<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useGuaranteeQuery } from '@/shared/composables/useAppQueries';
import { getExposureRiskCopy } from '@/shared/lib/calculations';
import { formatMON } from '@/shared/lib/formatters';
import BaseButton from '@/shared/components/BaseButton.vue';
import BaseCard from '@/shared/components/BaseCard.vue';
import BaseDialog from '@/shared/components/BaseDialog.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import StatusBadge from '@/shared/components/StatusBadge.vue';
import { dataAdapter } from '@/shared/adapters/dataAdapter';

const queryClient = useQueryClient();
const { data } = useGuaranteeQuery();
const selectedRequestId = ref<string | null>(null);

const selectedRequest = computed(() =>
  data.value?.requests.find((request) => request.id === selectedRequestId.value),
);

const mutation = useMutation({
  mutationFn: (requestId: string) => dataAdapter.approveGuaranteeRequest(requestId),
  onSuccess: async () => {
    selectedRequestId.value = null;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['guarantees'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['history'] }),
    ]);
  },
});

const isApproving = computed(() => mutation.isPending.value);
</script>

<template>
  <div v-if="data" class="mx-auto max-w-5xl space-y-5">
    <BaseCard>
      <h2 class="font-display text-3xl font-bold text-ink-950">Aktif kefalet tamponlari</h2>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <article
          v-for="exposure in data.exposures"
          :key="exposure.id"
          class="surface-muted p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-ink-950">{{ exposure.friendName }}</p>
            </div>
            <StatusBadge
              :tone="exposure.risk === 'Yuksek' ? 'danger' : exposure.risk === 'Orta' ? 'warning' : 'success'"
              :label="getExposureRiskCopy(exposure)"
            />
          </div>
          <p class="mt-5 font-display text-3xl font-bold text-ink-950">
            {{ formatMON(exposure.amountMON) }} MON
          </p>
          <p class="mt-2 text-sm text-ink-700">{{ exposure.status }}</p>
        </article>
      </div>
    </BaseCard>

    <BaseCard>
      <h2 class="font-display text-2xl font-bold text-ink-950">Gelen talepler</h2>
      <div v-if="data.requests.length" class="mt-5 space-y-3">
        <article
          v-for="request in data.requests"
          :key="request.id"
          class="surface-muted p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-ink-950">{{ request.friendName }}</p>
            </div>
            <StatusBadge
              :tone="request.status === 'Onaylandi' ? 'success' : 'neutral'"
              :label="request.status"
            />
          </div>
          <p class="mt-4 font-display text-3xl font-bold text-ink-950">{{ formatMON(request.amountMON) }} MON</p>
          <div class="mt-4 flex items-center justify-between gap-3">
            <p class="text-sm text-ink-700">{{ request.requestedAt }}</p>
            <BaseButton
              v-if="request.status !== 'Onaylandi'"
              variant="secondary"
              @click="selectedRequestId = request.id"
            >
              Kefil ol
            </BaseButton>
          </div>
        </article>
      </div>
      <EmptyState
        v-else
        title="Bekleyen talep yok"
        detail="Yeni talepler burada listelenir."
      />
    </BaseCard>

    <BaseDialog
      :open="Boolean(selectedRequest)"
      title="Kefalet talebini onayla"
      description="Onay verirsen kendi limitinden belirli tutar blokelenir."
      @close="selectedRequestId = null"
    >
      <div v-if="selectedRequest" class="space-y-4">
        <div class="rounded-2xl bg-surface-0 p-4">
          <p class="font-semibold text-ink-950">{{ selectedRequest.friendName }}</p>
          <p class="mt-2 text-sm text-ink-700">{{ selectedRequest.message }}</p>
          <p class="mt-3 font-display text-3xl font-bold text-ink-950">{{ formatMON(selectedRequest.amountMON) }} MON</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <BaseButton :disabled="isApproving" @click="mutation.mutate(selectedRequest.id)">
            Evet, kefil ol
          </BaseButton>
          <BaseButton variant="ghost" @click="selectedRequestId = null">Vazgec</BaseButton>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>
