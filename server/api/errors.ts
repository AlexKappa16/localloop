import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorBody } from '../../shared/contracts';

export class AppError extends Error {
  readonly code: string;
  readonly messageKa: string;
  readonly retryable: boolean;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(options: {
    code: string;
    messageKa: string;
    retryable?: boolean;
    status?: number;
    details?: Record<string, unknown>;
  }) {
    super(options.messageKa);
    this.name = 'AppError';
    this.code = options.code;
    this.messageKa = options.messageKa;
    this.retryable = options.retryable ?? false;
    this.status = options.status ?? 400;
    this.details = options.details;
  }

  toJSON(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        messageKa: this.messageKa,
        retryable: this.retryable,
        details: this.details,
      },
    };
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json(err.toJSON());
    return;
  }

  console.error('[api]', err instanceof Error ? err.message : 'unknown error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      messageKa: 'სერვერის შეცდომა. სცადეთ თავიდან.',
      retryable: true,
    },
  } satisfies ApiErrorBody);
}
