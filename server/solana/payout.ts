import {
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  CAMORA_PAYOUT_SOL,
  explorerTxUrl,
  payoutMemo,
} from '../../shared/contracts';
import { ids } from '../../shared/ids';
import type { ChainTransaction } from '../../shared/types';
import {
  assertConnectionIsDevnet,
  getHostPublicKey,
  getSolanaConnection,
  getTreasuryKeypair,
  isSolanaReady,
} from './client';
import { createMemoInstruction } from './fundingProof';

export type PayoutResult = {
  transaction: ChainTransaction;
  reused: boolean;
};

/** In-memory idempotency: claimId → confirmed ChainTransaction */
const completedByClaim = new Map<string, ChainTransaction>();
/** In-flight locks to prevent concurrent double-sends */
const locksByClaim = new Set<string>();

export function clearPayoutIdempotency(): void {
  completedByClaim.clear();
  locksByClaim.clear();
}

export function getCompletedPayout(claimId: string): ChainTransaction | undefined {
  return completedByClaim.get(claimId);
}

export function rememberCompletedPayout(tx: ChainTransaction): void {
  if (tx.claimId) {
    completedByClaim.set(tx.claimId, tx);
  }
}

/**
 * Send exactly 0.005 faucet-issued devnet SOL from the server treasury
 * to DEMO_HOST_PUBLIC_KEY with the canonical payout memo.
 * Idempotent by claim ID — never sends a second transfer after confirmation.
 */
export async function submitHostPayout(options: {
  claimId: string;
  dealId?: string;
  campaignId?: string;
  amountSol?: number;
}): Promise<PayoutResult> {
  const claimId = options.claimId;
  const dealId = options.dealId ?? ids.camoraDeal;
  const campaignId = options.campaignId ?? ids.campaign;
  const amountSol = options.amountSol ?? CAMORA_PAYOUT_SOL;
  const memo = payoutMemo(claimId);

  const existing = completedByClaim.get(claimId);
  if (existing) {
    return { transaction: existing, reused: true };
  }

  if (!isSolanaReady()) {
    throw new Error(
      'Solana is not ready. Configure DEMO_TREASURY_SECRET_KEY, DEMO_HOST_PUBLIC_KEY, and SOLANA_RPC_URL for devnet.',
    );
  }

  if (locksByClaim.has(claimId)) {
    throw new Error('Host payout is already in progress for this claim');
  }

  locksByClaim.add(claimId);
  try {
    const again = completedByClaim.get(claimId);
    if (again) {
      return { transaction: again, reused: true };
    }

    const connection = getSolanaConnection();
    const treasury = getTreasuryKeypair();
    const host = getHostPublicKey();
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

    await assertConnectionIsDevnet(connection);
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');

    const tx = new Transaction()
      .add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey: host,
          lamports,
        }),
      )
      .add(createMemoInstruction(treasury.publicKey, memo));
    tx.feePayer = treasury.publicKey;
    tx.recentBlockhash = blockhash;

    tx.sign(treasury);

    const simulation = await connection.simulateTransaction(tx);
    if (simulation.value.err) {
      throw new Error(
        `Host payout simulation failed: ${JSON.stringify(simulation.value.err)}`,
      );
    }

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed',
    );

    if (confirmation.value.err) {
      throw new Error(
        `Host payout confirmation failed: ${JSON.stringify(confirmation.value.err)}`,
      );
    }

    const transaction: ChainTransaction = {
      id: `host-payout-${claimId}`,
      type: 'host_payout',
      signature,
      explorerUrl: explorerTxUrl(signature),
      status: 'confirmed',
      cluster: 'devnet',
      createdAt: new Date().toISOString(),
      memo,
      claimId,
      campaignId,
      dealId,
    };

    completedByClaim.set(claimId, transaction);
    return { transaction, reused: false };
  } finally {
    locksByClaim.delete(claimId);
  }
}
