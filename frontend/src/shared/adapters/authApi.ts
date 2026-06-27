import { apiClient } from '@/shared/lib/apiClient';

export type RequestCodeResponse = {
  success: true;
  message: string;
};

export type VerifyCodeResponse = {
  success: true;
  registered: boolean;
  txHash: string | null;
  referral: { inviterAddress: string } | null;
};

export type GenerateReferralResponse = {
  success: true;
  code: string;
};

export type ResolveReferralResponse = {
  success: true;
  inviterAddress: string;
};

export const authApi = {
  requestCode(address: string, email: string, referralCode?: string) {
    return apiClient.post<RequestCodeResponse>('/auth/request-code', {
      address,
      email,
      referralCode: referralCode || undefined,
    });
  },

  verifyCode(address: string, email: string, code: string) {
    return apiClient.post<VerifyCodeResponse>('/auth/verify-code', {
      address,
      email,
      code,
    });
  },

  generateReferral(address: string) {
    return apiClient.get<GenerateReferralResponse>('/referral/generate', { address });
  },

  resolveReferral(code: string) {
    return apiClient.get<ResolveReferralResponse>('/referral/resolve', { code });
  },
};
