#!/usr/bin/env tsx
/**
 * Safe Solana readiness check.
 * Never prints DEMO_TREASURY_SECRET_KEY or any private key material.
 */
import 'dotenv/config';
import {
  getTreasuryBalanceSol,
  resetSolanaClientCache,
  resolveSolanaConfig,
} from '../solana/client';

async function main(): Promise<void> {
  resetSolanaClientCache();
  const { status, config } = resolveSolanaConfig();

  console.log('LocalLoop Solana check');
  console.log('----------------------');
  console.log(`cluster:              ${status.cluster}`);
  console.log(`rpcUrl:               ${status.rpcUrl ?? '(missing)'}`);
  console.log(`treasuryPublicKey:    ${status.treasuryPublicKey ?? '(unavailable)'}`);
  console.log(`hostPublicKey:        ${status.hostPublicKey ?? '(unavailable)'}`);

  if (status.reasons.length > 0) {
    console.log('solanaReady:          false');
    console.log('issues:');
    for (const reason of status.reasons) {
      console.log(`  - ${reason}`);
    }
    process.exitCode = 1;
    return;
  }

  if (!config) {
    console.log('solanaReady:          false');
    console.log('issues:');
    console.log('  - Configuration resolved empty unexpectedly');
    process.exitCode = 1;
    return;
  }

  try {
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(config.rpcUrl, 'confirmed');
    await connection.getLatestBlockhash('confirmed');
    console.log('rpcResponds:          true');
  } catch (err) {
    console.log('rpcResponds:          false');
    console.log(`solanaReady:          false`);
    console.log(
      `issues:\n  - RPC did not respond: ${err instanceof Error ? err.message : 'unknown'}`,
    );
    process.exitCode = 1;
    return;
  }

  const balance = await getTreasuryBalanceSol();
  console.log(
    `treasuryBalanceSol:   ${balance === null ? '(unavailable)' : balance}`,
  );
  console.log('treasurySecret:       (ok, not printed)');
  console.log('solanaReady:          true');
}

main().catch((err) => {
  console.error(
    'solana:check failed:',
    err instanceof Error ? err.message : 'unknown error',
  );
  process.exitCode = 1;
});
