import { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { useDemoState } from '../../app/DemoStateProvider';
import { en } from '../../copy/en';
import { ids } from '../../../shared/ids';
import { ApiClientError } from '../../lib/api';

type Props = { customerId: string };

export function CustomerPage({ customerId }: Props) {
  const { state, requestRedemptionMutation } = useDemoState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customer = state.customers.find((item) => item.id === customerId);
  const claim = state.claims.find((item) => item.customerId === customerId);
  const deal = state.deals.find((d) => d.id === claim?.dealId);
  const campaign = state.campaigns.find((c) => c.id === claim?.campaignId);
  const host = state.businesses.find((b) => b.id === deal?.hostBusinessId);
  const advertiser = state.businesses.find(
    (b) => b.id === campaign?.advertiserBusinessId,
  );
  const visits = state.visits
    .filter((v) => v.customerId === customerId && v.dealId === claim?.dealId)
    .sort((a, b) => a.sequence - b.sequence);

  async function onRedeem() {
    if (!claim) return;
    setBusy(true);
    setError(null);
    try {
      await requestRedemptionMutation(claim.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : en.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <h2>{customer?.displayName ?? en.personaNino}</h2>
        <p className="muted">{en.demoMode}</p>
        <p>
          {host?.name ?? 'Camora'} × {advertiser?.name ?? 'Magnolia Film Lab'}
        </p>
        <h3>{campaign?.name ?? en.campaignName}</h3>
        <p>
          {en.rewardTerms}: {deal?.reward}
        </p>
        <p className="muted">{en.oneTimeUse}</p>
      </div>

      <div className="panel stack">
        <h3>{en.visitsProgress}</h3>
        <div className="stamp-row" aria-label="visit progress">
          {Array.from({ length: claim?.requiredVisits ?? 3 }).map((_, i) => {
            const filled = (claim?.verifiedVisits ?? 0) > i;
            return (
              <div
                key={i}
                className={`stamp ${filled ? 'stamp--filled' : ''}`}
              >
                {filled ? '✓' : i + 1}
              </div>
            );
          })}
        </div>
        <p>
          {claim?.verifiedVisits ?? 0}/{claim?.requiredVisits ?? 3}
        </p>
        {claim ? (
          <>
            <p className="mono">
              {en.claimId}: {claim.id}
            </p>
            <StatusBadge kind="claim" status={claim.status} />
          </>
        ) : null}

        {claim?.status === 'unlocked' ? (
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => void onRedeem()}
          >
            {en.redeemRequest}
          </button>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="panel stack">
        <h3>Verification history</h3>
        {visits.length === 0 ? (
          <p className="muted">{en.emptyState}</p>
        ) : (
          <ul className="history-list">
            {visits.map((visit) => (
              <li key={visit.id}>
                <span className="mono">#{visit.sequence}</span>{' '}
                {state.businesses.find((b) => b.id === visit.hostBusinessId)
                  ?.name ?? ids.camora}{' '}
                · {new Date(visit.verifiedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
