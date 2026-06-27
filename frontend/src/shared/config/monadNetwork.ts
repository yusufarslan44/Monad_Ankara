const asCleanString = (value: unknown, fallback: string): string => {
  if (value === undefined || value === null) {
    return fallback;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const asCleanNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(asCleanString(value, String(fallback)));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const chainIdDecimal = asCleanNumber(import.meta.env.VITE_MONAD_CHAIN_ID, 10143);

export const monadNetwork = {
  chainIdDecimal,
  chainIdHex: `0x${chainIdDecimal.toString(16)}`,
  chainName: asCleanString(import.meta.env.VITE_MONAD_CHAIN_NAME, 'Monad Testnet'),
  rpcUrl: asCleanString(import.meta.env.VITE_MONAD_RPC_URL, 'https://testnet-rpc.monad.xyz'),
  nativeCurrency: {
    name: asCleanString(import.meta.env.VITE_MONAD_CURRENCY_NAME, 'Monad'),
    symbol: asCleanString(import.meta.env.VITE_MONAD_CURRENCY_SYMBOL, 'MON'),
    decimals: asCleanNumber(import.meta.env.VITE_MONAD_CURRENCY_DECIMALS, 18),
  },
  blockExplorerUrl: asCleanString(import.meta.env.VITE_MONAD_BLOCK_EXPLORER_URL, ''),
} as const;

export const getMonadAddChainParams = () => ({
  chainId: monadNetwork.chainIdHex,
  chainName: monadNetwork.chainName,
  nativeCurrency: monadNetwork.nativeCurrency,
  rpcUrls: [monadNetwork.rpcUrl],
  ...(monadNetwork.blockExplorerUrl
    ? {
        blockExplorerUrls: [monadNetwork.blockExplorerUrl],
      }
    : {}),
});
