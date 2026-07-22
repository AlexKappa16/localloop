import { useMemo, useReducer, useState, type FormEvent } from 'react';
import { ids } from '../../../shared/ids';
import { StatusBadge } from '../../components/StatusBadge';
import {
  campaignStatusLabel,
  claimStatusLabel,
  dealStatusLabel,
  en,
  payoutStatusLabel,
} from '../../copy/en';
import {
  getNextStep,
  initialPreviewState,
  previewReducer,
  type PreviewPersona,
  type PreviewReceipt,
  type PreviewState,
} from './demoPreviewState';

type PreviewScreen = 'demo' | 'business-signin' | 'create-campaign';

const personaLabels: Record<PreviewPersona, string> = {
  advertiser: en.preview.advertiserTab,
  host: en.preview.hostTab,
  customer: en.preview.customerTab,
};

const personaShortLabels: Record<PreviewPersona, string> = {
  advertiser: 'Magnolia',
  host: 'Camora',
  customer: 'Nino',
};

function MockReceipt({ receipt }: { receipt: PreviewReceipt }) {
  return (
    <article className="preview-receipt" aria-label={en.preview.receipt}>
      <div className="preview-receipt__topline">
        <span className="preview-kicker">
          {receipt.type === 'funding'
            ? en.preview.fundingProof
            : en.preview.payoutProof}
        </span>
        <span className="preview-pill preview-pill--mock">MOCK</span>
      </div>
      {receipt.amountSol ? (
        <strong className="preview-receipt__amount">
          {receipt.amountSol.toFixed(3)} SOL
        </strong>
      ) : null}
      <dl className="preview-details">
        <div>
          <dt>{en.preview.receiptReference}</dt>
          <dd className="mono">{receipt.reference}</dd>
        </div>
        <div>
          <dt>{en.preview.receiptMemo}</dt>
          <dd className="mono">{receipt.memo}</dd>
        </div>
      </dl>
      <p className="preview-fineprint">{en.preview.noExplorer}</p>
    </article>
  );
}

function BudgetStrip({ state }: { state: PreviewState }) {
  const paid = state.payoutStatus === 'paid' ? 0.005 : 0;
  const remaining = 0.05 - paid;
  const reserved =
    state.payoutStatus === 'paid'
      ? 0.045
      : state.dealStatus === 'active'
        ? 0.05
        : 0;

  return (
    <div className="preview-budget" aria-label={en.preview.simulatedBudget}>
      <div>
        <span>{en.preview.simulatedBudget}</span>
        <strong>0.050 SOL</strong>
      </div>
      <div>
        <span>{en.preview.remainingBudget}</span>
        <strong>{remaining.toFixed(3)} SOL</strong>
      </div>
      <div>
        <span>{en.preview.reservedBudget}</span>
        <strong>{reserved.toFixed(3)} SOL</strong>
      </div>
      <div>
        <span>{en.preview.paidBudget}</span>
        <strong>{paid.toFixed(3)} SOL</strong>
      </div>
    </div>
  );
}

