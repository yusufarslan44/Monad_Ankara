import { mockCampusApi } from '@/shared/mocks/mockCampusState';

export const walletAdapter = {
  connect: () => mockCampusApi.connectWallet(),
  disconnect: () => mockCampusApi.disconnectWallet(),
};
