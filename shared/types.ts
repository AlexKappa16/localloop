import type { ClaimId, CampaignId, CustomerId, DealId, BusinessId } from './ids';

export type BusinessCapability = 'advertiser' | 'host';

export type CampaignStatus = 'draft' | 'simulated_funded' | 'live' | 'completed';
export type DealStatus = 'proposed' | 'active' | 'completed';
export type ClaimStatus = 'locked' | 'unlocked' | 'redemption_requested' | 'redeemed';
export type PayoutStatus = 'not_ready' | 'pending' | 'processing' | 'paid' | 'failed';
export type TransactionType = 'funding_proof' | 'host_payout';
export type TransactionConfirmation = 'pending' | 'confirmed' | 'failed';

export interface Business {
  id: BusinessId | string;
  name: string;
  capabilities: BusinessCapability[];
  addressKa?: string;
}

export interface Customer {
  id: CustomerId | string;
  displayName: string;
}

export interface CampaignBudget {
  totalSol: number;
  remainingSol: number;
  reservedSol: number;
  paidSol: number;
  labelKa: string;
}

export interface Campaign {
  id: CampaignId | string;
  nameKa: string;
  advertiserBusinessId: string;
  status: CampaignStatus;
  budget: CampaignBudget;
}

export interface Deal {
  id: DealId | string;
  campaignId: string;
  hostBusinessId: string;
  status: DealStatus;
  requirementKa: string;
  rewardKa: string;
  payoutSol: number;
  maxRedemptions: number;
  mocked?: boolean;
}

export interface Visit {
  id: string;
  dealId: string;
  customerId: string;
  hostBusinessId: string;
  verifiedAt: string;
  sequence: number;
}

export interface Claim {
  id: ClaimId | string;
  customerId: string;
  dealId: string;
  campaignId: string;
  status: ClaimStatus;
  verifiedVisits: number;
  requiredVisits: number;
}

export interface Payout {
  claimId: string;
  dealId: string;
  hostBusinessId: string;
  status: PayoutStatus;
  amountSol: number;
  transactionId?: string;
}

export interface ChainTransaction {
  id: string;
  type: TransactionType;
  signature: string;
  explorerUrl: string;
  status: TransactionConfirmation;
  cluster: 'devnet';
  createdAt: string;
  memo: string;
  claimId?: string;
  campaignId?: string;
  dealId?: string;
}

export interface DemoState {
  revision: number;
  businesses: Business[];
  customers: Customer[];
  campaigns: Campaign[];
  deals: Deal[];
  visits: Visit[];
  claims: Claim[];
  payouts: Payout[];
  transactions: ChainTransaction[];
}
