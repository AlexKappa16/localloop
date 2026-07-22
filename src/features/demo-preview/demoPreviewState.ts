import type {
  CampaignStatus,
  ClaimStatus,
  DealStatus,
  PayoutStatus,
} from '../../../shared/types';
import { en } from '../../copy/en';

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
  | { type: 'create_campaign_complete' }
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
  label: string;
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
      label: en.preview.historySeed,
    },
  ],
};

function withHistory(
  state: PreviewState,
  persona: PreviewPersona,
  label: string,
  updates: Partial<PreviewState>,
): PreviewState {
  return {
    ...state,
    ...updates,
    history: [
      ...state.history,
      { id: state.history.length + 1, persona, label },
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
      return withHistory(state, 'advertiser', en.preview.historyConnect, {
        walletConnected: true,
      });
    case 'authorize_funding':
      if (!state.walletConnected || state.campaignStatus !== 'draft') return state;
      return withHistory(state, 'advertiser', en.preview.historyFund, {
        campaignStatus: 'simulated_funded',
        fundingReceipt: {
          type: 'funding',
          reference: 'PREVIEW-FUNDING-001',
          memo:
            'LocalLoop|proof|simulate-funding|campaign:magnolia-develop-the-night',
        },
      });
    case 'create_campaign_complete':
      return withHistory(state, 'advertiser', en.preview.historyFund, {
        activePersona: 'advertiser',
        walletConnected: true,
        campaignStatus:
          state.campaignStatus === 'draft'
            ? 'simulated_funded'
            : state.campaignStatus,
        fundingReceipt:
          state.fundingReceipt ??
          ({
            type: 'funding',
            reference: 'PREVIEW-FUNDING-001',
            memo:
              'LocalLoop|proof|simulate-funding|campaign:magnolia-develop-the-night',
          } satisfies PreviewReceipt),
      });
    case 'approve_deal':
      if (
        state.campaignStatus !== 'simulated_funded' ||
        state.dealStatus !== 'proposed'
      ) {
        return state;
      }
      return withHistory(state, 'host', en.preview.historyApprove, {
        campaignStatus: 'live',
        dealStatus: 'active',
      });
    case 'verify_visit': {
      if (state.dealStatus !== 'active' || state.verifiedVisits >= 3) return state;
      const verifiedVisits = state.verifiedVisits + 1;
      return withHistory(
        state,
        'host',
        en.preview.historyVisit(verifiedVisits),
        {
          verifiedVisits,
          claimStatus: verifiedVisits === 3 ? 'unlocked' : 'locked',
        },
      );
    }
    case 'request_redemption':
      if (state.claimStatus !== 'unlocked') return state;
      return withHistory(state, 'customer', en.preview.historyRequest, {
        claimStatus: 'redemption_requested',
        payoutStatus: 'pending',
      });
    case 'validate_redemption':
      if (state.claimStatus !== 'redemption_requested') return state;
      return withHistory(state, 'advertiser', en.preview.historyValidate, {
        claimStatus: 'redeemed',
        payoutStatus: 'processing',
      });
    case 'complete_payout':
      if (state.payoutStatus !== 'processing') return state;
      return withHistory(state, 'advertiser', en.preview.historyPayout, {
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
  label: string;
} {
  if (!state.walletConnected) {
    return { persona: 'advertiser', label: en.preview.nextConnect };
  }
  if (state.campaignStatus === 'draft') {
    return { persona: 'advertiser', label: en.preview.nextSign };
  }
  if (state.dealStatus === 'proposed') {
    return { persona: 'host', label: en.preview.nextApprove };
  }
  if (state.verifiedVisits < 3) {
    return {
      persona: 'host',
      label: en.preview.nextVisit(state.verifiedVisits + 1),
    };
  }
  if (state.claimStatus === 'unlocked') {
    return { persona: 'customer', label: en.preview.nextRequest };
  }
  if (state.claimStatus === 'redemption_requested') {
    return { persona: 'advertiser', label: en.preview.nextValidate };
  }
  if (state.payoutStatus === 'processing') {
    return { persona: 'advertiser', label: en.preview.nextPayout };
  }
  return { persona: 'advertiser', label: en.preview.nextDone };
}
