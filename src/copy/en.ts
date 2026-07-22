import type {
  CampaignStatus,
  ClaimStatus,
  DealStatus,
  PayoutStatus,
  TransactionType,
} from '../../shared/types';

export const en = {
  brand: 'LocalLoop',
  demoMode: 'Demo mode',
  demoLauncherTitle: 'Local B2B rewards network',
  demoLauncherBody:
    'Pick a persona and walk the Magnolia × Camora demo from one shared server state.',
  openCustomer: 'Customer — Nino',
  openAdvertiser: 'Advertiser — Magnolia',
  openHost: 'Host — Camora',
  reset: 'Reset demo',
  loading: 'Loading…',
  errorGeneric: 'Something went wrong. Please try again.',
  emptyState: 'Nothing to show here yet.',
  workspaceAdvertiser: 'Advertiser workspace',
  workspaceHost: 'Host workspace',
  personaNino: 'Nino',
  personaMagnolia: 'Magnolia Film Lab',
  personaCamora: 'Camora',
  campaignName: 'Develop the Night',
  fundAction: 'Simulate campaign funding',
  verifyVisit: 'Verify Camora visit',
  redeemRequest: 'Request reward redemption',
  validateRedemption: 'Validate redemption',
  fundingLabel: 'Simulated budget',
  settlementLabel: 'Demo settlement on Solana devnet',
  capabilityMissing: 'This business does not have the requested capability.',
  revisionLabel: 'Revision',
  openExplorer: 'Open in Explorer',
  noReceipt: 'No transaction receipt yet.',
  connectWallet: 'Connect wallet',
  disconnectWallet: 'Disconnect',
  signAndFund: 'Sign authorization & simulate funding',
  walletConnected: 'Connected',
  walletUnsupported:
    'This wallet cannot sign messages. Connect a Wallet Standard wallet that supports signMessage.',
  challengePreview: 'Exact authorization message',
  fundingPending: 'Submitting funding proof on Solana devnet…',
  fundingSuccess: 'Campaign marked simulated-funded after confirmed proof.',
  fundingDisclosure:
    'No SOL leaves your connected wallet. You only sign a message. The server demo treasury records a memo on Solana devnet.',
  solanaNotReady:
    'Solana is not configured. Add DEMO_TREASURY_SECRET_KEY and DEMO_HOST_PUBLIC_KEY to .env, keep SOLANA_CLUSTER=devnet, fund the treasury via the faucet, then retry.',
  approveDeal: 'Approve deal',
  approveDealDisabled: 'Approve unlocks after simulated funding.',
  hostEmptyAdvertiser:
    'No advertiser campaigns for this business in the demo seed.',
  advertiserEmptyHost:
    'No host deals for this business in the demo seed. Switch to advertiser workspace for Magnolia’s campaign.',
  dealTerms: 'Deal terms',
  partnerDeals: 'Partner deals',
  budgetTotal: 'Total',
  budgetReserved: 'Reserved',
  budgetPaid: 'Paid',
  budgetRemaining: 'Remaining',
  rewardTerms: 'Reward',
  claimId: 'Claim ID',
  visitsProgress: 'Verified visits',
  payoutStatus: 'Payout',
  retryPayout: 'Retry payout',
  oneTimeUse: 'One-time reward — redeem once at Magnolia.',
  staffMode: 'Staff verification mode',
  qrPlacement: 'LocalLoop QR / pass placement (demo visual — no camera)',
  incomingRedemption: 'Incoming redemption',
  noRedemption: 'No redemption request yet.',
  mockedDeal: 'Mocked partner path',
  workingDeal: 'Live demo path',
} as const;

export const claimStatusLabel: Record<ClaimStatus, string> = {
  locked: 'Locked',
  unlocked: 'Unlocked',
  redemption_requested: 'Redemption requested',
  redeemed: 'Redeemed',
};

export const payoutStatusLabel: Record<PayoutStatus, string> = {
  not_ready: 'Not ready',
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
};

export const campaignStatusLabel: Record<CampaignStatus, string> = {
  draft: 'Draft',
  simulated_funded: 'Simulated funded',
  live: 'Live',
  completed: 'Completed',
};

export const dealStatusLabel: Record<DealStatus, string> = {
  proposed: 'Proposed',
  active: 'Active',
  completed: 'Completed',
};

export const transactionTypeLabel: Record<TransactionType, string> = {
  funding_proof: 'Funding proof',
  host_payout: 'Host payout',
};
