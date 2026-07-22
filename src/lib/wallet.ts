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

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toBase58(): string } | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toBase58(): string };
  }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    display?: 'utf8' | 'hex',
  ) => Promise<{ signature: Uint8Array } | Uint8Array>;
  on?: (event: string, handler: () => void) => void;
  off?: (event: string, handler: () => void) => void;
};

function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;
  const provider =
    (
      window as Window & {
        phantom?: { solana?: PhantomProvider };
        solana?: PhantomProvider;
      }
    ).phantom?.solana ??
    (window as Window & { solana?: PhantomProvider }).solana ??
    null;
  if (provider?.isPhantom) return provider;
  return provider ?? null;
}

export function isPhantomAvailable(): boolean {
  return getPhantomProvider() != null;
}

/** Connect Phantom directly (Wallet Standard / injected provider). */
export async function connectPhantom(): Promise<string> {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error(
      'Phantom was not found. Install the Phantom extension and unlock it, then refresh.',
    );
  }
  const result = await provider.connect();
  const address = result.publicKey.toBase58();
  if (!address) throw new Error('Phantom connected but returned no public key.');
  return address;
}

export async function disconnectPhantom(): Promise<void> {
  const provider = getPhantomProvider();
  if (provider) await provider.disconnect();
}

export function getPhantomAddress(): string | null {
  const provider = getPhantomProvider();
  return provider?.publicKey?.toBase58() ?? null;
}

/**
 * Sign exact UTF-8 challenge bytes with Phantom and return a base58 signature.
 */
export async function signChallengeWithPhantom(message: string): Promise<string> {
  const provider = getPhantomProvider();
  if (!provider?.signMessage) {
    throw new Error(
      'This Phantom session cannot sign messages. Unlock Phantom and try again.',
    );
  }
  const bytes = new TextEncoder().encode(message);
  const result = await provider.signMessage(bytes, 'utf8');
  const signature =
    result instanceof Uint8Array ? result : result.signature;
  return bs58.encode(signature);
}

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
