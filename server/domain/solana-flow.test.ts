import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';
import {
  FUNDING_PROOF_MEMO,
  payoutMemo,
  fundingChallengeMessage,
} from '../../shared/contracts';
import { ids } from '../../shared/ids';
import {
  clearChallenges,
  consumeChallenge,
  issueFundingChallenge,
} from '../wallet/challenges';
import { verifyWalletMessageSignature } from '../wallet/verifySignature';
import {
  clearPayoutIdempotency,
  rememberCompletedPayout,
  getCompletedPayout,
} from '../solana/payout';
import {
  resetSolanaClientCache,
  resolveSolanaConfig,
} from '../solana/client';
import { resetStore, getSnapshot } from '../domain/store';
import {
  applyFundingProofConfirmed,
  approveDeal,
  beginValidation,
  completeHostPayout,
  requestRedemption,
  verifyVisit,
} from '../domain/transitions';
import type { ChainTransaction } from '../../shared/types';
import { AppError } from '../api/errors';

afterEach(() => {
  clearChallenges();
  clearPayoutIdempotency();
  resetSolanaClientCache();
  resetStore();
  delete process.env.DEMO_TREASURY_SECRET_KEY;
  delete process.env.DEMO_HOST_PUBLIC_KEY;
  process.env.SOLANA_CLUSTER = 'devnet';
  process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
});

describe('canonical memos', () => {
  it('uses the exact funding-proof memo', () => {
    assert.equal(
      FUNDING_PROOF_MEMO,
      'LocalLoop|proof|simulate-funding|campaign:magnolia-develop-the-night',
    );
  });

  it('builds the exact payout memo for LL-NINO-001', () => {
    assert.equal(
      payoutMemo(ids.claim),
      'LocalLoop|payout|campaign:magnolia-develop-the-night|deal:camora-deal|claim:LL-NINO-001',
    );
  });
});

describe('wallet challenges', () => {
  it('issues a safety-oriented plaintext challenge', () => {
    const kp = Keypair.generate();
    const challenge = issueFundingChallenge(kp.publicKey.toBase58());
    assert.match(challenge.message, /Simulate campaign funding/);
    assert.match(challenge.message, /does not authorize a blockchain transaction/);
    assert.ok(challenge.challengeId);
  });

  it('verifies a real Ed25519 signature and rejects replay', () => {
    const kp = Keypair.generate();
    const walletAddress = kp.publicKey.toBase58();
    const challenge = issueFundingChallenge(walletAddress);
    const messageBytes = new TextEncoder().encode(challenge.message);
    const signature = nacl.sign.detached(messageBytes, kp.secretKey);
    const signatureBase58 = bs58.encode(signature);

    assert.equal(
      verifyWalletMessageSignature({
        walletAddress,
        message: challenge.message,
        signatureBase58,
      }),
      true,
    );

    const consumed = consumeChallenge({
      challengeId: challenge.challengeId,
      walletAddress,
      campaignId: ids.campaign,
    });
    assert.equal(consumed.consumed, true);

    assert.throws(
      () =>
        consumeChallenge({
          challengeId: challenge.challengeId,
          walletAddress,
          campaignId: ids.campaign,
        }),
      (err: Error & { code?: string }) => err.code === 'CHALLENGE_REPLAY',
    );
  });

  it('rejects an invalid signature', () => {
    const kp = Keypair.generate();
    const other = Keypair.generate();
    const walletAddress = kp.publicKey.toBase58();
    const challenge = issueFundingChallenge(walletAddress);
    const messageBytes = new TextEncoder().encode(challenge.message);
    const badSig = nacl.sign.detached(messageBytes, other.secretKey);

    assert.equal(
      verifyWalletMessageSignature({
        walletAddress,
        message: challenge.message,
        signatureBase58: bs58.encode(badSig),
      }),
      false,
    );
  });

  it('rejects a modified challenge message', () => {
    const kp = Keypair.generate();
    const walletAddress = kp.publicKey.toBase58();
    const challenge = issueFundingChallenge(walletAddress);
    const modified = `${challenge.message}\nextra`;
    const signature = nacl.sign.detached(
      new TextEncoder().encode(modified),
      kp.secretKey,
    );
    assert.equal(
      verifyWalletMessageSignature({
        walletAddress,
        message: challenge.message,
        signatureBase58: bs58.encode(signature),
      }),
      false,
    );
  });
});

