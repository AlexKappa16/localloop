/**
 * Wallet helpers — connect + signMessage only.
 * Never import or call sendTransaction / signTransaction / signAllTransactions.
 */
import bs58 from 'bs58';

export const WALLET_SIGN_MESSAGE_ONLY = true as const;

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array>;

/**
 * Sign exact UTF-8 challenge bytes and return a base58 signature.
 * Callers must pass wallet.signMessage only — never a transaction signer.
 */
export async function signChallengeMessage(
  signMessage: SignMessageFn,
  message: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(message);
  const signature = await signMessage(bytes);
  return bs58.encode(signature);
}

export function walletSupportsSignMessage(
  wallet: { signMessage?: unknown } | null | undefined,
): wallet is { signMessage: SignMessageFn } {
  return typeof wallet?.signMessage === 'function';
}
