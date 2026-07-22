import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import {
  assertConnectionIsDevnet,
  resetSolanaClientCache,
  resolveSolanaConfig,
} from './client';
import { SolanaServiceError } from './errors';
import { DEVNET_GENESIS_HASH } from './types';

afterEach(() => {
  delete process.env.DEMO_TREASURY_SECRET_KEY;
  delete process.env.DEMO_HOST_PUBLIC_KEY;
  resetSolanaClientCache();
});

function configure(treasury = Keypair.generate(), host = Keypair.generate()) {
  process.env.SOLANA_CLUSTER = 'devnet';
  process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
  process.env.DEMO_TREASURY_SECRET_KEY = bs58.encode(treasury.secretKey);
  process.env.DEMO_HOST_PUBLIC_KEY = host.publicKey.toBase58();
}

test('accepts a valid devnet-only configuration', () => {
  configure();
  const { status, config } = resolveSolanaConfig();
  assert.equal(status.solanaReady, true);
  assert.ok(config);
});

test('rejects malformed secrets and a treasury payout destination', () => {
  configure();
  process.env.DEMO_TREASURY_SECRET_KEY = bs58.encode(new Uint8Array(32));
  assert.equal(resolveSolanaConfig().status.solanaReady, false);

  const treasury = Keypair.generate();
  configure(treasury, treasury);
  assert.equal(resolveSolanaConfig().status.solanaReady, false);
});

test('verifies the RPC genesis hash instead of trusting its URL', async () => {
  const devnet = {
    getGenesisHash: async () => DEVNET_GENESIS_HASH,
  } as unknown as Connection;
  await assertConnectionIsDevnet(devnet);

  const wrongCluster = {
    getGenesisHash: async () => Keypair.generate().publicKey.toBase58(),
  } as unknown as Connection;
  await assert.rejects(
    () => assertConnectionIsDevnet(wrongCluster),
    (error: unknown) =>
      error instanceof SolanaServiceError &&
      error.code === 'SOLANA_CLUSTER_FORBIDDEN',
  );
});