function AdvertiserView({
  state,
  dispatch,
}: {
  state: PreviewState;
  dispatch: React.Dispatch<Parameters<typeof previewReducer>[1]>;
}) {
  return (
    <section className="preview-workspace" aria-labelledby="advertiser-title">
      <header className="preview-workspace__header">
        <div>
          <span className="preview-kicker">{en.preview.advertiserKicker}</span>
          <h2 id="advertiser-title">{en.preview.advertiserTitle}</h2>
          <p>{en.preview.advertiserBody}</p>
        </div>
        <StatusBadge kind="campaign" status={state.campaignStatus} />
      </header>

      <BudgetStrip state={state} />

      <div className="preview-two-column">
        <article className="preview-card preview-card--green">
          <div className="preview-card__heading">
            <span className="preview-kicker">{en.preview.wallet}</span>
            <span
              className={`preview-dot ${
                state.walletConnected ? 'preview-dot--on' : ''
              }`}
              aria-hidden="true"
            />
          </div>
          <h3>
            {state.walletConnected
              ? en.preview.walletConnected
              : en.preview.walletDisconnected}
          </h3>
          <p>{en.preview.signDisclosure}</p>
          {!state.walletConnected ? (
            <button
              className="preview-action preview-action--yellow"
              type="button"
              onClick={() => dispatch({ type: 'connect_wallet' })}
            >
              {en.preview.connectWallet}
            </button>
          ) : (
            <button
              className="preview-action preview-action--yellow"
              type="button"
              disabled={state.campaignStatus !== 'draft'}
              onClick={() => dispatch({ type: 'authorize_funding' })}
            >
              {state.campaignStatus === 'draft'
                ? en.preview.signFunding
                : en.preview.authorizationDone}
            </button>
          )}
        </article>

        <article className="preview-card">
          <span className="preview-kicker">{en.preview.canonicalDeal}</span>
          <div className="preview-card__title-row">
            <h3>Camora</h3>
            <StatusBadge kind="deal" status={state.dealStatus} />
          </div>
          <p>{en.preview.camoraRequirement}</p>
          <strong className="preview-reward">{en.preview.camoraRewardShort}</strong>
          <div className="preview-card__meta">
            <span>{en.preview.perRedemption}</span>
            <span>{en.preview.maxRedemptions}</span>
          </div>
          {state.claimStatus === 'redemption_requested' ? (
            <button
              className="preview-action preview-action--coral"
              type="button"
              onClick={() => dispatch({ type: 'validate_redemption' })}
            >
              {en.preview.validate}
            </button>
          ) : null}
          {state.payoutStatus === 'processing' ? (
            <button
              className="preview-action preview-action--coral"
              type="button"
              onClick={() => dispatch({ type: 'complete_payout' })}
            >
              {en.preview.completePayout}
            </button>
          ) : null}
        </article>
      </div>

      <article className="preview-card preview-card--mock">
        <div className="preview-card__title-row">
          <div>
            <span className="preview-kicker">{en.preview.partnerNetwork}</span>
            <h3>TSRE Gym</h3>
          </div>
          <span className="preview-pill preview-pill--mock">
            {en.preview.proposedMock}
          </span>
        </div>
        <p>{en.preview.tsreRequirement}</p>
        <div className="preview-card__meta">
          <span>{en.preview.tsreReward}</span>
          <span>0.007 SOL</span>
        </div>
      </article>

      {state.fundingReceipt ? <MockReceipt receipt={state.fundingReceipt} /> : null}
      {state.payoutReceipt ? <MockReceipt receipt={state.payoutReceipt} /> : null}
    </section>
  );
}

