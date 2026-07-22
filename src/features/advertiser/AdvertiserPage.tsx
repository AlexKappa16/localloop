import { StatusBadge } from '../../components/StatusBadge';
import { TransactionReceipt } from '../../components/TransactionReceipt';
import { FundingAuthorizationPanel } from '../../components/FundingAuthorizationPanel';
import { useDemoState } from '../../app/DemoStateProvider';
import { en } from '../../copy/en';
import { ids } from '../../../shared/ids';
import { useState } from 'react';
import { ApiClientError } from '../../lib/api';

type Props = { businessId: string };

export function AdvertiserPage({ businessId }: Props) {
  const { state, validateClaimMutation } = useDemoState();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const business = state.businesses.find((item) => item.id === businessId);
  const campaign = state.campaigns.find(
    (item) => item.advertiserBusinessId === businessId,
  );
  const deals = state.deals.filter((d) => d.campaignId === campaign?.id);
  const claim = state.claims.find((c) => c.campaignId === campaign?.id);
  const payout = state.payouts.find((p) => p.claimId === claim?.id);
  const fundingTx = state.transactions.find((tx) => tx.type === 'funding_proof');
  const payoutTx = state.transactions.find((tx) => tx.type === 'host_payout');

  if (!campaign) {
    return (
      <div className="panel stack">
        <p className="muted">
          {businessId === ids.camora ? en.hostEmptyAdvertiser : en.emptyState}
        </p>
      </div>
    );
  }

  const funded =
    campaign.status === 'simulated_funded' ||
    campaign.status === 'live' ||
    campaign.status === 'completed';

  const canValidate = claim?.status === 'redemption_requested';
  const canRetryPayout = payout?.status === 'failed';

  async function onValidate() {
    if (!claim) return;
    setBusy(true);
    setActionError(null);
    try {
      await validateClaimMutation(claim.id);
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.code === 'SOLANA_NOT_READY'
            ? en.solanaNotReady
            : err.message
          : en.errorGeneric,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <h2>{business?.name ?? en.personaMagnolia}</h2>
        <p className="muted">{en.workspaceAdvertiser}</p>
        <h3>{campaign.name}</h3>
        <StatusBadge kind="campaign" status={campaign.status} />
        <p className="mono muted">{campaign.id}</p>

        <div className="budget-grid">
          <div>
            <span className="muted">{en.budgetTotal}</span>
            <strong>{campaign.budget.totalSol} SOL</strong>
          </div>
          <div>
            <span className="muted">{en.budgetReserved}</span>
            <strong>{campaign.budget.reservedSol} SOL</strong>
          </div>
          <div>
            <span className="muted">{en.budgetPaid}</span>
            <strong>{campaign.budget.paidSol} SOL</strong>
          </div>
          <div>
            <span className="muted">{en.budgetRemaining}</span>
            <strong>{campaign.budget.remainingSol} SOL</strong>
          </div>
        </div>
        <p>
          {en.fundingLabel}: {campaign.budget.label}
        </p>
      </div>

      {!funded ? (
        <FundingAuthorizationPanel campaignId={campaign.id} />
      ) : (
        <div className="panel stack">
          <p className="success">{en.fundingSuccess}</p>
          <TransactionReceipt transaction={fundingTx} />
        </div>
      )}

      <div className="panel stack">
        <h3>{en.partnerDeals}</h3>
        {deals.map((deal) => (
          <div key={deal.id} className="deal-card stack">
            <div className="switcher">
              <strong>
                {
                  state.businesses.find((b) => b.id === deal.hostBusinessId)
                    ?.name
                }
              </strong>
              <StatusBadge kind="deal" status={deal.status} />
              <span className="muted">
                {deal.mocked ? en.mockedDeal : en.workingDeal}
              </span>
            </div>
            <p>{deal.requirement}</p>
            <p>
              {en.rewardTerms}: {deal.reward}
            </p>
            <p className="mono">
              Payout {deal.payoutSol} SOL · max {deal.maxRedemptions}
            </p>
          </div>
        ))}
      </div>

      <div className="panel stack">
        <h3>{en.incomingRedemption}</h3>
        {claim ? (
          <>
            <p className="mono">
              {en.claimId}: {claim.id}
            </p>
            <StatusBadge kind="claim" status={claim.status} />
            {payout ? (
              <StatusBadge kind="payout" status={payout.status} />
            ) : null}
            {(canValidate || canRetryPayout) && (
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={() => void onValidate()}
              >
                {canRetryPayout ? en.retryPayout : en.validateRedemption}
              </button>
            )}
            {!canValidate && !canRetryPayout ? (
              <p className="muted">{en.noRedemption}</p>
            ) : null}
            {actionError ? <p className="error">{actionError}</p> : null}
            <TransactionReceipt transaction={payoutTx} />
          </>
        ) : (
          <p className="muted">{en.noRedemption}</p>
        )}
      </div>
    </div>
  );
}
