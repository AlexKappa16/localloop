import {
  PublicKey,
  Transaction,
  type TransactionInstruction,
} from '@solana/web3.js';
import {
  explorerTxUrl,
  FUNDING_PROOF_MEMO,
} from '../../shared/contracts';
import { ids } from '../../shared/ids';
import type { ChainTransaction } from '../../shared/types';
import {
  assertConnectionIsDevnet,
  getSolanaConnection,
  getTreasuryKeypair,
  isSolanaReady,
} from './client';
import {
  createSignedMemoInstruction,
  MEMO_PROGRAM_ID,
} from './memo';

/** SPL Memo program (memo-only instruction, no token transfer). */
export { MEMO_PROGRAM_ID };

export type FundingProofResult = {
  transaction: ChainTransaction;
};

export function createMemoInstruction(
  payer: PublicKey,
  memo: string,
): TransactionInstruction {
  return createSignedMemoInstruction(memo, payer);
}

/**
 * Submit a server-paid memo-only funding-proof transaction on Solana devnet.
 * Marks nothing in domain state — caller updates state after confirmation.
 */
export async function submitFundingProof(options?: {
  campaignId?: string;
  memo?: string;
}): Promise<FundingProofResult> {
  if (!isSolanaReady()) {
    throw new Error(
      'Solana is not ready. Configure DEMO_TREASURY_SECRET_KEY, DEMO_HOST_PUBLIC_KEY, and SOLANA_RPC_URL for devnet.',
    );
  }

  const connection = getSolanaConnection();
  const treasury = getTreasuryKeypair();
  const memo = options?.memo ?? FUNDING_PROOF_MEMO;
  const campaignId = options?.campaignId ?? ids.campaign;

  await assertConnectionIsDevnet(connection);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('confirmed');

  const tx = new Transaction().add(
    createMemoInstruction(treasury.publicKey, memo),
  );
  tx.feePayer = treasury.publicKey;
  tx.recentBlockhash = blockhash;

  tx.sign(treasury);

  const simulation = await connection.simulateTransaction(tx);
  if (simulation.value.err) {
    throw new Error(
      `Funding-proof simulation failed: ${JSON.stringify(simulation.value.err)}`,
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
      `Funding-proof confirmation failed: ${JSON.stringify(confirmation.value.err)}`,
    );
  }

  const transaction: ChainTransaction = {
    id: `funding-proof-${signature.slice(0, 8)}`,
    type: 'funding_proof',
    signature,
    explorerUrl: explorerTxUrl(signature),
    status: 'confirmed',
    cluster: 'devnet',
    createdAt: new Date().toISOString(),
    memo,
    campaignId,
  };

  return { transaction };
}
