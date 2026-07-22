import assert from 'node:assert/strict';
import test from 'node:test';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { ids } from '../../shared/ids';
import { FundingChallengeStore } from './challenges';
import { WalletAuthorizationError } from './errors';
import { verifyAndConsumeFundingAuthorization } from './verifySignature';

test('verifies the exact challenge and consumes it once', () => {
  const wallet = Keypair.generate();
  const store = new FundingChallengeStore();
  const challenge = store.issue(wallet.publicKey.toBase58());
  const signature = nacl.sign.detached(
    new TextEncoder().encode(challenge.message),
    wallet.secretKey,
  );

  const verified = verifyAndConsumeFundingAuthorization(store, {
    challengeId: challenge.challengeId,
    walletAddress: wallet.publicKey.toBase58(),
    signatureBase58: bs58.encode(signature),
  });

  assert.equal(verified.campaignId, ids.campaign);
  assert.equal(verified.walletAddress, wallet.publicKey.toBase58());
  assert.throws(
    () =>
      verifyAndConsumeFundingAuthorization(store, {
        challengeId: challenge.challengeId,
        walletAddress: wallet.publicKey.toBase58(),
        signatureBase58: bs58.encode(signature),
      }),
    (error: unknown) =>
      error instanceof WalletAuthorizationError &&
      error.code === 'CHALLENGE_NOT_FOUND',
  );
});

test('issues the canonical safety message bound to wallet and expiry', () => {
  const wallet = Keypair.generate();
  const store = new FundingChallengeStore();
  const challenge = store.issue(
    wallet.publicKey.toBase58(),
    new Date('2026-07-22T12:00:00.000Z'),
  );
  const lines = challenge.message.split('\n');

  assert.deepEqual(lines.slice(0, 5), [
    'LocalLoop demo authorization',
    'Action: Simulate campaign funding',
    `Campaign: ${ids.campaign}`,
    'Budget: 0.05 SOL (simulated; no transfer)',
    `Wallet: ${wallet.publicKey.toBase58()}`,
  ]);
  assert.match(lines[5]!, /^Nonce: [0-9a-f]{32}$/);
  assert.equal(lines[6], 'Expires: 2026-07-22T12:05:00.000Z');
  assert.equal(
    lines[7],
    'This signature does not authorize a blockchain transaction.',
  );
});

test('rejects a modified signature and consumes the challenge', () => {
  const wallet = Keypair.generate();
  const store = new FundingChallengeStore();
  const challenge = store.issue(wallet.publicKey.toBase58());
  const signature = nacl.sign.detached(
    new TextEncoder().encode(`${challenge.message}\nmodified`),
    wallet.secretKey,
  );
  const input = {
    challengeId: challenge.challengeId,
    walletAddress: wallet.publicKey.toBase58(),
    signatureBase58: bs58.encode(signature),
  };

  assert.throws(
    () => verifyAndConsumeFundingAuthorization(store, input),
    (error: unknown) =>
      error instanceof WalletAuthorizationError &&
      error.code === 'SIGNATURE_INVALID',
  );
  assert.throws(
    () => verifyAndConsumeFundingAuthorization(store, input),
    (error: unknown) =>
      error instanceof WalletAuthorizationError &&
      error.code === 'CHALLENGE_NOT_FOUND',
  );
});

test('rejects expired and wrong-wallet challenges', () => {
  const wallet = Keypair.generate();
  const otherWallet = Keypair.generate();
  const store = new FundingChallengeStore();
  const challenge = store.issue(
    wallet.publicKey.toBase58(),
    new Date('2026-07-22T12:00:00.000Z'),
  );

  assert.throws(
    () => store.consume(challenge.challengeId, otherWallet.publicKey.toBase58()),
    (error: unknown) =>
      error instanceof WalletAuthorizationError &&
      error.code === 'CHALLENGE_WALLET_MISMATCH',
  );
  assert.throws(
    () =>
      store.consume(
        challenge.challengeId,
        wallet.publicKey.toBase58(),
        ids.campaign,
        new Date('2026-07-22T12:06:00.000Z'),
      ),
    (error: unknown) =>
      error instanceof WalletAuthorizationError &&
      error.code === 'CHALLENGE_EXPIRED',
  );
});
