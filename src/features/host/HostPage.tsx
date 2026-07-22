import { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { TransactionReceipt } from '../../components/TransactionReceipt';
import { useDemoState } from '../../app/DemoStateProvider';
import { en } from '../../copy/en';
import { ids } from '../../../shared/ids';
import { ApiClientError } from '../../lib/api';

type Props = { businessId: string };

export function HostPage({ businessId }: Props) {
  const { state, approveDealMutation, verifyVisitMutation } = useDemoState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const business = state.businesses.find((item) => item.id === businessId);
  const deal = state.deals.find(
    (item) => item.hostBusinessId === businessId && !item.mocked,
  );
  const campaign = state.campaigns.find((c) => c.id === deal?.campaignId);
  const claim = state.claims.find((c) => c.dealId === deal?.id);
  const payout = state.payouts.find((item) => item.dealId === deal?.id);
  const payoutTx = state.transactions.find(
    (tx) => tx.type === 'host_payout' && tx.dealId === deal?.id,
  );
  const visits = state.visits
    .filter((v) => v.dealId === deal?.id)
    .sort((a, b) => b.sequence - a.sequence);

  const campaignFunded =
    campaign?.status === 'simulated_funded' ||
    campaign?.status === 'live' ||
    campaign?.status === 'completed';

  if (!deal) {
    return (
      <div className="panel stack">
        <p className="muted">
          {businessId === ids.magnolia
            ? en.advertiserEmptyHost
            : en.emptyState}
        </p>
      </div>
    );
  }

  async function onApprove() {
    setBusy(true);
    setError(null);
    try {
      await approveDealMutation(deal!.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : en.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    setBusy(true);
    setError(null);
    try {
      await verifyVisitMutation(deal!.id, ids.nino);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : en.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <h2>{business?.name ?? en.personaCamora}</h2>
        <p className="muted">{en.workspaceHost}</p>
        <p className="staff-banner">{en.staffMode}</p>
      </div>

      <div className="panel stack">
        <h3>{en.dealTerms}</h3>
        <p>
          {
            state.businesses.find((b) => b.id === campaign?.advertiserBusinessId)
              ?.name
          }{' '}
          · {campaign?.name}
        </p>
        <p>{deal.requirement}</p>
        <p>
          {en.rewardTerms}: {deal.reward}
        </p>
        <p className="mono">Host payout {deal.payoutSol} SOL (devnet)</p>
        <StatusBadge kind="deal" status={deal.status} />

        {deal.status === 'proposed' ? (
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy || !campaignFunded}
            onClick={() => void onApprove()}
          >
            {campaignFunded ? en.approveDeal : en.approveDealDisabled}
          </button>
        ) : null}
      </div>

      <div className="panel stack">
        <div className="qr-card" aria-hidden="true">
          <div className="qr-card__mark">LL</div>
          <p>{en.qrPlacement}</p>
        </div>

        <h3>{en.verifyVisit}</h3>
        <p>
          {en.visitsProgress}: {claim?.verifiedVisits ?? 0}/
          {claim?.requiredVisits ?? 3}
        </p>
        <button
          type="button"
          className="btn btn--primary"
          disabled={
            busy ||
            deal.status !== 'active' ||
            (claim?.verifiedVisits ?? 0) >= (claim?.requiredVisits ?? 3)
          }
          onClick={() => void onVerify()}
        >
          {en.verifyVisit}
        </button>
        {error ? <p className="error">{error}</p> : null}

        <h4>Recent verifications</h4>
        {visits.length === 0 ? (
          <p className="muted">{en.emptyState}</p>
        ) : (
          <ul className="history-list">
            {visits.map((visit) => (
              <li key={visit.id}>
                <span className="mono">#{visit.sequence}</span> {visit.customerId}{' '}
                · {new Date(visit.verifiedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel stack">
        <h3>{en.payoutStatus}</h3>
        {payout ? <StatusBadge kind="payout" status={payout.status} /> : null}
        <TransactionReceipt transaction={payoutTx} />
      </div>
    </div>
  );
}
