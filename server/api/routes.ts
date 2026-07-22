import { Router } from 'express';
import type {
  AuthorizeFundingRequest,
  HealthResponse,
  MutationResponse,
  VerifyVisitRequest,
  WalletChallengeRequest,
  WalletChallengeResponse,
} from '../../shared/contracts';
import { ids } from '../../shared/ids';
import { AppError } from './errors';
import { getSnapshot, resetStore, subscribe } from '../domain/store';
import {
  applyFundingProofConfirmed,
  approveDeal,
  beginValidation,
  completeHostPayout,
  failHostPayout,
  requestRedemption,
  verifyVisit,
} from '../domain/transitions';
import { getHealthSolanaFields, isSolanaReady } from '../solana/client';
import { submitFundingProof } from '../solana/fundingProof';
import {
  clearPayoutIdempotency,
  getCompletedPayout,
  rememberCompletedPayout,
  submitHostPayout,
} from '../solana/payout';
import {
  clearChallenges,
  consumeChallenge,
  issueFundingChallenge,
} from '../wallet/challenges';
import { verifyWalletMessageSignature } from '../wallet/verifySignature';

function challengeError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : 'CHALLENGE_INVALID';
  const message =
    err instanceof Error ? err.message : 'Wallet challenge rejected.';
  const status =
    code === 'CHALLENGE_NOT_FOUND'
      ? 404
      : code === 'CHALLENGE_EXPIRED' || code === 'CHALLENGE_REPLAY'
        ? 409
        : 400;
  return new AppError({ code, message, status, retryable: false });
}