describe('solana config gate', () => {
  it('is not ready without secrets', () => {
    const { status, config } = resolveSolanaConfig();
    assert.equal(status.solanaReady, false);
    assert.equal(config, null);
    assert.ok(status.reasons.length > 0);
  });

  it('rejects non-devnet clusters', () => {
    process.env.SOLANA_CLUSTER = 'mainnet-beta';
    process.env.SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
    const kp = Keypair.generate();
    process.env.DEMO_TREASURY_SECRET_KEY = bs58.encode(kp.secretKey);
    process.env.DEMO_HOST_PUBLIC_KEY = Keypair.generate().publicKey.toBase58();
    const { status } = resolveSolanaConfig();
    assert.equal(status.solanaReady, false);
    assert.ok(status.reasons.some((r) => r.includes('devnet')));
  });
});

describe('domain transitions', () => {
  function fundingTx(): ChainTransaction {
    return {
      id: 'funding-proof-test',
      type: 'funding_proof',
      signature: 'FakeSignatureForUnitTestOnly111111111111111111111',
      explorerUrl:
        'https://explorer.solana.com/tx/FakeSignatureForUnitTestOnly111111111111111111111?cluster=devnet',
      status: 'confirmed',
      cluster: 'devnet',
      createdAt: new Date().toISOString(),
      memo: FUNDING_PROOF_MEMO,
      campaignId: ids.campaign,
    };
  }

  it('rejects deal approval before funding', () => {
    assert.throws(
      () => approveDeal(ids.camoraDeal),
      (err: unknown) => err instanceof AppError && err.code === 'CAMPAIGN_NOT_FUNDED',
    );
  });

  it('progresses visits, unlocks claim, and blocks a fourth visit', () => {
    applyFundingProofConfirmed(fundingTx());
    approveDeal(ids.camoraDeal);
    verifyVisit(ids.camoraDeal, ids.nino);
    let state = verifyVisit(ids.camoraDeal, ids.nino);
    const claim = state.claims.find((c) => c.id === ids.claim)!;
    assert.equal(claim.verifiedVisits, 3);
    assert.equal(claim.status, 'unlocked');

    assert.throws(
      () => verifyVisit(ids.camoraDeal, ids.nino),
      (err: unknown) =>
        err instanceof AppError && err.code === 'VISIT_LIMIT_REACHED',
    );
  });

  it('completes redemption and payout budget math without a second payout record', () => {
    applyFundingProofConfirmed(fundingTx());
    approveDeal(ids.camoraDeal);
    verifyVisit(ids.camoraDeal, ids.nino);
    verifyVisit(ids.camoraDeal, ids.nino);
    requestRedemption(ids.claim);

    const first = beginValidation(ids.claim);
    assert.equal(first.alreadyPaid, false);

    const payoutTx: ChainTransaction = {
      id: `host-payout-${ids.claim}`,
      type: 'host_payout',
      signature: 'FakePayoutSignatureForUnitTestOnly222222222222222',
      explorerUrl:
        'https://explorer.solana.com/tx/FakePayoutSignatureForUnitTestOnly222222222222222?cluster=devnet',
      status: 'confirmed',
      cluster: 'devnet',
      createdAt: new Date().toISOString(),
      memo: payoutMemo(ids.claim),
      claimId: ids.claim,
      campaignId: ids.campaign,
      dealId: ids.camoraDeal,
    };

    let state = completeHostPayout(ids.claim, payoutTx);
    rememberCompletedPayout(payoutTx);
    assert.equal(state.payouts[0]?.status, 'paid');
    assert.equal(state.campaigns[0]?.budget.remainingSol, 0.045);
    assert.equal(state.campaigns[0]?.budget.paidSol, 0.005);

    const second = beginValidation(ids.claim);
    assert.equal(second.alreadyPaid, true);
    assert.equal(getCompletedPayout(ids.claim)?.signature, payoutTx.signature);
    assert.equal(
      getSnapshot().transactions.filter((t) => t.type === 'host_payout').length,
      1,
    );
  });

  it('reset restores seed visits and empty transactions', () => {
    applyFundingProofConfirmed(fundingTx());
    const state = resetStore();
    assert.equal(state.campaigns[0]?.status, 'draft');
    assert.equal(state.claims[0]?.verifiedVisits, 1);
    assert.equal(state.claims[0]?.status, 'locked');
    assert.equal(state.transactions.length, 0);
    assert.equal(state.campaigns[0]?.budget.remainingSol, 0.05);
  });
});

describe('challenge message helper', () => {
  it('embeds wallet, nonce, and expiry', () => {
    const message = fundingChallengeMessage({
      walletAddress: 'DemoWallet111',
      nonce: 'abc',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
    assert.match(message, /Wallet: DemoWallet111/);
    assert.match(message, /Nonce: abc/);
    assert.match(message, /Expires: 2099-01-01T00:00:00.000Z/);
  });
});
