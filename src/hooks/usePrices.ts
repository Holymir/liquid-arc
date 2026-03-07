// TODO: Implement in Task 5 — price feed hook

export function usePrices(_tokenAddresses: string[], _chainId = "base") {
  return { prices: new Map<string, number>(), isLoading: false };
}
