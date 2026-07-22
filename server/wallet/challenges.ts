import { randomBytes, randomUUID } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import { fundingChallengeMessage } from '../../shared/contracts';
import { ids } from '../../shared/ids';
import { WalletAuthorizationError } from './errors';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export type WalletChallengeRecord = {
  challengeId: string;
  walletAddress: string;
  campaignId: string;
  nonce: string;
  message: string;
  expiresAt: string;
  consumed: boolean;
};

export class FundingChallengeStore {
  private readonly challenges = new Map<string, WalletChallengeRecord>();

  issue(walletAddressInput: string, now = new Date()): {
    challengeId: string;
    expiresAt: string;
    message: string;
  } {
    const walletAddress = normalizeWalletAddress(walletAddressInput);
    const challengeId = randomUUID();
    const nonce = randomBytes(16).toString('hex');
    const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS).toISOString();
    const message = fundingChallengeMessage({
      walletAddress,
      nonce,
      expiresAt,
    });

    this.challenges.set(challengeId, {
      challengeId,
      walletAddress,
      campaignId: ids.campaign,
      nonce,
      message,
      expiresAt,
      consumed: false,
    });
    this.removeExpired(now);
    return { challengeId, expiresAt, message };
  }

  consume(
    challengeId: string,
    walletAddressInput: string,
    campaignId: string = ids.campaign,
    now = new Date(),
  ): WalletChallengeRecord {
    const record = this.challenges.get(challengeId);
    if (!record) {
      throw new WalletAuthorizationError({
        code: 'CHALLENGE_NOT_FOUND',
        message: 'Funding challenge does not exist or was already consumed',
        retryable: true,
      });
    }

    const walletAddress = normalizeWalletAddress(walletAddressInput);
    if (record.walletAddress !== walletAddress) {
      throw new WalletAuthorizationError({
        code: 'CHALLENGE_WALLET_MISMATCH',
        message: 'Funding challenge belongs to another wallet',
        retryable: false,
      });
    }
    if (record.campaignId !== campaignId) {
      throw new WalletAuthorizationError({
        code: 'CHALLENGE_CAMPAIGN_MISMATCH',
        message: 'Funding challenge belongs to another campaign',
        retryable: false,
      });
    }

    this.challenges.delete(challengeId);
    if (Date.parse(record.expiresAt) <= now.getTime()) {
      throw new WalletAuthorizationError({
        code: 'CHALLENGE_EXPIRED',
        message: 'Funding challenge has expired',
        retryable: true,
      });
    }

    return { ...record, consumed: true };
  }

  peek(challengeId: string): WalletChallengeRecord | undefined {
    return this.challenges.get(challengeId);
  }

  clear(): void {
    this.challenges.clear();
  }

  private removeExpired(now: Date): void {
    for (const [id, challenge] of this.challenges) {
      if (Date.parse(challenge.expiresAt) <= now.getTime()) {
        this.challenges.delete(id);
      }
    }
  }
}

export const fundingChallengeStore = new FundingChallengeStore();

export function clearChallenges(): void {
  fundingChallengeStore.clear();
}

export function issueFundingChallenge(walletAddress: string) {
  return fundingChallengeStore.issue(walletAddress);
}

export function peekChallenge(challengeId: string) {
  return fundingChallengeStore.peek(challengeId);
}

export function consumeChallenge(options: {
  challengeId: string;
  walletAddress: string;
  campaignId: string;
}): WalletChallengeRecord {
  return fundingChallengeStore.consume(
    options.challengeId,
    options.walletAddress,
    options.campaignId,
  );
}

function normalizeWalletAddress(value: string): string {
  try {
    return new PublicKey(value).toBase58();
  } catch (cause) {
    throw new WalletAuthorizationError({
      code: 'WALLET_ADDRESS_INVALID',
      message: 'Wallet address is not a valid Solana public key',
      retryable: false,
      cause,
    });
  }
}
