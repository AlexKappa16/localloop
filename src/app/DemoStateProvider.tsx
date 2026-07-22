import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createEmptyDemoState } from '../../shared/seedSnapshot';
import type { DemoState } from '../../shared/types';
import {
  ApiClientError,
  approveDeal,
  authorizeCampaignFunding,
  declineClaimRedemption,
  fetchState,
  requestClaimRedemption,
  resetDemo,
  validateClaim,
  verifyDealVisit,
} from '../lib/api';
import { subscribeToRevisions } from '../lib/events';

type DemoStatus = 'loading' | 'ready' | 'error';

type DemoStateContextValue = {
  state: DemoState;
  status: DemoStatus;
  error: string | null;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  applyState: (next: DemoState) => void;
  approveDealMutation: (dealId: string) => Promise<void>;
  verifyVisitMutation: (dealId: string, customerId: string) => Promise<void>;
  requestRedemptionMutation: (claimId: string) => Promise<void>;
  declineRedemptionMutation: (claimId: string) => Promise<void>;
  validateClaimMutation: (claimId: string) => Promise<void>;
  authorizeFundingMutation: (
    campaignId: string,
    payload: {
      challengeId: string;
      walletAddress: string;
      signatureBase58: string;
    },
  ) => Promise<void>;
};

const DemoStateContext = createContext<DemoStateContextValue | null>(null);

function toMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Failed to load demo state';
}

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createEmptyDemoState(0));
  const [status, setStatus] = useState<DemoStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const applyState = useCallback((next: DemoState) => {
    setState(next);
    setStatus('ready');
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchState();
      applyState(next);
    } catch (err) {
      setStatus('error');
      setError(toMessage(err));
    }
  }, [applyState]);

  const reset = useCallback(async () => {
    const result = await resetDemo();
    applyState(result.state);
  }, [applyState]);

  const approveDealMutation = useCallback(
    async (dealId: string) => {
      const result = await approveDeal(dealId);
      applyState(result.state);
    },
    [applyState],
  );

  const verifyVisitMutation = useCallback(
    async (dealId: string, customerId: string) => {
      const result = await verifyDealVisit(dealId, customerId);
      applyState(result.state);
    },
    [applyState],
  );

  const requestRedemptionMutation = useCallback(
    async (claimId: string) => {
      const result = await requestClaimRedemption(claimId);
      applyState(result.state);
    },
    [applyState],
  );

  const declineRedemptionMutation = useCallback(
    async (claimId: string) => {
      const result = await declineClaimRedemption(claimId);
      applyState(result.state);
    },
    [applyState],
  );

  const validateClaimMutation = useCallback(
    async (claimId: string) => {
      const result = await validateClaim(claimId);
      applyState(result.state);
    },
    [applyState],
  );

  const authorizeFundingMutation = useCallback(
    async (
      campaignId: string,
      payload: {
        challengeId: string;
        walletAddress: string;
        signatureBase58: string;
      },
    ) => {
      const result = await authorizeCampaignFunding(campaignId, payload);
      applyState(result.state);
    },
    [applyState],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeToRevisions((revision) => {
      if (revision > state.revision) {
        void refresh();
      }
    });
  }, [refresh, state.revision]);

  const value = useMemo(
    () => ({
      state,
      status,
      error,
      refresh,
      reset,
      applyState,
      approveDealMutation,
      verifyVisitMutation,
      requestRedemptionMutation,
      declineRedemptionMutation,
      validateClaimMutation,
      authorizeFundingMutation,
    }),
    [
      state,
      status,
      error,
      refresh,
      reset,
      applyState,
      approveDealMutation,
      verifyVisitMutation,
      requestRedemptionMutation,
      declineRedemptionMutation,
      validateClaimMutation,
      authorizeFundingMutation,
    ],
  );

  return (
    <DemoStateContext.Provider value={value}>{children}</DemoStateContext.Provider>
  );
}

export function useDemoState(): DemoStateContextValue {
  const ctx = useContext(DemoStateContext);
  if (!ctx) {
    throw new Error('useDemoState must be used within DemoStateProvider');
  }
  return ctx;
}
