import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { en } from '../copy/en';
import { useDemoState } from '../app/DemoStateProvider';

export function DemoResetButton() {
  const { reset } = useDemoState();
  const { connected, disconnect, select } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onReset() {
    setBusy(true);
    setError(null);
    try {
      await reset();
      // Demo reset must also clear the wallet session so the next
      // funding step can prompt Phantom again.
      if (connected) {
        await disconnect();
      }
      select(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : en.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reset-wrap">
      <button
        type="button"
        className="btn-quiet"
        onClick={() => void onReset()}
        disabled={busy}
      >
        {busy ? en.loading : en.reset}
      </button>
      {error ? <p className="muted reset-wrap__error">{error}</p> : null}
    </div>
  );
}
