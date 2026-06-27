import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import DashboardView from '@/features/dashboard/views/DashboardView.vue';
import { setupTestContext } from '@/tests/test-utils';

describe('dashboard view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders core dashboard metrics', async () => {
    const { pinia, vueQueryPlugin, stubs } = setupTestContext();

    const wrapper = mount(DashboardView, {
      global: {
        plugins: [pinia, vueQueryPlugin],
        stubs,
      },
    });

    await vi.runAllTimersAsync();
    await flushPromises();

    expect(wrapper.text()).toContain('Kullanilabilir limit');
    expect(wrapper.text()).toContain('Itibar puani');
    expect(wrapper.text()).toContain('Son hareketler');
  });
});
