import type { DemoState } from './types';
import { ids } from './ids';

/** Minimal seed snapshot for LL-101 scaffolding. LL-102 owns full domain seed. */
export function createEmptyDemoState(revision = 0): DemoState {
  return {
    revision,
    businesses: [
      {
        id: ids.magnolia,
        name: 'Magnolia Film Lab',
        capabilities: ['advertiser', 'host'],
        addressKa: 'ეგნატე ნინოშვილის 8, თბილისი',
      },
      {
        id: ids.camora,
        name: 'Camora',
        capabilities: ['advertiser', 'host'],
        addressKa: 'ეგნატე ნინოშვილის 8, თბილისი',
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
        displayName: 'ნინო',
      },
    ],
    campaigns: [
      {
        id: ids.campaign,
        nameKa: '„გაამჟღავნე ღამე“',
        advertiserBusinessId: ids.magnolia,
        status: 'draft',
        budget: {
          totalSol: 0.05,
          remainingSol: 0.05,
          reservedSol: 0,
          paidSol: 0,
          labelKa: 'სიმულირებული ბიუჯეტი',
        },
      },
    ],
    deals: [
      {
        id: ids.camoraDeal,
        campaignId: ids.campaign,
        hostBusinessId: ids.camora,
        status: 'proposed',
        requirementKa: 'Camora-ში 3 დადასტურებული ვიზიტი',
        rewardKa:
          '10 ₾ ფასდაკლება 40 ₾-ზე მეტი ღირებულების ფირის გამჟღავნებასა და სკანირებაზე',
        payoutSol: 0.005,
        maxRedemptions: 10,
      },
      {
        id: ids.tsreDeal,
        campaignId: ids.campaign,
        hostBusinessId: ids.tsreGym,
        status: 'proposed',
        requirementKa: 'TSRE Gym-ში 2 დადასტურებული ვიზიტი',
        rewardKa: 'მოკი პარტნიორული შეთავაზება',
        payoutSol: 0.007,
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
        amountSol: 0.005,
      },
    ],
    transactions: [],
  };
}
