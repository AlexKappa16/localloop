import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

/**
 * Verify an Ed25519 signature over the exact UTF-8 challenge message bytes.
 * Never logs the full signature payload.
 */
export function verifyWalletMessageSignature(options: {
  walletAddress: string;
  message: string;
  signatureBase58: string;
}): boolean {
  const { walletAddress, message, signatureBase58 } = options;

  let publicKeyBytes: Uint8Array;
  try {
    publicKeyBytes = new PublicKey(walletAddress).toBytes();
  } catch {
    return false;
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = bs58.decode(signatureBase58);
  } catch {
    return false;
  }

  if (signatureBytes.length !== 64) {
    return false;
  }

  const messageBytes = new TextEncoder().encode(message);
  return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
}
