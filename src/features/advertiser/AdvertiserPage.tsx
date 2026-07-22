import { useMemo, useState } from 'react';
import { StepWizard } from '../../components/StepWizard';
import { FundingAuthorizationPanel } from '../../components/FundingAuthorizationPanel';
import { TransactionReceipt } from '../../components/TransactionReceipt';
import { StatusBadge } from '../../components/StatusBadge';
import { useDemoState } from '../../app/DemoStateProvider';
import { en } from '../../copy/en';
import { ids } from '../../../shared/ids';
import { ApiClientError } from '../../lib/api';

type Props = { businessId: string };

type AdvStep = 1 | 2 | 3 | 4 | 5;

function deriveStep(options: {
  campaignStatus: string;
  dealStatus: string | undefined;
  claimStatus: string | undefined;
  payoutStatus: string | undefined;
  localPastIntro: boolean;
}): AdvStep {
  const { campaignStatus, dealStatus, claimStatus, payoutStatus, localPastIntro } =
    options;

  if (claimStatus === 'declined') return 5;
  if (payoutStatus === 'paid' || payoutStatus === 'failed') return 5;
  if (claimStatus === 'redemption_requested' || claimStatus === 'redeemed') {
    return 4;
  }
  if (dealStatus === 'active' || campaignStatus === 'live') return 4;
  if (
    campaignStatus === 'simulated_funded' ||
    campaignStatus === 'live' ||
    campaignStatus === 'completed'
  ) {
    return 3;
  }
  if (localPastIntro || campaignStatus !== 'draft') return 2;
  return 1;
}

export function AdvertiserPage({ businessId }: Props) {
  const { state, validateClaimMutation } = useDemoState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPastIntro, setLocalPastIntro] = useState(false);

  const business = state.businesses.find((item) => item.id === businessId);
  const campaign = state.campaigns.find(
    (item) => item.advertiserBusinessId === businessId,
  );
  const camoraDeal = state.deals.find((d) => d.id === ids.camoraDeal);
  const claim = state.claims.find((c) => c.campaignId === campaign?.id);
  const payout = state.payouts.find((p) => p.claimId === claim?.id);
  const fundingTx = state.transactions.find((tx) => tx.type === 'funding_proof');
  const payoutTx = state.transactions.find((tx) => tx.type === 'host_payout');

  const step = useMemo(
    () =>
      deriveStep({
        campaignStatus: campaign?.status ?? 'draft',
        dealStatus: camoraDeal?.status,
        claimStatus: claim?.status,
        payoutStatus: payout?.status,
        localPastIntro,
      }),
    [
      campaign?.status,
      camoraDeal?.status,
      claim?.status,
      payout?.status,
      localPastIntro,
    ],
  );

  if (!campaign) {
    return (
      <div className="panel stack">
        <p className="muted">
          {businessId === ids.camora ? en.hostEmptyAdvertiser : en.emptyState}
        </p>
      </div>
    );
  }

  async function onValidate() {
    if (!claim) return;
    setBusy(true);
    setError(null);
    try {
      await validateClaimMutation(claim.id);
    } catch (err) {
      setError(
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

  const w = en.wizard.advertiser;

  if (step === 1) {
    return (
      <StepWizard
        step={1}
        total={5}
        stepTitle={w.campaignTitle}
        headline={w.campaignHeadline}
        body={w.campaignBody}
        badge={<StatusBadge kind="campaign" status={campaign.status} />}
        primaryLabel={en.continue}
        onPrimary={() => setLocalPastIntro(true)}
      >
        <p className="mono">
          {en.fundingLabel}: {campaign.budget.totalSol} SOL
        </p>
        <p className="muted">{business?.name}</p>
      </StepWizard>
    );
  }

  if (step === 2) {
    return (
      <StepWizard
        step={2}
        total={5}
        stepTitle={w.fundTitle}
        headline={w.fundHeadline}
        body={w.fundBody}
      >
        <FundingAuthorizationPanel campaignId={campaign.id} />
      </StepWizard>
    );
  }

  if (step === 3) {
    return (
      <StepWizard
        step={3}
        total={5}
        stepTitle={w.hostsTitle}
        headline={w.hostsHeadline}
        body={w.hostsBody}
        badge={
          camoraDeal ? (
            <StatusBadge kind="deal" status={camoraDeal.status} />
          ) : null
        }
        waiting={
          camoraDeal?.status !== 'active' ? en.waitingOnApproval : null
        }
      >
        <p>
          Camora · {camoraDeal?.requirement} · {camoraDeal?.payoutSol} SOL
        </p>
        <p className="muted">TSRE Gym — proposed mock partner (not in live path)</p>
        {fundingTx ? <TransactionReceipt transaction={fundingTx} /> : null}
      </StepWizard>
    );
  }

  if (step === 4) {
    const canValidate =
      claim?.status === 'redemption_requested' || payout?.status === 'failed';

    return (
      <StepWizard
        step={4}
        total={5}
        stepTitle={w.redemptionTitle}
        headline={
          canValidate ? w.redemptionHeadline : w.redemptionWaitingHeadline
        }
        body={canValidate ? w.redemptionBody : w.redemptionWaitingBody}
        badge={
          claim ? <StatusBadge kind="claim" status={claim.status} /> : null
        }
        waiting={canValidate ? null : en.waitingOnRedemption}
        primaryLabel={
          canValidate
            ? payout?.status === 'failed'
              ? en.retryPayout
              : en.validateRedemption
            : undefined
        }
        onPrimary={canValidate ? () => void onValidate() : undefined}
        primaryBusy={busy}
        error={error}
      >
        {claim ? (
          <p className="mono">
            {en.claimId}: {claim.id}
          </p>
        ) : null}
      </StepWizard>
    );
  }

  // step 5
  const declined = claim?.status === 'declined';
  return (
    <StepWizard
      step={5}
      total={5}
      stepTitle={w.settleTitle}
      headline={
        declined ? w.settleDeclinedHeadline : w.settlePaidHeadline
      }
      body={declined ? w.settleDeclinedBody : w.settlePaidBody}
      badge={
        payout ? <StatusBadge kind="payout" status={payout.status} /> : null
      }
      success={
        declined
          ? en.budgetUnchanged
          : `${en.budgetRemaining}: ${campaign.budget.remainingSol} SOL`
      }
    >
      {!declined ? <TransactionReceipt transaction={payoutTx} /> : null}
    </StepWizard>
  );
}
