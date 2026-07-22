import { Router } from 'express';
import type { HealthResponse, MutationResponse } from '../../shared/contracts';
import { getSnapshot, resetStore } from '../domain/store';
import { AppError } from './errors';

export function createApiRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    const state = getSnapshot();
    const body: HealthResponse = {
      ok: true,
      service: 'localloop',
      revision: state.revision,
    };
    res.json(body);
  });

  router.get('/state', (_req, res) => {
    res.json(getSnapshot());
  });

  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const state = getSnapshot();
    res.write(`event: revision\ndata: ${JSON.stringify({ revision: state.revision })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  });

  router.post('/demo/reset', (_req, res) => {
    const state = resetStore();
    const body: MutationResponse<{ reset: true }> = {
      revision: state.revision,
      data: { reset: true },
      state,
    };
    res.json(body);
  });

  // LL-102 / LL-105 stubs — structured not-implemented errors
  router.post('/wallet/challenge', (_req, _res, next) => {
    next(
      new AppError({
        code: 'NOT_IMPLEMENTED',
        messageKa: 'საფულის გამოწვევა ჯერ არ არის მზად (LL-105).',
        status: 501,
        retryable: false,
      }),
    );
  });

  router.post('/campaigns/:campaignId/authorize-funding', (_req, _res, next) => {
    next(
      new AppError({
        code: 'NOT_IMPLEMENTED',
        messageKa: 'დაფინანსების ავტორიზაცია ჯერ არ არის მზად (LL-105).',
        status: 501,
        retryable: false,
      }),
    );
  });

  router.post('/deals/:dealId/approve', (_req, _res, next) => {
    next(
      new AppError({
        code: 'NOT_IMPLEMENTED',
        messageKa: 'შეთანხმების დადასტურება ჯერ არ არის მზად (LL-102).',
        status: 501,
        retryable: false,
      }),
    );
  });

  router.post('/deals/:dealId/visits', (_req, _res, next) => {
    next(
      new AppError({
        code: 'NOT_IMPLEMENTED',
        messageKa: 'ვიზიტის დადასტურება ჯერ არ არის მზად (LL-102).',
        status: 501,
        retryable: false,
      }),
    );
  });

  router.post('/claims/:claimId/request-redemption', (_req, _res, next) => {
    next(
      new AppError({
        code: 'NOT_IMPLEMENTED',
        messageKa: 'ჯილდოს მოთხოვნა ჯერ არ არის მზად (LL-102).',
        status: 501,
        retryable: false,
      }),
    );
  });

  router.post('/claims/:claimId/validate', (_req, _res, next) => {
    next(
      new AppError({
        code: 'NOT_IMPLEMENTED',
        messageKa: 'გამოყენების დადასტურება ჯერ არ არის მზად (LL-102).',
        status: 501,
        retryable: false,
      }),
    );
  });

  return router;
}
