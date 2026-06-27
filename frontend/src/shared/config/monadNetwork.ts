const chainIdDecimal = Number(import.meta.env.VITE_MONAD_CHAIN_ID || 10143);

export const monadNetwork = {
  chainIdDecimal,
  chainIdHex: `0x${chainIdDecimal.toString(16)}`,
  chainName: import.meta.env.VITE_MONAD_CHAIN_NAME || 'Monad Testnet',
  rpcUrl: import.meta.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
  nativeCurrency: {
    name: import.meta.env.VITE_MONAD_CURRENCY_NAME || 'Monad',
    symbol: import.meta.env.VITE_MONAD_CURRENCY_SYMBOL || 'MON',
    decimals: Number(import.meta.env.VITE_MONAD_CURRENCY_DECIMALS || 18),
  },
  blockExplorerUrl: import.meta.env.VITE_MONAD_BLOCK_EXPLORER_URL || '',
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
