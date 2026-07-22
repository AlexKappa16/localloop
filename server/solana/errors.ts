export type SolanaErrorCode =
  | 'SOLANA_CONFIG_INVALID'
  | 'SOLANA_CLUSTER_FORBIDDEN'
  | 'SOLANA_RPC_UNAVAILABLE'
  | 'SOLANA_SIMULATION_FAILED'
  | 'SOLANA_SUBMISSION_FAILED'
  | 'SOLANA_CONFIRMATION_FAILED'
  | 'SOLANA_INSUFFICIENT_FUNDS'
  | 'SOLANA_REQUEST_FORBIDDEN'
  | 'SOLANA_PAYOUT_CONFLICT';

export class SolanaServiceError extends Error {
  readonly code: SolanaErrorCode;
  readonly messageKa: string;
  readonly retryable: boolean;
  readonly signature?: string;

  constructor(options: {
    code: SolanaErrorCode;
    message: string;
    messageKa: string;
    retryable: boolean;
    signature?: string;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'SolanaServiceError';
    this.code = options.code;
    this.messageKa = options.messageKa;
    this.retryable = options.retryable;
    this.signature = options.signature;
  }
}

export function isSolanaServiceError(
  error: unknown,
): error is SolanaServiceError {
  return error instanceof SolanaServiceError;
}
