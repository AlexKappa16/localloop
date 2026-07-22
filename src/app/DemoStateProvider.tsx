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
import { fetchState, resetDemo } from '../lib/api';
import { subscribeToRevisions } from '../lib/events';

type DemoStatus = 'loading' | 'ready' | 'error';

type DemoStateContextValue = {
  state: DemoState;
  status: DemoStatus;
  errorKa: string | null;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
};

const DemoStateContext = createContext<DemoStateContextValue | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createEmptyDemoState(0));
  const [status, setStatus] = useState<DemoStatus>('loading');
  const [errorKa, setErrorKa] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchState();
      setState(next);
      setStatus('ready');
      setErrorKa(null);
    } catch (err) {
      setStatus('error');
      setErrorKa(err instanceof Error ? err.message : 'სტატუსის ჩატვირთვა ვერ მოხერხდა');
    }
  }, []);

  const reset = useCallback(async () => {
    const result = await resetDemo();
    setState(result.state);
    setStatus('ready');
    setErrorKa(null);
  }, []);

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
    () => ({ state, status, errorKa, refresh, reset }),
    [state, status, errorKa, refresh, reset],
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
