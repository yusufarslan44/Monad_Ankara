import { z } from 'zod';

export const onboardingFormSchema = z.object({
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmali.'),
  university: z.string().min(3, 'Universite bilgisi gerekli.'),
  email: z.string().email('Gecerli bir e-posta gir.').refine((value) => value.endsWith('.edu.tr'), {
    message: 'Kampus e-postasi .edu.tr ile bitmeli.',
  }),
});

export const loanFormSchema = z.object({
  amountMON: z.coerce.number().min(0.5, 'En az 0.5 MON sec.').max(12, 'Tek seferde cok yuksek tutar secildi.'),
  purpose: z.string().min(5, 'Kisa bir kullanim amaci gir.'),
});

export const repaymentFormSchema = z.object({
  amountMON: z.coerce.number().min(0.3, 'En az 0.3 MON odeme yap.'),
});
