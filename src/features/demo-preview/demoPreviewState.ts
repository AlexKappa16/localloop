import type {
  CampaignStatus,
  ClaimStatus,
  DealStatus,
  PayoutStatus,
} from '../../../shared/types';

export type PreviewPersona = 'advertiser' | 'host' | 'customer';

export type PreviewAction =
  | { type: 'switch_persona'; persona: PreviewPersona }
  | { type: 'connect_wallet' }
  | { type: 'authorize_funding' }
  | { type: 'approve_deal' }
  | { type: 'verify_visit' }
  | { type: 'request_redemption' }
  | { type: 'validate_redemption' }
  | { type: 'complete_payout' }
  | { type: 'reset' };

export interface PreviewReceipt {
  type: 'funding' | 'payout';
  reference: string;
  amountSol?: number;
  memo: string;
}

export interface PreviewHistoryItem {
  id: number;
  persona: PreviewPersona;
  labelKa: string;
}

export interface PreviewState {
  activePersona: PreviewPersona;
  walletConnected: boolean;
  campaignStatus: CampaignStatus;
  dealStatus: DealStatus;
  verifiedVisits: number;
  claimStatus: ClaimStatus;
  payoutStatus: PayoutStatus;
  fundingReceipt: PreviewReceipt | null;
  payoutReceipt: PreviewReceipt | null;
  history: PreviewHistoryItem[];
}

export const initialPreviewState: PreviewState = {
  activePersona: 'advertiser',
  walletConnected: false,
  campaignStatus: 'draft',
  dealStatus: 'proposed',
  verifiedVisits: 1,
  claimStatus: 'locked',
  payoutStatus: 'not_ready',
  fundingReceipt: null,
  payoutReceipt: null,
  history: [
    {
      id: 1,
      persona: 'customer',
      labelKa: 'ნინოს პირველი ვიზიტი უკვე დადასტურებულია — 1/3',
    },
  ],
};

function withHistory(
  state: PreviewState,
  persona: PreviewPersona,
  labelKa: string,
  updates: Partial<PreviewState>,
): PreviewState {
  return {
    ...state,
    ...updates,
    history: [
      ...state.history,
      { id: state.history.length + 1, persona, labelKa },
    ],
  };
}

export function previewReducer(
  state: PreviewState,
  action: PreviewAction,
): PreviewState {
  switch (action.type) {
    case 'switch_persona':
      return { ...state, activePersona: action.persona };
    case 'connect_wallet':
      if (state.walletConnected) return state;
      return withHistory(state, 'advertiser', 'მოკი საფულე დაკავშირებულია', {
        walletConnected: true,
      });
    case 'authorize_funding':
      if (!state.walletConnected || state.campaignStatus !== 'draft') return state;
      return withHistory(
        state,
        'advertiser',
        'სიმულირებული დაფინანსება ავტორიზებულია',
        {
          campaignStatus: 'simulated_funded',
          fundingReceipt: {
            type: 'funding',
            reference: 'PREVIEW-FUNDING-001',
            memo:
              'LocalLoop|proof|simulate-funding|campaign:magnolia-develop-the-night',
          },
        },
      );
    case 'approve_deal':
      if (
        state.campaignStatus !== 'simulated_funded' ||
        state.dealStatus !== 'proposed'
      ) {
        return state;
      }
      return withHistory(state, 'host', 'Camora-მ შეთავაზება დაამტკიცა', {
        campaignStatus: 'live',
        dealStatus: 'active',
      });
    case 'verify_visit': {
      if (state.dealStatus !== 'active' || state.verifiedVisits >= 3) return state;
      const verifiedVisits = state.verifiedVisits + 1;
      return withHistory(
        state,
        'host',
        `Camora-მ დაადასტურა ვიზიტი — ${verifiedVisits}/3`,
        {
          verifiedVisits,
          claimStatus: verifiedVisits === 3 ? 'unlocked' : 'locked',
        },
      );
    }
    case 'request_redemption':
      if (state.claimStatus !== 'unlocked') return state;
      return withHistory(state, 'customer', 'ნინომ ჯილდოს გამოყენება მოითხოვა', {
        claimStatus: 'redemption_requested',
        payoutStatus: 'pending',
      });
    case 'validate_redemption':
      if (state.claimStatus !== 'redemption_requested') return state;
      return withHistory(
        state,
        'advertiser',
        'Magnolia-მ გამოყენება დაადასტურა',
        {
          claimStatus: 'redeemed',
          payoutStatus: 'processing',
        },
      );
    case 'complete_payout':
      if (state.payoutStatus !== 'processing') return state;
      return withHistory(state, 'advertiser', 'Camora-ს მოკი გადახდა დასრულდა', {
        payoutStatus: 'paid',
        payoutReceipt: {
          type: 'payout',
          reference: 'PREVIEW-PAYOUT-001',
          amountSol: 0.005,
          memo:
            'LocalLoop|payout|campaign:magnolia-develop-the-night|deal:camora-deal|claim:LL-NINO-001',
        },
      });
    case 'reset':
      return initialPreviewState;
    default:
      return state;
  }
}

export function getNextStep(state: PreviewState): {
  persona: PreviewPersona;
  labelKa: string;
} {
  if (!state.walletConnected) {
    return { persona: 'advertiser', labelKa: 'დააკავშირეთ Magnolia-ს მოკი საფულე' };
  }
  if (state.campaignStatus === 'draft') {
    return {
      persona: 'advertiser',
      labelKa: 'მოაწერეთ ხელი სიმულირებული დაფინანსების ავტორიზაციას',
    };
  }
  if (state.dealStatus === 'proposed') {
    return { persona: 'host', labelKa: 'Camora-ს სახელით დაამტკიცეთ შეთავაზება' };
  }
  if (state.verifiedVisits < 3) {
    return {
      persona: 'host',
      labelKa: `დაადასტურეთ ნინოს ვიზიტი ${state.verifiedVisits + 1}/3`,
    };
  }
  if (state.claimStatus === 'unlocked') {
    return { persona: 'customer', labelKa: 'ნინოს სახელით მოითხოვეთ ჯილდო' };
  }
  if (state.claimStatus === 'redemption_requested') {
    return {
      persona: 'advertiser',
      labelKa: 'Magnolia-ს სახელით დაადასტურეთ გამოყენება',
    };
  }
  if (state.payoutStatus === 'processing') {
    return {
      persona: 'advertiser',
      labelKa: 'დაასრულეთ მოკი devnet ანგარიშსწორება',
    };
  }
  return { persona: 'advertiser', labelKa: 'დემო დასრულებულია — დაიწყეთ თავიდან' };
}
