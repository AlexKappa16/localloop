import type { Keypair, PublicKey } from '@solana/web3.js';

export const SOLANA_CLUSTER = 'devnet' as const;
export const DEVNET_GENESIS_HASH =
  'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export const CAMORA_PAYOUT_LAMPORTS = 5_000_000;

export interface SolanaRuntimeConfig {
  cluster: string;
  rpcUrl: string;
  treasurySecretKey: string;
  hostPublicKey: string;
}

export interface ValidatedSolanaConfig {
  cluster: typeof SOLANA_CLUSTER;
  rpcUrl: string;
  treasury: Keypair;
  hostPublicKey: PublicKey;
}

export type SignatureChainState =
  | 'unknown'
  | 'processing'
  | 'confirmed'
  | 'failed';
