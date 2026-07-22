import { useMemo, useState } from 'react';
import { StepWizard } from '../../components/StepWizard';
import { StatusBadge } from '../../components/StatusBadge';
import { TransactionReceipt } from '../../components/TransactionReceipt';
import { useDemoState } from '../../app/DemoStateProvider';
import { en } from '../../copy/en';
import { ids } from '../../../shared/ids';
import { ApiClientError } from '../../lib/api';

type Props = { businessId: string };

type HostStep = 1 | 2 | 3;

function deriveHostStep(options: {
  dealStatus: string | undefined;
  claimStatus: string | undefined;
  payoutStatus: string | undefined;
  visits: number;
  required: number;
}): HostStep {
  const { dealStatus, claimStatus, payoutStatus, visits, required } = options;
  if (
    claimStatus === 'declined' ||
    payoutStatus === 'paid' ||
    payoutStatus === 'failed' ||
    claimStatus === 'redemption_requested' ||
    claimStatus === 'redeemed' ||
    (dealStatus === 'active' && visits >= required)
  ) {
    return 3;
  }
  if (dealStatus === 'active') return 2;
  return 1;
}

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

  const campaignFunded =
    campaign?.status === 'simulated_funded' ||
    campaign?.status === 'live' ||
    campaign?.status === 'completed';

  const step = useMemo(
    () =>
      deriveHostStep({
        dealStatus: deal?.status,
        claimStatus: claim?.status,
        payoutStatus: payout?.status,
        visits: claim?.verifiedVisits ?? 0,
        required: claim?.requiredVisits ?? 3,
      }),
    [deal?.status, claim?.status, payout?.status, claim?.verifiedVisits, claim?.requiredVisits],
  );

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

  const w = en.wizard.host;

  if (step === 1) {
    return (
      <StepWizard
        step={1}
        total={3}
        stepTitle={w.dealTitle}
        headline={w.dealHeadline}
        body={w.dealBody}
        badge={<StatusBadge kind="deal" status={deal.status} />}
        waiting={campaignFunded ? null : en.waitingOnFunding}
        primaryLabel={campaignFunded ? en.approveDeal : undefined}
        onPrimary={campaignFunded ? () => void onApprove() : undefined}
        primaryDisabled={!campaignFunded || deal.status !== 'proposed'}
        primaryBusy={busy}
        error={error}
      >
        <p className="muted">{business?.name}</p>
        <p>
          {deal.requirement} · {deal.reward}
        </p>
        <p className="mono">Payout {deal.payoutSol} SOL on success</p>
      </StepWizard>
    );
  }

  if (step === 2) {
    const visits = claim?.verifiedVisits ?? 0;
    const required = claim?.requiredVisits ?? 3;
    return (
      <StepWizard
        step={2}
        total={3}
        stepTitle={w.visitsTitle}
        headline={w.visitsHeadline}
        body={w.visitsBody}
        primaryLabel={en.verifyVisit}
        onPrimary={() => void onVerify()}
        primaryDisabled={visits >= required}
        primaryBusy={busy}
        error={error}
      >
        <div className="stamp-row" aria-label="visit progress">
          {Array.from({ length: required }).map((_, i) => (
            <div
              key={i}
              className={`stamp ${visits > i ? 'stamp--filled' : ''}`}
            >
              {visits > i ? '✓' : i + 1}
            </div>
          ))}
        </div>
        <p>
          {visits}/{required}
        </p>
      </StepWizard>
    );
  }

  const declined = claim?.status === 'declined';
  const paid = payout?.status === 'paid';

  return (
    <StepWizard
      step={3}
      total={3}
      stepTitle={w.earningsTitle}
      headline={
        paid
          ? w.earningsPaidHeadline
          : declined
            ? w.earningsDeclinedHeadline
            : w.earningsWaitingHeadline
      }
      body={
        paid
          ? w.earningsPaidBody
          : declined
            ? w.earningsDeclinedBody
            : w.earningsWaitingBody
      }
      badge={
        payout ? <StatusBadge kind="payout" status={payout.status} /> : null
      }
      waiting={
        !paid && !declined ? en.waitingOnCustomer : null
      }
    >
      {paid ? <TransactionReceipt transaction={payoutTx} /> : null}
    </StepWizard>
  );
}
