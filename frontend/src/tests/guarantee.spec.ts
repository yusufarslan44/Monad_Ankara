import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import GuaranteeView from '@/features/guarantee/views/GuaranteeView.vue';
import { setupTestContext } from '@/tests/test-utils';

describe('guarantee view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders the medium-risk guarantee badge', async () => {
    const { pinia, vueQueryPlugin, stubs } = setupTestContext();
    const wrapper = mount(GuaranteeView, {
      global: {
        plugins: [pinia, vueQueryPlugin],
        stubs,
      },
    });

    await vi.runAllTimersAsync();
    await flushPromises();

    expect(wrapper.text()).toContain('Izlenmeli');
    expect(wrapper.text()).toContain('Gelen talepler');
  });
});