export function createApiRouter(): Router {
  const router = Router();

  router.get('/health', async (_req, res, next) => {
    try {
      const state = getSnapshot();
      const solana = await getHealthSolanaFields();
      const body: HealthResponse = {
        ok: true,
        status: 'ok',
        cluster: solana.cluster,
        treasuryPublicKey: solana.treasuryPublicKey,
        hostPublicKey: solana.hostPublicKey,
        treasuryBalanceSol: solana.treasuryBalanceSol,
        solanaReady: solana.solanaReady,
        revision: state.revision,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  });

  router.get('/state', (_req, res) => {
    res.json(getSnapshot());
  });

  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendRevision = (revision: number) => {
      res.write(
        `event: revision\ndata: ${JSON.stringify({ revision })}\n\n`,
      );
    };

    sendRevision(getSnapshot().revision);

    const unsubscribe = subscribe((revision) => {
      sendRevision(revision);
    });

    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  router.post('/demo/reset', (_req, res) => {
    clearChallenges();
    clearPayoutIdempotency();
    const state = resetStore();
    const body: MutationResponse<{ reset: true }> = {
      revision: state.revision,
      data: { reset: true },
      state,
    };
    res.json(body);
  });

  router.post('/wallet/challenge', (req, res, next) => {
    try {
      const body = req.body as WalletChallengeRequest;
      if (!body?.walletAddress || typeof body.walletAddress !== 'string') {
        throw new AppError({
          code: 'INVALID_REQUEST',
          message: 'walletAddress is required.',
          status: 400,
        });
      }
      const challenge = issueFundingChallenge(body.walletAddress);
      const response: WalletChallengeResponse = challenge;
      res.json(response);
    } catch (err) {
      next(err instanceof AppError ? err : challengeError(err));
    }
  });

  router.post('/campaigns/:campaignId/authorize-funding', async (req, res, next) => {
    try {
      const { campaignId } = req.params;
      if (campaignId !== ids.campaign) {
        throw new AppError({
          code: 'CAMPAIGN_NOT_ALLOWED',
          message: 'Funding authorization is only allowed for the seeded Magnolia campaign.',
          status: 400,
        });
      }

      const body = req.body as AuthorizeFundingRequest;
      if (
        !body?.challengeId ||
        !body?.walletAddress ||
        !body?.signatureBase58
      ) {
        throw new AppError({
          code: 'INVALID_REQUEST',
          message: 'challengeId, walletAddress, and signatureBase58 are required.',
          status: 400,
        });
      }

      const snapshot = getSnapshot();
      const campaign = snapshot.campaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        throw new AppError({
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Campaign not found.',
          status: 404,
        });
      }

      if (campaign.status !== 'draft') {
        const existing = snapshot.transactions.find(
          (t) => t.type === 'funding_proof',
        );
        const state = snapshot;
        const response: MutationResponse<{ alreadyFunded: true }> = {
          revision: state.revision,
          data: { alreadyFunded: true },
          state,
        };
        if (existing) {
          res.json(response);
          return;
        }
      }

      let challenge;
      try {
        challenge = consumeChallenge({
          challengeId: body.challengeId,
          walletAddress: body.walletAddress,
          campaignId,
        });
      } catch (err) {
        throw challengeError(err);
      }

      const valid = verifyWalletMessageSignature({
        walletAddress: body.walletAddress,
        message: challenge.message,
        signatureBase58: body.signatureBase58,
      });
      if (!valid) {
        throw new AppError({
          code: 'SIGNATURE_INVALID',
          message:
            'Wallet signature verification failed. Sign the exact challenge message.',
          status: 401,
          retryable: true,
        });
      }

      if (!isSolanaReady()) {
        throw new AppError({
          code: 'SOLANA_NOT_READY',
          message:
            'Solana is not configured. Set DEMO_TREASURY_SECRET_KEY, DEMO_HOST_PUBLIC_KEY, SOLANA_CLUSTER=devnet, and SOLANA_RPC_URL, then fund the treasury on the faucet.',
          status: 503,
          retryable: true,
        });
      }

      let proof;
      try {
        proof = await submitFundingProof({ campaignId });
      } catch (err) {
        throw new AppError({
          code: 'FUNDING_PROOF_FAILED',
          message:
            err instanceof Error
              ? `Funding proof failed: ${err.message}`
              : 'Funding proof failed on Solana devnet.',
          status: 502,
          retryable: true,
        });
      }

      const state = applyFundingProofConfirmed(proof.transaction);
      const response: MutationResponse<{
        transaction: typeof proof.transaction;
      }> = {
        revision: state.revision,
        data: { transaction: proof.transaction },
        state,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  router.post('/deals/:dealId/approve', (req, res, next) => {
    try {
      const state = approveDeal(req.params.dealId);
      const body: MutationResponse<{ dealId: string }> = {
        revision: state.revision,
        data: { dealId: req.params.dealId },
        state,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  });

  router.post('/deals/:dealId/visits', (req, res, next) => {
    try {
      const body = req.body as VerifyVisitRequest;
      if (!body?.customerId) {
        throw new AppError({
          code: 'INVALID_REQUEST',
          message: 'customerId is required.',
          status: 400,
        });
      }
      const state = verifyVisit(req.params.dealId, body.customerId);
      const response: MutationResponse<{ customerId: string }> = {
        revision: state.revision,
        data: { customerId: body.customerId },
        state,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  router.post('/claims/:claimId/request-redemption', (req, res, next) => {
    try {
      const state = requestRedemption(req.params.claimId);
      const body: MutationResponse<{ claimId: string }> = {
        revision: state.revision,
        data: { claimId: req.params.claimId },
        state,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  });

  router.post('/claims/:claimId/validate', async (req, res, next) => {
    try {
      const claimId = req.params.claimId;
      const { alreadyPaid, existingTx } = beginValidation(claimId);

      if (alreadyPaid) {
        const state = getSnapshot();
        const cached = existingTx ?? getCompletedPayout(claimId);
        if (cached) rememberCompletedPayout(cached);
        const body: MutationResponse<{
          reused: true;
          transaction?: typeof cached;
        }> = {
          revision: state.revision,
          data: { reused: true, transaction: cached },
          state,
        };
        res.json(body);
        return;
      }

      const memoized = getCompletedPayout(claimId);
      if (memoized) {
        const state = completeHostPayout(claimId, memoized);
        const body: MutationResponse<{
          reused: true;
          transaction: typeof memoized;
        }> = {
          revision: state.revision,
          data: { reused: true, transaction: memoized },
          state,
        };
        res.json(body);
        return;
      }

      if (!isSolanaReady()) {
        failHostPayout(claimId);
        throw new AppError({
          code: 'SOLANA_NOT_READY',
          message:
            'Solana is not configured. Set DEMO_TREASURY_SECRET_KEY, DEMO_HOST_PUBLIC_KEY, SOLANA_CLUSTER=devnet, and SOLANA_RPC_URL, then fund the treasury on the faucet.',
          status: 503,
          retryable: true,
        });
      }

      let payoutResult;
      try {
        payoutResult = await submitHostPayout({ claimId });
      } catch (err) {
        failHostPayout(claimId);
        throw new AppError({
          code: 'HOST_PAYOUT_FAILED',
          message:
            err instanceof Error
              ? `Host payout failed: ${err.message}`
              : 'Host payout failed on Solana devnet.',
          status: 502,
          retryable: true,
        });
      }

      const state = completeHostPayout(claimId, payoutResult.transaction);
      const body: MutationResponse<{
        reused: boolean;
        transaction: typeof payoutResult.transaction;
      }> = {
        revision: state.revision,
        data: {
          reused: payoutResult.reused,
          transaction: payoutResult.transaction,
        },
        state,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
