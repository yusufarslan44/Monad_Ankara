import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PoolView from '@/features/pool/views/PoolView.vue';
import { setupTestContext } from '@/tests/test-utils';

describe('pool view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders pool metrics and deposit form', async () => {
    const { pinia, vueQueryPlugin, stubs } = setupTestContext();

    const wrapper = mount(PoolView, {
      global: {
        plugins: [pinia, vueQueryPlugin],
        stubs,
      },
    });

    await vi.runAllTimersAsync();
    await flushPromises();

    expect(wrapper.text()).toContain('Toplam havuz');
    expect(wrapper.text()).toContain('Yillik getiri');
    expect(wrapper.text()).toContain('Havza yatir');
  });
});
