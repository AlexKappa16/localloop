import type {
  ApiErrorBody,
  AuthorizeFundingRequest,
  HealthResponse,
  MutationResponse,
  WalletChallengeRequest,
  WalletChallengeResponse,
} from '../../shared/contracts';
import type { ChainTransaction, DemoState } from '../../shared/types';

export class ApiClientError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(body: ApiErrorBody['error']) {
    super(body.messageKa);
    this.name = 'ApiClientError';
    this.code = body.code;
    this.retryable = body.retryable;
    this.details = body.details;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiErrorBody;
  if (!response.ok) {
    const err = data as ApiErrorBody;
    if (err.error) {
      throw new ApiClientError(err.error);
    }
    throw new Error('Request failed');
  }
  return data as T;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  return parseJson(res);
}

export async function fetchState(): Promise<DemoState> {
  const res = await fetch('/api/state');
  return parseJson(res);
}

export async function resetDemo(): Promise<MutationResponse<{ reset: true }>> {
  const res = await fetch('/api/demo/reset', { method: 'POST' });
  return parseJson(res);
}

export async function requestWalletChallenge(
  body: WalletChallengeRequest,
): Promise<WalletChallengeResponse> {
  const res = await fetch('/api/wallet/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function authorizeCampaignFunding(
  campaignId: string,
  body: AuthorizeFundingRequest,
): Promise<
  MutationResponse<{ transaction?: ChainTransaction; alreadyFunded?: true }>
> {
  const res = await fetch(`/api/campaigns/${campaignId}/authorize-funding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function approveDeal(
  dealId: string,
): Promise<MutationResponse<{ dealId: string }>> {
  const res = await fetch(`/api/deals/${dealId}/approve`, { method: 'POST' });
  return parseJson(res);
}

export async function verifyDealVisit(
  dealId: string,
  customerId: string,
): Promise<MutationResponse<{ customerId: string }>> {
  const res = await fetch(`/api/deals/${dealId}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  });
  return parseJson(res);
}

export async function requestClaimRedemption(
  claimId: string,
): Promise<MutationResponse<{ claimId: string }>> {
  const res = await fetch(`/api/claims/${claimId}/request-redemption`, {
    method: 'POST',
  });
  return parseJson(res);
}

export async function validateClaim(
  claimId: string,
): Promise<
  MutationResponse<{ reused?: boolean; transaction?: ChainTransaction }>
> {
  const res = await fetch(`/api/claims/${claimId}/validate`, {
    method: 'POST',
  });
  return parseJson(res);
}
