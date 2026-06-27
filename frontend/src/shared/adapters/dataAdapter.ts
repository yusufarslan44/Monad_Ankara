import { mockCampusApi } from '@/shared/mocks/mockCampusState';

export const dataAdapter = {
  getSessionSnapshot: () => mockCampusApi.getSessionSnapshot(),
  submitCampusEmail: (name: string, university: string, email: string) =>
    mockCampusApi.submitCampusEmail(name, university, email),
  getDashboardSnapshot: () => mockCampusApi.getDashboardSnapshot(),
  getGuaranteeSnapshot: () => mockCampusApi.getGuaranteeSnapshot(),
  getHistorySnapshot: () => mockCampusApi.getHistorySnapshot(),
  getLoanQuote: (amountMON: number) => mockCampusApi.getLoanQuote(amountMON),
  submitLoanRequest: (amountMON: number, purpose: string) =>
    mockCampusApi.submitLoanRequest(amountMON, purpose),
  submitRepayment: (amountMON: number) => mockCampusApi.submitRepayment(amountMON),
  approveGuaranteeRequest: (requestId: string) => mockCampusApi.approveGuaranteeRequest(requestId),
  reset: () => mockCampusApi.reset(),
};
