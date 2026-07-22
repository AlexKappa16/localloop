import { useMemo, useState } from 'react';
import { StepWizard } from '../../components/StepWizard';
import { StatusBadge } from '../../components/StatusBadge';
import { useDemoState } from '../../app/DemoStateProvider';
import { en } from '../../copy/en';
import { ApiClientError } from '../../lib/api';

type Props = { customerId: string };

type CustStep = 1 | 2 | 3 | 4 | 5;

function deriveCustomerStep(options: {
  claimStatus: string | undefined;
  visits: number;
  required: number;
  localPastIntro: boolean;
  localPastUnlock: boolean;
}): CustStep {
  const { claimStatus, visits, required, localPastIntro, localPastUnlock } =
    options;

  if (
    claimStatus === 'declined' ||
    claimStatus === 'redemption_requested' ||
    claimStatus === 'redeemed'
  ) {
    return 5;
  }
  if (claimStatus === 'unlocked') {
    if (localPastUnlock) return 4;
    return 3;
  }
  if (visits >= required) return 3;
  if (localPastIntro) return 2;
  return 1;
}

export function CustomerPage({ customerId }: Props) {
  const {
    state,
    requestRedemptionMutation,
    declineRedemptionMutation,
  } = useDemoState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPastIntro, setLocalPastIntro] = useState(false);
  const [localPastUnlock, setLocalPastUnlock] = useState(false);

  const customer = state.customers.find((item) => item.id === customerId);
  const claim = state.claims.find((item) => item.customerId === customerId);
  const deal = state.deals.find((d) => d.id === claim?.dealId);
  const campaign = state.campaigns.find((c) => c.id === claim?.campaignId);
  const host = state.businesses.find((b) => b.id === deal?.hostBusinessId);
  const advertiser = state.businesses.find(
    (b) => b.id === campaign?.advertiserBusinessId,
  );

  const visits = claim?.verifiedVisits ?? 0;
  const required = claim?.requiredVisits ?? 3;

  const step = useMemo(
    () =>
      deriveCustomerStep({
        claimStatus: claim?.status,
        visits,
        required,
        localPastIntro,
        localPastUnlock,
      }),
    [claim?.status, visits, required, localPastIntro, localPastUnlock],
  );

  async function onUse() {
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

  async function onDecline() {
    if (!claim) return;
    setBusy(true);
    setError(null);
    try {
      await declineRedemptionMutation(claim.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : en.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const w = en.wizard.customer;

  if (step === 1) {
    return (
      <StepWizard
        step={1}
        total={5}
        stepTitle={w.dealTitle}
        headline={w.dealHeadline}
        body={w.dealBody}
        primaryLabel={en.continue}
        onPrimary={() => setLocalPastIntro(true)}
      >
        <p className="muted">{customer?.displayName ?? en.personaNino}</p>
        <p>
          {host?.name} × {advertiser?.name}
        </p>
        <p>
          {en.rewardTerms}: {deal?.reward}
        </p>
      </StepWizard>
    );
  }

  if (step === 2) {
    return (
      <StepWizard
        step={2}
        total={5}
        stepTitle={w.progressTitle}
        headline={w.progressHeadline}
        body={w.progressBody}
        badge={
          claim ? <StatusBadge kind="claim" status={claim.status} /> : null
        }
        waiting={en.waitingOnHost}
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

  if (step === 3) {
    return (
      <StepWizard
        step={3}
        total={5}
        stepTitle={w.unlockedTitle}
        headline={w.unlockedHeadline}
        body={w.unlockedBody}
        badge={<StatusBadge kind="claim" status="unlocked" />}
        primaryLabel={en.continue}
        onPrimary={() => setLocalPastUnlock(true)}
      >
        <p className="mono">
          {en.claimId}: {claim?.id}
        </p>
        <p>{deal?.reward}</p>
      </StepWizard>
    );
  }

  if (step === 4) {
    return (
      <StepWizard
        step={4}
        total={5}
        stepTitle={w.chooseTitle}
        headline={w.chooseHeadline}
        body={w.chooseBody}
        primaryLabel={en.useReward}
        onPrimary={() => void onUse()}
        secondaryLabel={en.declineReward}
        onSecondary={() => void onDecline()}
        primaryBusy={busy}
        error={error}
      />
    );
  }

  const declined = claim?.status === 'declined';
  const redeemed = claim?.status === 'redeemed';

  return (
    <StepWizard
      step={5}
      total={5}
      stepTitle={w.doneTitle}
      headline={
        declined
          ? w.doneDeclinedHeadline
          : redeemed
            ? w.doneRedeemedHeadline
            : w.doneUsedHeadline
      }
      body={
        declined
          ? w.doneDeclinedBody
          : redeemed
            ? w.doneRedeemedBody
            : w.doneUsedBody
      }
      badge={
        claim ? <StatusBadge kind="claim" status={claim.status} /> : null
      }
      success={declined ? en.declinedDone : en.redemptionSent}
    />
  );
}