function HostView({
  state,
  dispatch,
}: {
  state: PreviewState;
  dispatch: React.Dispatch<Parameters<typeof previewReducer>[1]>;
}) {
  const canApprove =
    state.campaignStatus === 'simulated_funded' && state.dealStatus === 'proposed';
  const canVerify = state.dealStatus === 'active' && state.verifiedVisits < 3;

  return (
    <section className="preview-workspace" aria-labelledby="host-title">
      <header className="preview-workspace__header">
        <div>
          <span className="preview-kicker">{en.preview.hostKicker}</span>
          <h2 id="host-title">{en.preview.hostTitle}</h2>
          <p>{en.preview.hostBody}</p>
        </div>
        <StatusBadge kind="payout" status={state.payoutStatus} />
      </header>

      <div className="preview-two-column preview-two-column--host">
        <article className="preview-card">
          <div className="preview-card__title-row">
            <h3>{en.campaignName}</h3>
            <StatusBadge kind="deal" status={state.dealStatus} />
          </div>
          <p>{en.preview.hostDealMeta}</p>
          <button
            className="preview-action preview-action--green"
            type="button"
            disabled={!canApprove}
            onClick={() => dispatch({ type: 'approve_deal' })}
          >
            {state.dealStatus === 'proposed'
              ? en.preview.approveDeal
              : en.preview.offerApproved}
          </button>
          {!canApprove && state.campaignStatus === 'draft' ? (
            <span className="preview-disabled-hint">
              {en.preview.waitingForFunding}
            </span>
          ) : null}
        </article>

        <article className="preview-pass">
          <div className="preview-pass__copy">
            <span className="preview-kicker">{en.preview.passTitle}</span>
            <strong className="mono">{ids.claim}</strong>
            <p>{en.preview.passHint}</p>
          </div>
          <div className="preview-qr" aria-hidden="true">
            {Array.from({ length: 25 }, (_, index) => (
              <span key={index} className={index % 3 === 0 || index % 7 === 0 ? 'on' : ''} />
            ))}
          </div>
        </article>
      </div>

      <article className="preview-visit-console">
        <div>
          <span className="preview-kicker">{en.preview.progress}</span>
          <strong className="preview-visit-count">{state.verifiedVisits}/3</strong>
        </div>
        <div className="preview-stamps preview-stamps--compact">
          {[1, 2, 3].map((visit) => (
            <div
              className={`preview-stamp ${
                visit <= state.verifiedVisits ? 'preview-stamp--filled' : ''
              }`}
              key={visit}
            >
              <span>0{visit}</span>
              <small>
                {visit <= state.verifiedVisits
                  ? en.preview.visitVerified
                  : en.preview.visitPending}
              </small>
            </div>
          ))}
        </div>
        <button
          className="preview-action preview-action--coral"
          type="button"
          disabled={!canVerify}
          onClick={() => dispatch({ type: 'verify_visit' })}
        >
          {state.verifiedVisits < 3
            ? `${en.preview.verifyVisit} ${state.verifiedVisits + 1}/3`
            : en.preview.allVisitsVerified}
        </button>
      </article>

      {state.payoutReceipt ? <MockReceipt receipt={state.payoutReceipt} /> : null}
    </section>
  );
}

function CustomerView({
  state,
  dispatch,
}: {
  state: PreviewState;
  dispatch: React.Dispatch<Parameters<typeof previewReducer>[1]>;
}) {
  return (
    <section className="preview-workspace" aria-labelledby="customer-title">
      <header className="preview-workspace__header">
        <div>
          <span className="preview-kicker">{en.preview.customerKicker}</span>
          <h2 id="customer-title">{en.preview.customerTitle}</h2>
          <p>{en.preview.customerBody}</p>
        </div>
        <StatusBadge kind="claim" status={state.claimStatus} />
      </header>

      <article className="preview-customer-pass">
        <div className="preview-customer-pass__top">
          <div>
            <span className="preview-kicker">{en.preview.progress}</span>
            <strong className="preview-progress-number">
              {state.verifiedVisits}<span>/3</span>
            </strong>
          </div>
          <span className="mono">{ids.claim}</span>
        </div>
        <div className="preview-stamps">
          {[1, 2, 3].map((visit) => (
            <div
              className={`preview-stamp ${
                visit <= state.verifiedVisits ? 'preview-stamp--filled' : ''
              }`}
              key={visit}
            >
              <span>0{visit}</span>
              <small>CAMORA</small>
            </div>
          ))}
        </div>
      </article>

      <article
        className={`preview-reward-card ${
          state.claimStatus !== 'locked' ? 'preview-reward-card--open' : ''
        }`}
      >
        <span className="preview-kicker">{en.preview.reward}</span>
        <h3>{en.preview.rewardTitle}</h3>
        <p>{en.preview.rewardBody}</p>
        <strong>
          {state.claimStatus === 'locked'
            ? en.preview.lockedReward
            : en.preview.unlockedReward}
        </strong>
        <button
          className="preview-action preview-action--green"
          type="button"
          disabled={state.claimStatus !== 'unlocked'}
          onClick={() => dispatch({ type: 'request_redemption' })}
        >
          {state.claimStatus === 'redemption_requested' ||
          state.claimStatus === 'redeemed'
            ? en.preview.redemptionRequested
            : en.preview.requestReward}
        </button>
      </article>
    </section>
  );
}

