import {
  CAMORA_PAYOUT_SOL,
  CAMPAIGN_BUDGET_SOL,
} from '../../shared/contracts';
import { ids } from '../../shared/ids';
import type {
  ChainTransaction,
  DemoState,
} from '../../shared/types';
import { AppError } from '../api/errors';
import { mutateState, getSnapshot } from './store';

function recalculateBudget(state: DemoState): void {
  const campaign = state.campaigns.find((c) => c.id === ids.campaign);
  if (!campaign) return;

  const paidSol = state.payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amountSol, 0);

  const remainingSol = Math.max(
    0,
    Number((CAMPAIGN_BUDGET_SOL - paidSol).toFixed(6)),
  );

  const activeCapacity = state.deals
    .filter((d) => d.status === 'active' && !d.mocked)
    .reduce((sum, d) => sum + d.payoutSol * d.maxRedemptions, 0);

  const reservedSol = Math.min(remainingSol, activeCapacity);

  campaign.budget = {
    ...campaign.budget,
    totalSol: CAMPAIGN_BUDGET_SOL,
    paidSol: Number(paidSol.toFixed(6)),
    remainingSol,
    reservedSol: Number(reservedSol.toFixed(6)),
    label: 'Simulated budget',
  };
}

export function applyFundingProofConfirmed(
  proof: ChainTransaction,
): DemoState {
  if (proof.type !== 'funding_proof' || proof.status !== 'confirmed') {
    throw new AppError({
      code: 'INVALID_FUNDING_PROOF',
      message: 'Funding proof must be a confirmed funding_proof transaction.',
      status: 400,
    });
  }

  return mutateState((draft) => {
    const campaign = draft.campaigns.find((c) => c.id === ids.campaign);
    if (!campaign) {
      throw new AppError({
        code: 'CAMPAIGN_NOT_FOUND',
        message: 'Campaign not found.',
        status: 404,
      });
    }
    if (campaign.status !== 'draft') {
      // Idempotent: already funded — keep existing proof if present
      const existing = draft.transactions.find((t) => t.type === 'funding_proof');
      if (existing) return;
    }
    campaign.status = 'simulated_funded';
    const withoutOld = draft.transactions.filter((t) => t.type !== 'funding_proof');
    draft.transactions = [...withoutOld, proof];
    recalculateBudget(draft);
  });
}

export function approveDeal(dealId: string): DemoState {
  return mutateState((draft) => {
    const deal = draft.deals.find((d) => d.id === dealId);
    if (!deal) {
      throw new AppError({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        status: 404,
      });
    }
    if (deal.mocked) {
      throw new AppError({
        code: 'DEAL_MOCKED',
        message: 'This mocked deal cannot be approved in the live demo path.',
        status: 400,
      });
    }
    if (deal.status === 'active') {
      return;
    }
    if (deal.status !== 'proposed') {
      throw new AppError({
        code: 'DEAL_INVALID_STATUS',
        message: 'Only a proposed deal can be approved.',
        status: 409,
      });
    }

    const campaign = draft.campaigns.find((c) => c.id === deal.campaignId);
    if (!campaign) {
      throw new AppError({
        code: 'CAMPAIGN_NOT_FOUND',
        message: 'Campaign not found.',
        status: 404,
      });
    }
    if (
      campaign.status !== 'simulated_funded' &&
      campaign.status !== 'live'
    ) {
      throw new AppError({
        code: 'CAMPAIGN_NOT_FUNDED',
        message:
          'Approve the deal only after the campaign is simulated-funded.',
        status: 409,
        retryable: false,
      });
    }

    deal.status = 'active';
    campaign.status = 'live';
    recalculateBudget(draft);
  });
}

export function verifyVisit(dealId: string, customerId: string): DemoState {
  return mutateState((draft) => {
    const deal = draft.deals.find((d) => d.id === dealId);
    if (!deal) {
      throw new AppError({
        code: 'DEAL_NOT_FOUND',
        message: 'Deal not found.',
        status: 404,
      });
    }
    if (deal.status !== 'active') {
      throw new AppError({
        code: 'DEAL_NOT_ACTIVE',
        message: 'Visits can only be verified on an active deal.',
        status: 409,
      });
    }

    const claim = draft.claims.find(
      (c) => c.dealId === dealId && c.customerId === customerId,
    );
    if (!claim) {
      throw new AppError({
        code: 'CLAIM_NOT_FOUND',
        message: 'Claim not found for this customer and deal.',
        status: 404,
      });
    }

    if (claim.verifiedVisits >= claim.requiredVisits) {
      throw new AppError({
        code: 'VISIT_LIMIT_REACHED',
        message: 'All required visits are already verified.',
        status: 409,
      });
    }

    const nextSequence = claim.verifiedVisits + 1;
    draft.visits.push({
      id: `visit-${customerId}-${nextSequence}`,
      dealId,
      customerId,
      hostBusinessId: deal.hostBusinessId,
      verifiedAt: new Date().toISOString(),
      sequence: nextSequence,
    });
    claim.verifiedVisits = nextSequence;

    if (
      claim.verifiedVisits >= claim.requiredVisits &&
      claim.status === 'locked'
    ) {
      claim.status = 'unlocked';
    }
  });
}

