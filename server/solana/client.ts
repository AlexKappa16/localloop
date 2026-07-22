import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58';

export type SolanaConfigStatus = {
  cluster: string;
  rpcUrl: string | null;
  treasuryPublicKey: string | null;
  hostPublicKey: string | null;
  treasuryBalanceSol: number | null;
  solanaReady: boolean;
  reasons: string[];
};

type ResolvedConfig = {
  cluster: 'devnet';
  rpcUrl: string;
  treasury: Keypair;
  hostPublicKey: PublicKey;
};

let cachedConnection: Connection | null = null;
let cachedResolved: ResolvedConfig | null = null;
let lastStatus: SolanaConfigStatus | null = null;

function isDevnetRpcUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('devnet');
}

function readEnv(): {
  cluster: string;
  rpcUrl: string | undefined;
  treasurySecret: string | undefined;
  hostPublicKey: string | undefined;
} {
  return {
    cluster: (process.env.SOLANA_CLUSTER ?? '').trim(),
    rpcUrl: process.env.SOLANA_RPC_URL?.trim() || undefined,
    treasurySecret: process.env.DEMO_TREASURY_SECRET_KEY?.trim() || undefined,
    hostPublicKey: process.env.DEMO_HOST_PUBLIC_KEY?.trim() || undefined,
  };
}

function parseTreasurySecret(secret: string): Keypair {
  const placeholder = 'server_only_base58_secret';
  if (!secret || secret === placeholder) {
    throw new Error('DEMO_TREASURY_SECRET_KEY is missing or still a placeholder');
  }
  try {
    const bytes = bs58.decode(secret);
    return Keypair.fromSecretKey(bytes);
  } catch {
    throw new Error('DEMO_TREASURY_SECRET_KEY is not a valid base58 secret key');
  }
}

function parseHostPublicKey(value: string): PublicKey {
  const placeholder = 'replace_with_camora_demo_address';
  if (!value || value === placeholder) {
    throw new Error('DEMO_HOST_PUBLIC_KEY is missing or still a placeholder');
  }
  try {
    return new PublicKey(value);
  } catch {
    throw new Error('DEMO_HOST_PUBLIC_KEY is not a valid Solana public key');
  }
}

/**
 * Resolve and validate Solana configuration.
 * Never logs or returns the treasury secret.
 * Refuses any cluster other than exactly `devnet`.
 */
export function resolveSolanaConfig(): {
  status: SolanaConfigStatus;
  config: ResolvedConfig | null;
} {
  const env = readEnv();
  const reasons: string[] = [];

  if (env.cluster !== 'devnet') {
    reasons.push(
      `SOLANA_CLUSTER must be exactly "devnet" (got "${env.cluster || '(empty)'}")`,
    );
  }

  if (!env.rpcUrl) {
    reasons.push('SOLANA_RPC_URL is not configured');
  } else if (!isDevnetRpcUrl(env.rpcUrl)) {
    reasons.push('SOLANA_RPC_URL must explicitly target Solana devnet');
  }

  let treasury: Keypair | null = null;
  let treasuryPublicKey: string | null = null;
  if (!env.treasurySecret) {
    reasons.push('DEMO_TREASURY_SECRET_KEY is not configured');
  } else {
    try {
      treasury = parseTreasurySecret(env.treasurySecret);
      treasuryPublicKey = treasury.publicKey.toBase58();
    } catch (err) {
      reasons.push(err instanceof Error ? err.message : 'Invalid treasury secret');
    }
  }

  let hostPublicKey: PublicKey | null = null;
  let hostPublicKeyStr: string | null = null;
  if (!env.hostPublicKey) {
    reasons.push('DEMO_HOST_PUBLIC_KEY is not configured');
  } else {
    try {
      hostPublicKey = parseHostPublicKey(env.hostPublicKey);
      hostPublicKeyStr = hostPublicKey.toBase58();
    } catch (err) {
      reasons.push(err instanceof Error ? err.message : 'Invalid host public key');
    }
  }

  const status: SolanaConfigStatus = {
    cluster: env.cluster || '(unset)',
    rpcUrl: env.rpcUrl ?? null,
    treasuryPublicKey,
    hostPublicKey: hostPublicKeyStr,
    treasuryBalanceSol: null,
    solanaReady: reasons.length === 0,
    reasons,
  };

  if (
    reasons.length > 0 ||
    !treasury ||
    !hostPublicKey ||
    !env.rpcUrl ||
    env.cluster !== 'devnet'
  ) {
    cachedResolved = null;
    cachedConnection = null;
    lastStatus = status;
    return { status, config: null };
  }

  const config: ResolvedConfig = {
    cluster: 'devnet',
    rpcUrl: env.rpcUrl,
    treasury,
    hostPublicKey,
  };
  cachedResolved = config;
  cachedConnection = new Connection(config.rpcUrl, 'confirmed');
  lastStatus = status;
  return { status, config };
}

export function getSolanaConnection(): Connection {
  const { status } = resolveSolanaConfig();
  if (!cachedResolved || !cachedConnection) {
    throw new Error(
      status.reasons[0] ?? 'Solana service is not ready (devnet configuration required)',
    );
  }
  return cachedConnection;
}

export function getTreasuryKeypair(): Keypair {
  const { status } = resolveSolanaConfig();
  if (!cachedResolved) {
    throw new Error(
      status.reasons[0] ?? 'Solana treasury is not configured',
    );
  }
  return cachedResolved.treasury;
}

export function getHostPublicKey(): PublicKey {
  const { status } = resolveSolanaConfig();
  if (!cachedResolved) {
    throw new Error(
      status.reasons[0] ?? 'Solana host public key is not configured',
    );
  }
  return cachedResolved.hostPublicKey;
}

export function isSolanaReady(): boolean {
  return resolveSolanaConfig().status.solanaReady;
}

export async function getTreasuryBalanceSol(): Promise<number | null> {
  resolveSolanaConfig();
  if (!cachedResolved || !cachedConnection) return null;
  try {
    const lamports = await cachedConnection.getBalance(
      cachedResolved.treasury.publicKey,
    );
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

export async function getHealthSolanaFields(): Promise<{
  cluster: string;
  treasuryPublicKey: string | null;
  hostPublicKey: string | null;
  treasuryBalanceSol: number | null;
  solanaReady: boolean;
}> {
  const { status } = resolveSolanaConfig();
  let treasuryBalanceSol: number | null = null;
  let solanaReady = status.solanaReady;

  if (cachedResolved && cachedConnection) {
    try {
      await cachedConnection.getLatestBlockhash('confirmed');
      treasuryBalanceSol = await getTreasuryBalanceSol();
    } catch {
      solanaReady = false;
    }
  }

  lastStatus = {
    ...status,
    treasuryBalanceSol,
    solanaReady,
  };

  return {
    cluster: status.cluster,
    treasuryPublicKey: status.treasuryPublicKey,
    hostPublicKey: status.hostPublicKey,
    treasuryBalanceSol,
    solanaReady,
  };
}

export function getLastSolanaStatus(): SolanaConfigStatus | null {
  return lastStatus;
}

/** Reset cached client (tests / env reload). */
export function resetSolanaClientCache(): void {
  cachedConnection = null;
  cachedResolved = null;
  lastStatus = null;
}