function BusinessSignInForm({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: (destination: 'create' | 'view') => void;
}) {
  const copy = en.preview.businessSignIn;
  const [email, setEmail] = useState('hello@magnoliafilmlab.com');
  const [password, setPassword] = useState('localloop-demo');
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSignedIn(true);
    }, 700);
  }

  return (
    <main className="demo-preview demo-preview--signin">
      <header className="preview-hero preview-hero--compact">
        <div className="preview-hero__nav">
          <div className="preview-hero__brand">
            <a className="preview-logo" href="/demo-preview">
              LocalLoop<span>●</span>
            </a>
            <span className="preview-pill preview-pill--mock">
              {signedIn ? 'SIGNED IN · MOCK' : 'MOCK SIGN-IN'}
            </span>
          </div>
          <button className="preview-reset" type="button" onClick={onBack}>
            ← {copy.back}
          </button>
        </div>
      </header>

      {signedIn ? (
        <section
          className="preview-signin preview-signin--choices"
          aria-label={copy.signedInTitle}
        >
          <div className="preview-signin__choices" role="group">
            <button
              className="preview-choice"
              type="button"
              onClick={() => onContinue('create')}
            >
              <span>{copy.createCampaign}</span>
              <span className="preview-choice__arrow" aria-hidden="true">
                →
              </span>
            </button>
            <button
              className="preview-choice"
              type="button"
              onClick={() => onContinue('view')}
            >
              <span>{copy.viewCampaigns}</span>
              <span className="preview-choice__arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </section>
      ) : (
        <section
          className="preview-signin"
          aria-labelledby="business-signin-title"
        >
          <div className="preview-signin__card">
            <span className="preview-kicker">{copy.eyebrow}</span>
            <h1 id="business-signin-title">{copy.title}</h1>
            <p>{copy.subtitle}</p>

            <form className="preview-signin__form" onSubmit={handleSubmit}>
              <label className="preview-field">
                <span>{copy.emailLabel}</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  placeholder={copy.emailPlaceholder}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="preview-field">
                <span>{copy.passwordLabel}</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  placeholder={copy.passwordPlaceholder}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <button
                className="preview-for-business preview-for-business--block"
                type="submit"
                disabled={submitting}
              >
                {submitting ? copy.submitting : copy.submit}
              </button>
            </form>

            <p className="preview-signin__note">{copy.mockNote}</p>
          </div>
        </section>
      )}
    </main>
  );
}

