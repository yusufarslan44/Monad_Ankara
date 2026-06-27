import { describe, expect, it } from 'vitest';
import { loanFormSchema } from '@/shared/lib/formSchemas';

describe('loan form validation', () => {
  it('rejects a too-short purpose field', () => {
    const result = loanFormSchema.safeParse({
      amountMON: 2,
      purpose: 'abc',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Kisa bir kullanim amaci gir.');
    }
  });
});
