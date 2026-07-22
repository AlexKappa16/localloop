import { useState } from 'react';
import { ka } from '../copy/ka';
import { useDemoState } from '../app/DemoStateProvider';

export function DemoResetButton() {
  const { reset } = useDemoState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onReset() {
    setBusy(true);
    setError(null);
    try {
      await reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : ka.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn--danger"
        onClick={onReset}
        disabled={busy}
      >
        {busy ? ka.loading : ka.reset}
      </button>
      {error ? <p className="muted">{error}</p> : null}
    </div>
  );
}