function CreateCampaignScreen({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const copy = en.preview.createCampaign;
  const [campaignName, setCampaignName] = useState<string>(en.campaignName);
  const [perks, setPerks] = useState<string>(en.preview.camoraRewardShort);
  const [features, setFeatures] = useState(
    'Film development and scanning on orders over 40 ₾',
  );
  const [hostPartner, setHostPartner] = useState('Camora');
  const [visitRequirement, setVisitRequirement] = useState<string>(
    en.preview.camoraRequirement,
  );
  const [dealTerms, setDealTerms] = useState(
    `${en.preview.perRedemption} · ${en.preview.maxRedemptions}`,
  );
  const [budgetAmount, setBudgetAmount] = useState('0.05');
  const [walletConnected, setWalletConnected] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [deposited, setDeposited] = useState(false);

  const formComplete =
    campaignName.trim() &&
    perks.trim() &&
    features.trim() &&
    hostPartner.trim() &&
    visitRequirement.trim() &&
    dealTerms.trim() &&
    Number(budgetAmount) > 0;

  function handleDeposit() {
    if (!walletConnected || !formComplete || depositing || deposited) return;
    setDepositing(true);
    window.setTimeout(() => {
      setDepositing(false);
      setDeposited(true);
    }, 900);
  }

  return (
    <main className="demo-preview demo-preview--create">
      <header className="preview-hero preview-hero--compact">
        <div className="preview-hero__nav">
          <div className="preview-hero__brand">
            <a className="preview-logo" href="/demo-preview">
              LocalLoop<span>●</span>
            </a>
            <span className="preview-pill preview-pill--mock">CREATE · MOCK</span>
          </div>
          <button className="preview-reset" type="button" onClick={onBack}>
            ← {copy.back}
          </button>
        </div>
      </header>

      <section className="preview-create" aria-labelledby="create-campaign-title">
        <div className="preview-create__intro">
          <span className="preview-kicker">{copy.eyebrow}</span>
          <h1 id="create-campaign-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        {deposited ? (
          <div className="preview-create__success">
            <span className="preview-create__check" aria-hidden="true">
              ✓
            </span>
            <h2>{copy.successTitle}</h2>
            <p>{copy.successBody}</p>
            <dl className="preview-create__summary">
              <div>
                <dt>{copy.campaignName}</dt>
                <dd>{campaignName}</dd>
              </div>
              <div>
                <dt>{copy.perks}</dt>
                <dd>{perks}</dd>
              </div>
              <div>
                <dt>{copy.hostPartner}</dt>
                <dd>{hostPartner}</dd>
              </div>
              <div>
                <dt>{copy.budgetAmount}</dt>
                <dd>{Number(budgetAmount).toFixed(3)} SOL</dd>
              </div>
            </dl>
            <button
              className="preview-choice"
              type="button"
              onClick={onComplete}
            >
              <span>{copy.openWorkspace}</span>
              <span className="preview-choice__arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        ) : (
          <form
            className="preview-create__form"
            onSubmit={(event) => {
              event.preventDefault();
              handleDeposit();
            }}
          >
            <fieldset className="preview-create__section">
              <legend>{copy.sectionOffer}</legend>
              <label className="preview-field">
                <span>{copy.campaignName}</span>
                <input
                  value={campaignName}
                  placeholder={copy.campaignNamePlaceholder}
                  onChange={(event) => setCampaignName(event.target.value)}
                  required
                />
              </label>
              <label className="preview-field">
                <span>{copy.perks}</span>
                <textarea
                  rows={3}
                  value={perks}
                  placeholder={copy.perksPlaceholder}
                  onChange={(event) => setPerks(event.target.value)}
                  required
                />
              </label>
              <label className="preview-field">
                <span>{copy.features}</span>
                <textarea
                  rows={3}
                  value={features}
                  placeholder={copy.featuresPlaceholder}
                  onChange={(event) => setFeatures(event.target.value)}
                  required
                />
              </label>
            </fieldset>

            <fieldset className="preview-create__section">
              <legend>{copy.sectionDeal}</legend>
              <label className="preview-field">
                <span>{copy.hostPartner}</span>
                <input
                  value={hostPartner}
                  placeholder={copy.hostPartnerPlaceholder}
                  onChange={(event) => setHostPartner(event.target.value)}
                  required
                />
              </label>
              <label className="preview-field">
                <span>{copy.visitRequirement}</span>
                <input
                  value={visitRequirement}
                  placeholder={copy.visitRequirementPlaceholder}
                  onChange={(event) => setVisitRequirement(event.target.value)}
                  required
                />
              </label>
              <label className="preview-field">
                <span>{copy.dealTerms}</span>
                <textarea
                  rows={3}
                  value={dealTerms}
                  placeholder={copy.dealTermsPlaceholder}
                  onChange={(event) => setDealTerms(event.target.value)}
                  required
                />
              </label>
            </fieldset>

            <fieldset className="preview-create__section preview-create__section--budget">
              <legend>{copy.sectionBudget}</legend>
              <label className="preview-field">
                <span>{copy.budgetAmount}</span>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={budgetAmount}
                  onChange={(event) => setBudgetAmount(event.target.value)}
                  required
                />
              </label>

              <div className="preview-create__wallet">
                <div>
                  <span className="preview-kicker">{copy.walletLabel}</span>
                  <strong>
                    {walletConnected
                      ? copy.walletConnected
                      : copy.walletDisconnected}
                  </strong>
                </div>
                <button
                  className="preview-choice preview-choice--compact"
                  type="button"
                  disabled={walletConnected}
                  onClick={() => setWalletConnected(true)}
                >
                  <span>
                    {walletConnected ? copy.walletReady : copy.connectWallet}
                  </span>
                  {!walletConnected ? (
                    <span className="preview-choice__arrow" aria-hidden="true">
                      →
                    </span>
                  ) : null}
                </button>
              </div>

              <p className="preview-signin__note">{copy.fundingDisclosure}</p>

              {!formComplete ? (
                <p className="preview-create__hint">{copy.formRequired}</p>
              ) : null}
              {formComplete && !walletConnected ? (
                <p className="preview-create__hint">{copy.walletRequired}</p>
              ) : null}

              <button
                className="preview-choice"
                type="submit"
                disabled={!walletConnected || !formComplete || depositing}
              >
                <span>
                  {depositing
                    ? copy.depositing
                    : deposited
                      ? copy.depositDone
                      : copy.depositBudget}
                </span>
                <span className="preview-choice__arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </fieldset>
          </form>
        )}
      </section>
    </main>
  );
}

