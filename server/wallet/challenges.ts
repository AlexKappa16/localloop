import { createHash, randomBytes } from 'node:crypto';
import { fundingChallengeMessage } from '../../shared/contracts';
import { ids } from '../../shared/ids';

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

const challenges = new Map<string, WalletChallengeRecord>();

function newId(): string {
  return randomBytes(16).toString('hex');
}

function newNonce(): string {
  return createHash('sha256').update(randomBytes(32)).digest('hex').slice(0, 32);
}

export function clearChallenges(): void {
  challenges.clear();
}

export function issueFundingChallenge(walletAddress: string): {
  challengeId: string;
  expiresAt: string;
  message: string;
} {
  const trimmed = walletAddress.trim();
  if (!trimmed) {
    throw new Error('walletAddress is required');
  }

  const challengeId = newId();
  const nonce = newNonce();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
  const message = fundingChallengeMessage({
    walletAddress: trimmed,
    nonce,
    expiresAt,
  });

  const record: WalletChallengeRecord = {
    challengeId,
    walletAddress: trimmed,
    campaignId: ids.campaign,
    nonce,
    message,
    expiresAt,
    consumed: false,
  };
  challenges.set(challengeId, record);

  return {
    challengeId,
    expiresAt,
    message,
  };
}

export function peekChallenge(
  challengeId: string,
): WalletChallengeRecord | undefined {
  return challenges.get(challengeId);
}

/**
 * Atomically consume a challenge after successful signature verification.
 * Rejects missing, expired, wrong-wallet, wrong-campaign, and replayed challenges.
 */
export function consumeChallenge(options: {
  challengeId: string;
  walletAddress: string;
  campaignId: string;
}): WalletChallengeRecord {
  const record = challenges.get(options.challengeId);
  if (!record) {
    throw Object.assign(new Error('Challenge not found'), {
      code: 'CHALLENGE_NOT_FOUND',
    });
  }
  if (record.consumed) {
    throw Object.assign(new Error('Challenge already used'), {
      code: 'CHALLENGE_REPLAY',
    });
  }
  if (Date.parse(record.expiresAt) <= Date.now()) {
    throw Object.assign(new Error('Challenge expired'), {
      code: 'CHALLENGE_EXPIRED',
    });
  }
  if (record.walletAddress !== options.walletAddress.trim()) {
    throw Object.assign(new Error('Challenge wallet mismatch'), {
      code: 'CHALLENGE_WALLET_MISMATCH',
    });
  }
  if (record.campaignId !== options.campaignId) {
    throw Object.assign(new Error('Challenge campaign mismatch'), {
      code: 'CHALLENGE_CAMPAIGN_MISMATCH',
    });
  }

  record.consumed = true;
  challenges.set(record.challengeId, record);
  return record;
}