export function requestRedemption(claimId: string): DemoState {
  return mutateState((draft) => {
    const claim = draft.claims.find((c) => c.id === claimId);
    if (!claim) {
      throw new AppError({
        code: 'CLAIM_NOT_FOUND',
        message: 'Claim not found.',
        status: 404,
      });
    }
    if (claim.status === 'redemption_requested' || claim.status === 'redeemed') {
      return;
    }
    if (claim.status === 'declined') {
      throw new AppError({
        code: 'CLAIM_DECLINED',
        message: 'This reward was declined and cannot be redeemed.',
        status: 409,
      });
    }
    if (claim.status !== 'unlocked') {
      throw new AppError({
        code: 'CLAIM_NOT_UNLOCKED',
        message: 'Redemption can only be requested for an unlocked claim.',
        status: 409,
      });
    }

    claim.status = 'redemption_requested';
    const payout = draft.payouts.find((p) => p.claimId === claimId);
    if (payout && payout.status === 'not_ready') {
      payout.status = 'pending';
    }
  });
}

export function declineRedemption(claimId: string): DemoState {
  return mutateState((draft) => {
    const claim = draft.claims.find((c) => c.id === claimId);
    if (!claim) {
      throw new AppError({
        code: 'CLAIM_NOT_FOUND',
        message: 'Claim not found.',
        status: 404,
      });
    }
    if (claim.status === 'declined') {
      return;
    }
    if (claim.status !== 'unlocked') {
      throw new AppError({
        code: 'CLAIM_NOT_UNLOCKED',
        message: 'Only an unlocked reward can be declined.',
        status: 409,
      });
    }
    claim.status = 'declined';
    // Payout stays not_ready — no Solana activity
  });
}

/**
 * Mark claim redeemed and payout processing before the Solana send.
 * Idempotent if already paid — returns current state without re-processing.
 */
export function beginValidation(claimId: string): {
  state: DemoState;
  alreadyPaid: boolean;
  existingTx?: ChainTransaction;
} {
  const current = getSnapshot();
  const claim = current.claims.find((c) => c.id === claimId);
  if (!claim) {
    throw new AppError({
      code: 'CLAIM_NOT_FOUND',
      message: 'Claim not found.',
      status: 404,
    });
  }

  const payout = current.payouts.find((p) => p.claimId === claimId);
  if (!payout) {
    throw new AppError({
      code: 'PAYOUT_NOT_FOUND',
      message: 'Payout record not found.',
      status: 404,
    });
  }

  if (payout.status === 'paid') {
    const existingTx = current.transactions.find(
      (t) => t.type === 'host_payout' && t.claimId === claimId,
    );
    return { state: current, alreadyPaid: true, existingTx };
  }

  if (claim.status === 'declined') {
    throw new AppError({
      code: 'CLAIM_DECLINED',
      message: 'Declined rewards cannot be validated.',
      status: 409,
    });
  }

  if (claim.status !== 'redemption_requested' && claim.status !== 'redeemed') {
    throw new AppError({
      code: 'CLAIM_NOT_REQUESTED',
      message: 'Validate only after the customer requests redemption.',
      status: 409,
    });
  }

  const state = mutateState((draft) => {
    const c = draft.claims.find((item) => item.id === claimId)!;
    const p = draft.payouts.find((item) => item.claimId === claimId)!;
    c.status = 'redeemed';
    p.status = 'processing';
  });

  return { state, alreadyPaid: false };
}

export function completeHostPayout(
  claimId: string,
  tx: ChainTransaction,
): DemoState {
  return mutateState((draft) => {
    const claim = draft.claims.find((c) => c.id === claimId);
    const payout = draft.payouts.find((p) => p.claimId === claimId);
    if (!claim || !payout) {
      throw new AppError({
        code: 'CLAIM_NOT_FOUND',
        message: 'Claim or payout not found.',
        status: 404,
      });
    }

    claim.status = 'redeemed';
    payout.status = 'paid';
    payout.transactionId = tx.id;
    payout.amountSol = CAMORA_PAYOUT_SOL;

    const withoutOld = draft.transactions.filter(
      (t) => !(t.type === 'host_payout' && t.claimId === claimId),
    );
    draft.transactions = [...withoutOld, tx];
    recalculateBudget(draft);
  });
}

export function failHostPayout(claimId: string): DemoState {
  return mutateState((draft) => {
    const payout = draft.payouts.find((p) => p.claimId === claimId);
    const claim = draft.claims.find((c) => c.id === claimId);
    if (!payout || !claim) {
      throw new AppError({
        code: 'PAYOUT_NOT_FOUND',
        message: 'Payout not found.',
        status: 404,
      });
    }
    // Keep claim redeemed; payout becomes retryable failed
    claim.status = 'redeemed';
    payout.status = 'failed';
  });
}