export function DemoPreviewPage() {
  const [screen, setScreen] = useState<PreviewScreen>('demo');
  const [state, dispatch] = useReducer(previewReducer, initialPreviewState);
  const nextStep = useMemo(() => getNextStep(state), [state]);
  const completed = state.payoutStatus === 'paid';

  const journeySteps = [
    state.walletConnected,
    state.campaignStatus !== 'draft',
    state.dealStatus !== 'proposed',
    state.verifiedVisits === 3,
    state.claimStatus === 'redemption_requested' || state.claimStatus === 'redeemed',
    state.claimStatus === 'redeemed',
    state.payoutStatus === 'paid',
  ];

  const journeyLabels = [
    en.preview.journey.connectWallet,
    en.preview.journey.authorizeFunding,
    en.preview.journey.camoraApproval,
    en.preview.journey.ninoVisits,
    en.preview.journey.requestReward,
    en.preview.journey.magnoliaConfirm,
    en.preview.journey.mockPayout,
  ];

  if (screen === 'business-signin') {
    return (
      <BusinessSignInForm
        onBack={() => setScreen('demo')}
        onContinue={(destination) => {
          if (destination === 'create') {
            setScreen('create-campaign');
            return;
          }
          dispatch({ type: 'switch_persona', persona: 'advertiser' });
          setScreen('demo');
        }}
      />
    );
  }

  if (screen === 'create-campaign') {
    return (
      <CreateCampaignScreen
        onBack={() => setScreen('business-signin')}
        onComplete={() => {
          dispatch({ type: 'create_campaign_complete' });
          setScreen('demo');
        }}
      />
    );
  }

  return (
    <main className="demo-preview">
      <header className="preview-hero">
        <div className="preview-hero__nav">
          <div className="preview-hero__brand">
            <a className="preview-logo" href="/">
              LocalLoop<span>●</span>
            </a>
            <span className="preview-pill preview-pill--mock">DEMO PREVIEW</span>
          </div>
          <div className="preview-hero__actions">
            <button
              className="preview-reset"
              type="button"
              onClick={() => dispatch({ type: 'reset' })}
            >
              ↺ {en.preview.reset}
            </button>
            <button
              className="preview-for-business"
              type="button"
              onClick={() => setScreen('business-signin')}
            >
              {en.preview.forBusinesses}
            </button>
          </div>
        </div>
        <div className="preview-hero__content">
          <div>
            <span className="preview-kicker">{en.preview.eyebrow}</span>
            <h1>{en.preview.title}</h1>
            <p>{en.preview.subtitle}</p>
          </div>
          <aside className="preview-disclosure">
            <strong>MOCK / NO BACKEND</strong>
            <p>{en.preview.mockDisclosure}</p>
          </aside>
        </div>
      </header>

      <section className="preview-storybar">
        <div>
          <span className="preview-kicker">{en.preview.campaign}</span>
          <h2>{en.campaignName}</h2>
          <p>{en.preview.campaignStory}</p>
        </div>
        <div className="preview-storybar__route" aria-label={en.preview.fullJourney}>
          <span>Magnolia</span><i aria-hidden="true">→</i>
          <span>Camora</span><i aria-hidden="true">→</i>
          <span>Nino</span><i aria-hidden="true">→</i>
          <span>Magnolia</span>
        </div>
      </section>

      <div className="preview-layout">
        <aside className="preview-guide">
          <span className="preview-kicker">{en.preview.guidedDemo}</span>
          <div className="preview-step-count">
            <strong>{journeySteps.filter(Boolean).length}</strong>
            <span>{en.preview.stepCount}</span>
          </div>
          <div className="preview-progress-track" aria-hidden="true">
            <span
              style={{
                width: `${(journeySteps.filter(Boolean).length / 7) * 100}%`,
              }}
            />
          </div>
          <div className="preview-next">
            <span>{en.preview.nextAction}</span>
            <strong>{nextStep.label}</strong>
            {!completed && state.activePersona !== nextStep.persona ? (
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: 'switch_persona', persona: nextStep.persona })
                }
              >
                {personaShortLabels[nextStep.persona]} →
              </button>
            ) : null}
          </div>
          <ol className="preview-journey">
            {journeyLabels.map((label, index) => (
              <li className={journeySteps[index] ? 'is-done' : ''} key={label}>
                <span>{journeySteps[index] ? '✓' : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </aside>

        <div className="preview-stage" id="preview-stage">
          <nav className="preview-personas" aria-label={en.demoMode}>
            {(['advertiser', 'host', 'customer'] as PreviewPersona[]).map(
              (persona) => (
                <button
                  className="preview-persona"
                  aria-pressed={state.activePersona === persona}
                  type="button"
                  key={persona}
                  onClick={() => dispatch({ type: 'switch_persona', persona })}
                >
                  <span className={`preview-persona__mark preview-persona__mark--${persona}`}>
                    {personaShortLabels[persona].slice(0, 1)}
                  </span>
                  {personaLabels[persona]}
                </button>
              ),
            )}
          </nav>

          {completed ? (
            <div className="preview-success">
              <span>✓</span>
              <div>
                <h2>{en.preview.successTitle}</h2>
                <p>{en.preview.successBody}</p>
              </div>
            </div>
          ) : null}

          {state.activePersona === 'advertiser' ? (
            <AdvertiserView state={state} dispatch={dispatch} />
          ) : null}
          {state.activePersona === 'host' ? (
            <HostView state={state} dispatch={dispatch} />
          ) : null}
          {state.activePersona === 'customer' ? (
            <CustomerView state={state} dispatch={dispatch} />
          ) : null}
        </div>
      </div>

      <section className="preview-activity">
        <div className="preview-activity__header">
          <div>
            <span className="preview-kicker">{en.preview.history}</span>
            <h2>{en.preview.sharedStory}</h2>
          </div>
          <div className="preview-status-row">
            <span>{campaignStatusLabel[state.campaignStatus]}</span>
            <span>{dealStatusLabel[state.dealStatus]}</span>
            <span>{claimStatusLabel[state.claimStatus]}</span>
            <span>{payoutStatusLabel[state.payoutStatus]}</span>
          </div>
        </div>
        <div className="preview-activity__list">
          {[...state.history].reverse().map((item) => (
            <article key={item.id}>
              <span>{String(item.id).padStart(2, '0')}</span>
              <div>
                <small>{personaShortLabels[item.persona]}</small>
                <strong>{item.label}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
