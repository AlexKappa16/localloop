import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { ids } from '../../shared/ids';
import type { FundingChallengeStore } from './challenges';
import { WalletAuthorizationError } from './errors';

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

export interface FundingAuthorizationInput {
  challengeId: string;
  walletAddress: string;
  signatureBase58: string;
}

export function verifyAndConsumeFundingAuthorization(
  store: FundingChallengeStore,
  input: FundingAuthorizationInput,
  now = new Date(),
): { campaignId: typeof ids.campaign; walletAddress: string } {
  const challenge = store.consume(
    input.challengeId,
    input.walletAddress,
    ids.campaign,
    now,
  );

  if (
    !verifyWalletMessageSignature({
      walletAddress: challenge.walletAddress,
      message: challenge.message,
      signatureBase58: input.signatureBase58,
    })
  ) {
    throw new WalletAuthorizationError({
      code: 'SIGNATURE_INVALID',
      message: 'Wallet signature is invalid',
      retryable: true,
    });
  }

  return {
    campaignId: ids.campaign,
    walletAddress: challenge.walletAddress,
  };
}
