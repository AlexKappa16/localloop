/**
 * Wallet helpers — LL-105 implements connect + signMessage only.
 * Do not add sendTransaction / signTransaction here.
 */
export const WALLET_SIGN_MESSAGE_ONLY = true as const;

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}
