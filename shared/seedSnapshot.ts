import type { DemoState } from './types';
import { ids } from './ids';
import { CAMORA_PAYOUT_SOL, CAMPAIGN_BUDGET_SOL, TSRE_PAYOUT_SOL } from './contracts';

/** Canonical seeded demo state. Backend restart or reset restores this. */
export function createEmptyDemoState(revision = 0): DemoState {
  return {
    revision,
    businesses: [
      {
        id: ids.magnolia,
        name: 'Magnolia Film Lab',
        capabilities: ['advertiser', 'host'],
        address: '8 Egnate Ninoshvili Street, Tbilisi',
      },
      {
        id: ids.camora,
        name: 'Camora',
        capabilities: ['advertiser', 'host'],
        address: '8 Egnate Ninoshvili Street, Tbilisi',
      },
      {
        id: ids.tsreGym,
        name: 'TSRE Gym',
        capabilities: ['host'],
      },
    ],
    customers: [
      {
        id: ids.nino,
        displayName: 'Nino',
      },
    ],
    campaigns: [
      {
        id: ids.campaign,
        name: 'Develop the Night',
        advertiserBusinessId: ids.magnolia,
        status: 'draft',
        budget: {
          totalSol: CAMPAIGN_BUDGET_SOL,
          remainingSol: CAMPAIGN_BUDGET_SOL,
          reservedSol: 0,
          paidSol: 0,
          label: 'Simulated budget',
        },
      },
    ],
    deals: [
      {
        id: ids.camoraDeal,
        campaignId: ids.campaign,
        hostBusinessId: ids.camora,
        status: 'proposed',
        requirement: '3 verified visits at Camora',
        reward:
          '10 ₾ off film development and scanning on orders over 40 ₾',
        payoutSol: CAMORA_PAYOUT_SOL,
        maxRedemptions: 10,
      },
      {
        id: ids.tsreDeal,
        campaignId: ids.campaign,
        hostBusinessId: ids.tsreGym,
        status: 'proposed',
        requirement: '2 verified visits at TSRE Gym',
        reward: 'Mock partner offer — demo only',
        payoutSol: TSRE_PAYOUT_SOL,
        maxRedemptions: 5,
        mocked: true,
      },
    ],
    visits: [
      {
        id: 'visit-nino-1',
        dealId: ids.camoraDeal,
        customerId: ids.nino,
        hostBusinessId: ids.camora,
        verifiedAt: new Date(0).toISOString(),
        sequence: 1,
      },
    ],
    claims: [
      {
        id: ids.claim,
        customerId: ids.nino,
        dealId: ids.camoraDeal,
        campaignId: ids.campaign,
        status: 'locked',
        verifiedVisits: 1,
        requiredVisits: 3,
      },
    ],
    payouts: [
      {
        claimId: ids.claim,
        dealId: ids.camoraDeal,
        hostBusinessId: ids.camora,
        status: 'not_ready',
        amountSol: CAMORA_PAYOUT_SOL,
      },
    ],
    transactions: [],
  };
}
