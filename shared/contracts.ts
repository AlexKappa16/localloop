import type { DemoState } from './types';

export type MutationResponse<T = unknown> = {
  revision: number;
  data: T;
  state: DemoState;
};

export type ApiErrorBody = {
  error: {
    code: string;
    messageKa: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
};

export type HealthResponse = {
  ok: true;
  status: 'ok';
  cluster: string;
  treasuryPublicKey: string | null;
  hostPublicKey: string | null;
  treasuryBalanceSol: number | null;
  solanaReady: boolean;
  revision: number;
};

export type WalletChallengeRequest = {
  walletAddress: string;
};

export type WalletChallengeResponse = {
  challengeId: string;
  expiresAt: string;
  message: string;
};

export type AuthorizeFundingRequest = {
  challengeId: string;
  walletAddress: string;
  signatureBase58: string;
};

export type ApproveDealRequest = Record<string, never>;

export type VerifyVisitRequest = {
  customerId: string;
};

export type RequestRedemptionRequest = Record<string, never>;

export type ValidateClaimRequest = Record<string, never>;

export type RevisionEventPayload = {
  revision: number;
};

export const FUNDING_PROOF_MEMO =
  'LocalLoop|proof|simulate-funding|campaign:magnolia-develop-the-night' as const;

export const CAMPAIGN_BUDGET_SOL = 0.05;
export const CAMORA_PAYOUT_SOL = 0.005;
export const TSRE_PAYOUT_SOL = 0.007;
export const REQUIRED_VISITS = 3;

export function payoutMemo(claimId: string): string {
  return `LocalLoop|payout|campaign:magnolia-develop-the-night|deal:camora-deal|claim:${claimId}`;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function fundingChallengeMessage(options: {
  walletAddress: string;
  nonce: string;
  expiresAt: string;
}): string {
  return [
    'LocalLoop demo authorization',
    'Action: Simulate campaign funding',
    'Campaign: magnolia-develop-the-night',
    'Budget: 0.05 SOL (simulated; no transfer)',
    `Wallet: ${options.walletAddress}`,
    `Nonce: ${options.nonce}`,
    `Expires: ${options.expiresAt}`,
    'This signature does not authorize a blockchain transaction.',
  ].join('\n');
}
