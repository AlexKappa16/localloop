export type WalletErrorCode =
  | 'REQUEST_INVALID'
  | 'WALLET_ADDRESS_INVALID'
  | 'CHALLENGE_NOT_FOUND'
  | 'CHALLENGE_WALLET_MISMATCH'
  | 'CHALLENGE_CAMPAIGN_MISMATCH'
  | 'CHALLENGE_EXPIRED'
  | 'CHALLENGE_REPLAY'
  | 'SIGNATURE_INVALID';

export class WalletAuthorizationError extends Error {
  readonly code: WalletErrorCode;
  readonly retryable: boolean;

  constructor(options: {
    code: WalletErrorCode;
    message: string;
    retryable: boolean;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'WalletAuthorizationError';
    this.code = options.code;
    this.retryable = options.retryable;
  }
}
