import { z } from 'zod';

export const onboardingFormSchema = z.object({
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmali.'),
  university: z.string().min(3, 'Universite bilgisi gerekli.'),
  email: z.string().email('Gecerli bir e-posta gir.').refine((value) => value.endsWith('.edu.tr'), {
    message: 'Kampus e-postasi .edu.tr ile bitmeli.',
  }),
  referralCode: z.string().optional(),
});

export const verificationCodeSchema = z.object({
  code: z.string().min(6, '6 haneli kodu gir.').max(6, '6 haneli kodu gir.'),
});

export const poolDepositSchema = z.object({
  amountMON: z.coerce.number().min(0.1, 'En az 0.1 MON yatirabilirsin.').max(50, 'Tek seferde en fazla 50 MON.'),
  lockDays: z.coerce.number().min(1, 'Kilitleme suresi sec.').max(365, 'En fazla 365 gun.'),
});

export const createPoolDepositSchema = (maxBalanceMON: number) =>
  z.object({
    amountMON: z.coerce
      .number()
      .min(0.1, 'En az 0.1 MON yatirabilirsin.')
      .max(maxBalanceMON, `Cuzdanda yeterli MON yok (maks ${maxBalanceMON.toFixed(2)} MON).`),
    lockDays: z.coerce.number().min(1, 'Kilitleme suresi sec.').max(365, 'En fazla 365 gun.'),
  });

export const loanFormSchema = z.object({
  amountMON: z.coerce.number().min(0.5, 'En az 0.5 MON sec.').max(12, 'Tek seferde cok yuksek tutar secildi.'),
  purpose: z.string().min(5, 'Kisa bir kullanim amaci gir.'),
});

export const repaymentFormSchema = z.object({
  amountMON: z.coerce.number().min(0.3, 'En az 0.3 MON odeme yap.'),
});
