import { useMemo, useReducer, useState, type ChangeEvent, type FormEvent } from 'react';
import { ids } from '../../../shared/ids';
import { StatusBadge } from '../../components/StatusBadge';
import {
  campaignStatusLabel,
  claimStatusLabel,
  dealStatusLabel,
  en,
  payoutStatusLabel,
} from '../../copy/en';
import camoraLogo from '../../assets/camora-logo.png';
import magnoliaLogo from '../../assets/offers/offer-magnolia.png';
import fabrikaLogo from '../../assets/offers/offer-fabrika.png';
import bookNookLogo from '../../assets/offers/offer-booknook.png';
import doughLabLogo from '../../assets/offers/offer-doughlab.png';
import pulseGymLogo from '../../assets/offers/offer-pulsegym.png';
import citrusLogo from '../../assets/offers/offer-citrus.png';
import {
  getNextStep,
  initialPreviewState,
  previewReducer,
  type PreviewPersona,
  type PreviewReceipt,
  type PreviewState,
} from './demoPreviewState';
import {
  deleteCampaign,
  loadSavedCampaigns,
  saveCampaign,
  type SavedPreviewCampaign,
} from './previewCampaignStorage';

type PreviewScreen =
  | 'demo'
  | 'business-signin'
  | 'create-campaign'
  | 'advertiser-profile'
  | 'customer-offers'
  | 'host-campaigns';

type AdvertiserProfileTab =
  | 'overview'
  | 'campaigns'
  | 'redemptions'
  | 'profile';

type CustomerOffer = {
  id: string;
  campaignName: string;
  advertiserName: string;
  hostPartner: string;
  perks: string;
  features: string;
  requirements: string;
  dealTerms: string;
  requiredVisits: number;
  logoDataUrl: string | null;
  partnerLogoUrl: string | null;
  accent: string;
  source: 'seeded' | 'saved' | 'fake';
};

type HostCampaign = CustomerOffer & {
  initialDealStatus: 'proposed' | 'active';
};

type PartnerOption = {
  id: string;
  name: string;
  logoUrl: string;
};

const PARTNER_OPTIONS: PartnerOption[] = [
  {
    id: ids.camora,
    name: 'Camora',
    logoUrl: camoraLogo,
  },
];

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
  campaign,
  waitingForFundingHint,
}: {
  state: PreviewState;
  dispatch: React.Dispatch<Parameters<typeof previewReducer>[1]>;
  campaign?: Pick<
    HostCampaign,
    | 'campaignName'
    | 'advertiserName'
    | 'dealTerms'
    | 'requiredVisits'
    | 'features'
  >;
  waitingForFundingHint?: string;
}) {
  const requiredVisits = campaign?.requiredVisits ?? 3;
  const canApprove =
    state.campaignStatus === 'simulated_funded' && state.dealStatus === 'proposed';
  const canVerify =
    state.dealStatus === 'active' && state.verifiedVisits < requiredVisits;
  const title = campaign?.advertiserName
    ? `${campaign.advertiserName} × Camora`
    : en.preview.hostTitle;
  const body = campaign
    ? `${campaign.campaignName} — ${en.preview.hostCampaigns.detailBody}`
    : en.preview.hostBody;
  const dealMeta = campaign
    ? `${campaign.advertiserName} ${campaign.dealTerms}`
    : en.preview.hostDealMeta;
  const campaignTitle = campaign?.campaignName ?? en.campaignName;

  return (
    <section className="preview-workspace" aria-labelledby="host-title">
      <header className="preview-workspace__header">
        <div>
          <span className="preview-kicker">
            {campaign
              ? en.preview.hostCampaigns.detailEyebrow
              : en.preview.hostKicker}
          </span>
          <h2 id="host-title">{title}</h2>
          <p>{body}</p>
        </div>
        <StatusBadge kind="payout" status={state.payoutStatus} />
      </header>

      <div className="preview-two-column preview-two-column--host">
        <article className="preview-card">
          <div className="preview-card__title-row">
            <h3>{campaignTitle}</h3>
            <StatusBadge kind="deal" status={state.dealStatus} />
          </div>
          <p>{dealMeta}</p>
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
              {waitingForFundingHint ?? en.preview.waitingForFunding}
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
          <strong className="preview-visit-count">
            {state.verifiedVisits}/{requiredVisits}
          </strong>
        </div>
        <div className="preview-stamps preview-stamps--compact">
          {Array.from({ length: requiredVisits }, (_, index) => {
            const visit = index + 1;
            return (
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
            );
          })}
        </div>
        <button
          className="preview-action preview-action--coral"
          type="button"
          disabled={!canVerify}
          onClick={() => dispatch({ type: 'verify_visit' })}
        >
          {state.verifiedVisits < requiredVisits
            ? `${en.preview.verifyVisit} ${state.verifiedVisits + 1}/${requiredVisits}`
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
  offer,
}: {
  state: PreviewState;
  dispatch: React.Dispatch<Parameters<typeof previewReducer>[1]>;
  offer?: Pick<
    CustomerOffer,
    | 'advertiserName'
    | 'hostPartner'
    | 'perks'
    | 'features'
    | 'requiredVisits'
    | 'campaignName'
  >;
}) {
  const hostLabel = (offer?.hostPartner ?? 'Camora').toUpperCase();
  const requiredVisits = offer?.requiredVisits ?? 3;
  const title = offer
    ? en.preview.customerOffers.detailTitle(offer.advertiserName)
    : en.preview.customerTitle;
  const body = offer
    ? `${offer.campaignName} — ${offer.features}`
    : en.preview.customerBody;
  const rewardTitle = offer?.perks ?? en.preview.rewardTitle;
  const rewardBody = offer?.features ?? en.preview.rewardBody;

  return (
    <section className="preview-workspace" aria-labelledby="customer-title">
      <header className="preview-workspace__header">
        <div>
          <span className="preview-kicker">{en.preview.customerKicker}</span>
          <h2 id="customer-title">{title}</h2>
          <p>{body}</p>
        </div>
        <StatusBadge kind="claim" status={state.claimStatus} />
      </header>

      <article className="preview-customer-pass">
        <div className="preview-customer-pass__top">
          <div>
            <span className="preview-kicker">{en.preview.progress}</span>
            <strong className="preview-progress-number">
              {state.verifiedVisits}
              <span>/{requiredVisits}</span>
            </strong>
          </div>
          <span className="mono">{ids.claim}</span>
        </div>
        <div className="preview-stamps">
          {Array.from({ length: requiredVisits }, (_, index) => {
            const visit = index + 1;
            return (
              <div
                className={`preview-stamp ${
                  visit <= state.verifiedVisits ? 'preview-stamp--filled' : ''
                }`}
                key={visit}
              >
                <span>0{visit}</span>
                <small>{hostLabel.slice(0, 8)}</small>
              </div>
            );
          })}
        </div>
      </article>

      <article
        className={`preview-reward-card ${
          state.claimStatus !== 'locked' ? 'preview-reward-card--open' : ''
        }`}
      >
        <span className="preview-kicker">{en.preview.reward}</span>
        <h3>{rewardTitle}</h3>
        <p>{rewardBody}</p>
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
  onSignIn,
  onContinue,
}: {
  onBack: () => void;
  onSignIn: () => void;
  onContinue: (destination: 'create' | 'view') => void;
}) {
  const copy = en.preview.businessSignIn;
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('hello@magnoliafilmlab.com');
  const [password, setPassword] = useState('localloop-demo');
  const [submitting, setSubmitting] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      if (mode === 'signin') {
        onSignIn();
        return;
      }
      setSignedUp(true);
    }, 700);
  }

  function selectMode(nextMode: 'signin' | 'signup') {
    setMode(nextMode);
    setSignedUp(false);
    if (nextMode === 'signin') {
      setEmail('hello@magnoliafilmlab.com');
      setPassword('localloop-demo');
    } else {
      setEmail('');
      setPassword('');
    }
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
              {signedUp ? 'SIGNED UP MOCK' : 'BUSINESS ACCESS MOCK'}
            </span>
          </div>
          <button className="preview-reset" type="button" onClick={onBack}>
            ← {copy.back}
          </button>
        </div>
      </header>

      {signedUp ? (
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
            <div className="preview-auth-switch" role="tablist" aria-label={copy.authLabel}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => selectMode('signin')}
              >
                {copy.signInTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => selectMode('signup')}
              >
                {copy.signUpTab}
              </button>
            </div>

            <span className="preview-kicker">
              {mode === 'signin' ? copy.eyebrow : copy.signUpEyebrow}
            </span>
            <h1 id="business-signin-title">
              {mode === 'signin' ? copy.title : copy.signUpTitle}
            </h1>
            <p>
              {mode === 'signin' ? copy.subtitle : copy.signUpSubtitle}
            </p>

            <form className="preview-signin__form" onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                <label className="preview-field">
                  <span>{copy.businessNameLabel}</span>
                  <input
                    name="businessName"
                    autoComplete="organization"
                    value={businessName}
                    placeholder={copy.businessNamePlaceholder}
                    onChange={(event) => setBusinessName(event.target.value)}
                    required
                  />
                </label>
              ) : null}
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
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
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
                {submitting
                  ? mode === 'signin'
                    ? copy.submitting
                    : copy.signingUp
                  : mode === 'signin'
                    ? copy.submit
                    : copy.signUpSubmit}
              </button>
            </form>

            <p className="preview-signin__note">
              {mode === 'signin' ? copy.mockNote : copy.signUpMockNote}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function CampaignPreviewCard({
  campaignName,
  perks,
  features,
  dealTerms,
  hasDesiredPartner,
  hostPartner,
  partnerLogoUrl,
  requirements,
  budgetAmount,
  logoDataUrl,
  onLogoChange,
  onLogoRemove,
  saved,
}: {
  campaignName: string;
  perks: string;
  features: string;
  dealTerms: string;
  hasDesiredPartner: boolean;
  hostPartner: string;
  partnerLogoUrl: string | null;
  requirements: string;
  budgetAmount: string;
  logoDataUrl: string | null;
  onLogoChange?: (dataUrl: string) => void;
  onLogoRemove?: () => void;
  saved?: boolean;
}) {
  const copy = en.preview.createCampaign;
  const hasContent =
    Boolean(logoDataUrl) ||
    campaignName.trim() ||
    perks.trim() ||
    features.trim() ||
    dealTerms.trim() ||
    (hasDesiredPartner && (hostPartner.trim() || requirements.trim()));

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onLogoChange) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLogoChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <aside className="preview-create__preview" aria-label={copy.previewLabel}>
      <div className="preview-create__preview-top">
        <span className="preview-kicker">{copy.previewLabel}</span>
        {saved ? (
          <span className="preview-pill preview-pill--mock">{copy.previewSaved}</span>
        ) : null}
      </div>

      <div className="preview-create__logo">
        <div className="preview-create__logo-pair">
          <div className="preview-create__logo-frame" title={copy.logoLabel}>
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="" />
            ) : (
              <span aria-hidden="true">◎</span>
            )}
          </div>
          {hasDesiredPartner && partnerLogoUrl ? (
            <>
              <span className="preview-create__logo-x" aria-hidden="true">
                ×
              </span>
              <div
                className="preview-create__logo-frame preview-create__logo-frame--partner"
                title={hostPartner || copy.previewPartner}
              >
                <img src={partnerLogoUrl} alt="" />
              </div>
            </>
          ) : null}
        </div>
        {onLogoChange ? (
          <div className="preview-create__logo-actions">
            <label className="preview-create__logo-upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
              />
              {logoDataUrl ? copy.logoChange : copy.logoUpload}
            </label>
            {logoDataUrl && onLogoRemove ? (
              <button
                className="preview-create__logo-remove"
                type="button"
                onClick={onLogoRemove}
              >
                {copy.logoRemove}
              </button>
            ) : null}
            <p>{copy.logoHint}</p>
          </div>
        ) : null}
      </div>

      {hasContent ? (
        <>
          <h3>{campaignName.trim() || copy.campaignNamePlaceholder}</h3>
          {perks.trim() ? <p className="preview-create__preview-perk">{perks}</p> : null}
          {features.trim() ? <p>{features}</p> : null}
          <dl className="preview-create__summary">
            <div>
              <dt>{copy.dealTerms}</dt>
              <dd>{dealTerms.trim() || '—'}</dd>
            </div>
            <div>
              <dt>{copy.previewPartner}</dt>
              <dd>
                {hasDesiredPartner && hostPartner.trim()
                  ? `${hostPartner}${
                      requirements.trim() ? ` — ${requirements.trim()}` : ''
                    }`
                  : copy.previewNoPartner}
              </dd>
            </div>
            <div>
              <dt>{copy.previewBudget}</dt>
              <dd>
                {Number(budgetAmount) > 0
                  ? `${Number(budgetAmount).toFixed(3)} SOL`
                  : '—'}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="preview-create__preview-empty">{copy.previewEmpty}</p>
      )}
    </aside>
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
  const [hostPartner, setHostPartner] = useState('');
  const [partnerLogoUrl, setPartnerLogoUrl] = useState<string | null>(null);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [requirements, setRequirements] = useState<string>(
    en.preview.camoraRequirement,
  );
  const [hasDesiredPartner, setHasDesiredPartner] = useState(false);
  const [dealTerms, setDealTerms] = useState(
    `${en.preview.perRedemption} ${en.preview.maxRedemptions}`,
  );
  const [budgetAmount, setBudgetAmount] = useState('0.05');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [deposited, setDeposited] = useState(false);
  const [savedCampaign, setSavedCampaign] =
    useState<SavedPreviewCampaign | null>(null);

  const partnerResults = useMemo(() => {
    const query = partnerSearch.trim().toLowerCase();
    if (!query) return PARTNER_OPTIONS;
    return PARTNER_OPTIONS.filter((partner) =>
      partner.name.toLowerCase().includes(query),
    );
  }, [partnerSearch]);

  const formComplete =
    campaignName.trim() &&
    perks.trim() &&
    features.trim() &&
    dealTerms.trim() &&
    Number(budgetAmount) > 0 &&
    (!hasDesiredPartner ||
      (hostPartner.trim() !== '' && requirements.trim() !== ''));

  function clearPartnerSelection() {
    setHasDesiredPartner(false);
    setHostPartner('');
    setPartnerLogoUrl(null);
    setPartnerSearch('');
  }

  function selectPartner(partner: PartnerOption) {
    setHostPartner(partner.name);
    setPartnerLogoUrl(partner.logoUrl);
    setPartnerSearch('');
  }

  function handleDeposit() {
    if (!walletConnected || !formComplete || depositing || deposited) return;
    setDepositing(true);
    window.setTimeout(() => {
      const saved = saveCampaign({
        campaignName: campaignName.trim(),
        perks: perks.trim(),
        features: features.trim(),
        dealTerms: dealTerms.trim(),
        hasDesiredPartner,
        hostPartner: hasDesiredPartner ? hostPartner.trim() : '',
        requirements: hasDesiredPartner ? requirements.trim() : '',
        budgetSol: Number(budgetAmount),
        walletConnected: true,
        logoDataUrl,
        partnerLogoUrl: hasDesiredPartner ? partnerLogoUrl : null,
      });
      setSavedCampaign(saved);
      setDepositing(false);
      setDeposited(true);
      onComplete();
    }, 900);
  }

  const previewProps = {
    campaignName,
    perks,
    features,
    dealTerms,
    hasDesiredPartner,
    hostPartner,
    partnerLogoUrl,
    requirements,
    budgetAmount,
    logoDataUrl,
  };

  return (
    <main className="demo-preview demo-preview--create">
      <header className="preview-hero preview-hero--compact">
        <div className="preview-hero__nav">
          <div className="preview-hero__brand">
            <a className="preview-logo" href="/demo-preview">
              LocalLoop<span>●</span>
            </a>
            <span className="preview-pill preview-pill--mock">CREATE MOCK</span>
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

        {deposited ? null : (
          <form
            className="preview-create__form"
            onSubmit={(event) => {
              event.preventDefault();
              handleDeposit();
            }}
          >
            <div className="preview-create__fields">
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
                  <span>{copy.dealTerms}</span>
                  <textarea
                    rows={3}
                    value={dealTerms}
                    placeholder={copy.dealTermsPlaceholder}
                    onChange={(event) => setDealTerms(event.target.value)}
                    required
                  />
                </label>

                {hasDesiredPartner ? (
                  <div className="preview-create__partner">
                    <div className="preview-create__partner-bar">
                      <span className="preview-kicker">{copy.hostPartner}</span>
                      <button
                        className="preview-create__partner-remove"
                        type="button"
                        onClick={clearPartnerSelection}
                      >
                        {copy.removePartner}
                      </button>
                    </div>

                    {hostPartner ? (
                      <div className="preview-create__partner-selected">
                        {partnerLogoUrl ? (
                          <img src={partnerLogoUrl} alt="" />
                        ) : null}
                        <div>
                          <span className="preview-kicker">
                            {copy.partnerSelected}
                          </span>
                          <strong>{hostPartner}</strong>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="preview-field">
                          <span>{copy.partnerSearch}</span>
                          <input
                            type="search"
                            value={partnerSearch}
                            placeholder={copy.partnerSearchPlaceholder}
                            onChange={(event) =>
                              setPartnerSearch(event.target.value)
                            }
                            autoComplete="off"
                          />
                        </label>
                        <ul className="preview-create__partner-results">
                          {partnerResults.length === 0 ? (
                            <li className="preview-create__partner-empty">
                              {copy.partnerNoResults}
                            </li>
                          ) : (
                            partnerResults.map((partner) => (
                              <li key={partner.id}>
                                <button
                                  className="preview-create__partner-option"
                                  type="button"
                                  onClick={() => selectPartner(partner)}
                                >
                                  <img src={partner.logoUrl} alt="" />
                                  <span>{partner.name}</span>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      </>
                    )}

                    {hostPartner ? (
                      <label className="preview-field">
                        <span>{copy.requirements}</span>
                        <input
                          value={requirements}
                          placeholder={copy.requirementsPlaceholder}
                          onChange={(event) =>
                            setRequirements(event.target.value)
                          }
                          required
                        />
                      </label>
                    ) : null}
                  </div>
                ) : (
                  <button
                    className="preview-create__add-partner"
                    type="button"
                    onClick={() => setHasDesiredPartner(true)}
                  >
                    <span
                      className="preview-create__add-partner-icon"
                      aria-hidden="true"
                    >
                      +
                    </span>
                    {copy.addDesiredPartner}
                  </button>
                )}
              </fieldset>

              <CampaignPreviewCard
                {...previewProps}
                saved={Boolean(savedCampaign)}
                onLogoChange={setLogoDataUrl}
                onLogoRemove={() => setLogoDataUrl(null)}
              />
            </div>

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

function AdvertiserProfileScreen({
  onBack,
  onCreate,
  state,
  dispatch,
}: {
  onBack: () => void;
  onCreate: () => void;
  state: PreviewState;
  dispatch: React.Dispatch<Parameters<typeof previewReducer>[1]>;
}) {
  const copy = en.preview.advertiserProfile;
  const campaignCopy = en.preview.createCampaign.myCampaigns;
  const [campaigns, setCampaigns] = useState(() => loadSavedCampaigns());
  const [activeTab, setActiveTab] =
    useState<AdvertiserProfileTab>('overview');
  const totalBudget =
    campaigns.reduce((total, campaign) => total + campaign.budgetSol, 0) +
    (state.campaignStatus === 'draft' ? 0 : 0.05);
  const walletConnected =
    state.walletConnected ||
    campaigns.some((campaign) => campaign.walletConnected);
  const pendingRedemptions =
    state.claimStatus === 'redemption_requested' ? 1 : 0;
  const paidOut = state.payoutStatus === 'paid' ? 0.005 : 0;

  const tabs: Array<{ id: AdvertiserProfileTab; label: string }> = [
    { id: 'overview', label: copy.tabs.overview },
    { id: 'campaigns', label: copy.tabs.campaigns },
    { id: 'redemptions', label: copy.tabs.redemptions },
    { id: 'profile', label: copy.tabs.profile },
  ];

  function handleDeleteCampaign(campaign: SavedPreviewCampaign) {
    if (!window.confirm(copy.deleteCampaignConfirm(campaign.campaignName))) {
      return;
    }
    setCampaigns(deleteCampaign(campaign.id));
  }

  return (
    <main className="demo-preview demo-preview--create">
      <header className="preview-hero preview-hero--compact">
        <div className="preview-hero__nav">
          <div className="preview-hero__brand">
            <a className="preview-logo" href="/demo-preview">
              LocalLoop<span>●</span>
            </a>
            <span className="preview-pill preview-pill--mock">
              ADVERTISER MOCK
            </span>
          </div>
          <button className="preview-reset" type="button" onClick={onBack}>
            ← {copy.back}
          </button>
        </div>
      </header>

      <section
        className="preview-advertiser-profile"
        aria-labelledby="advertiser-profile-title"
      >
        <div className="preview-advertiser-profile__heading">
          <div>
            <span className="preview-kicker">{copy.eyebrow}</span>
            <h1 id="advertiser-profile-title">{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
          <button className="preview-choice" type="button" onClick={onCreate}>
            <span>{copy.createCampaign}</span>
            <span className="preview-choice__arrow" aria-hidden="true">
              +
            </span>
          </button>
        </div>

        <nav className="preview-profile-tabs" aria-label={copy.tabsLabel}>
          {tabs.map((tab) => (
            <button
              className="preview-profile-tab"
              type="button"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              key={tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' ? (
          <div className="preview-profile-panel">
            <div className="preview-profile-stats">
              <article>
                <span>{copy.stats.campaigns}</span>
                <strong>{campaigns.length + 1}</strong>
              </article>
              <article>
                <span>{copy.stats.totalBudget}</span>
                <strong>{totalBudget.toFixed(3)} SOL</strong>
              </article>
              <article>
                <span>{copy.stats.pendingRedemptions}</span>
                <strong>{pendingRedemptions}</strong>
              </article>
              <article>
                <span>{copy.stats.paidOut}</span>
                <strong>{paidOut.toFixed(3)} SOL</strong>
              </article>
            </div>
            <article className="preview-profile-callout">
              <span className="preview-kicker">{copy.overview.liveCampaignTitle}</span>
              <h2>{en.campaignName}</h2>
              <p>{copy.overview.liveCampaignBody}</p>
            </article>
            <AdvertiserView state={state} dispatch={dispatch} />
          </div>
        ) : null}

        {activeTab === 'campaigns' ? (
          <div className="preview-profile-panel">
            <div className="preview-profile-panel__heading">
              <div>
                <h2>{campaignCopy.title}</h2>
                <p>{campaignCopy.subtitle}</p>
              </div>
            </div>
            {campaigns.length === 0 ? (
              <div className="preview-campaigns__empty">
                <p>{campaignCopy.empty}</p>
                <button
                  className="preview-choice"
                  type="button"
                  onClick={onCreate}
                >
                  <span>{campaignCopy.createNew}</span>
                  <span className="preview-choice__arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              </div>
            ) : (
              <ul className="preview-campaigns">
                {campaigns.map((campaign) => (
                  <li key={campaign.id} className="preview-campaigns__item">
                    <div className="preview-create__logo-pair">
                      <div className="preview-create__logo-frame">
                        {campaign.logoDataUrl ? (
                          <img src={campaign.logoDataUrl} alt="" />
                        ) : (
                          <span aria-hidden="true">◎</span>
                        )}
                      </div>
                      {campaign.hasDesiredPartner && campaign.partnerLogoUrl ? (
                        <>
                          <span
                            className="preview-create__logo-x"
                            aria-hidden="true"
                          >
                            ×
                          </span>
                          <div className="preview-create__logo-frame preview-create__logo-frame--partner">
                            <img src={campaign.partnerLogoUrl} alt="" />
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className="preview-campaigns__body">
                      <div className="preview-campaigns__title-row">
                        <h3>{campaign.campaignName}</h3>
                        <div className="preview-campaigns__actions">
                          <span className="preview-pill preview-pill--mock">
                            {copy.status.simulatedFunded}
                          </span>
                          <button
                            className="preview-campaigns__delete"
                            type="button"
                            onClick={() => handleDeleteCampaign(campaign)}
                          >
                            {copy.deleteCampaign}
                          </button>
                        </div>
                      </div>
                      <p className="preview-create__preview-perk">
                        {campaign.perks}
                      </p>
                      <p>{campaign.features}</p>
                      <dl className="preview-create__summary">
                        <div>
                          <dt>{campaignCopy.deal}</dt>
                          <dd>{campaign.dealTerms}</dd>
                        </div>
                        <div>
                          <dt>{campaignCopy.partner}</dt>
                          <dd>
                            {campaign.hasDesiredPartner && campaign.hostPartner
                              ? `${campaign.hostPartner}${
                                  campaign.requirements
                                    ? ` — ${campaign.requirements}`
                                    : ''
                                }`
                              : campaignCopy.noPartner}
                          </dd>
                        </div>
                        <div>
                          <dt>{campaignCopy.budget}</dt>
                          <dd>{campaign.budgetSol.toFixed(3)} SOL</dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {activeTab === 'redemptions' ? (
          <div className="preview-profile-panel">
            <div className="preview-profile-panel__heading">
              <div>
                <h2>{copy.redemptions.title}</h2>
                <p>{copy.redemptions.subtitle}</p>
              </div>
            </div>
            {state.claimStatus === 'redemption_requested' ||
            state.claimStatus === 'redeemed' ||
            state.payoutStatus === 'processing' ||
            state.payoutStatus === 'paid' ? (
              <article className="preview-card">
                <div className="preview-card__title-row">
                  <h3>{ids.claim}</h3>
                  <StatusBadge kind="claim" status={state.claimStatus} />
                </div>
                <p>{en.preview.camoraRewardShort}</p>
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
                {state.payoutReceipt ? (
                  <MockReceipt receipt={state.payoutReceipt} />
                ) : null}
              </article>
            ) : (
              <div className="preview-profile-empty">
                <span aria-hidden="true">✓</span>
                <div>
                  <h3>{copy.redemptions.emptyTitle}</h3>
                  <p>{copy.redemptions.emptyBody}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'profile' ? (
          <div className="preview-profile-panel">
            <div className="preview-profile-panel__heading">
              <div>
                <h2>{copy.profile.title}</h2>
                <p>{copy.profile.subtitle}</p>
              </div>
            </div>
            <dl className="preview-profile-details">
              <div>
                <dt>{copy.profile.businessName}</dt>
                <dd>Magnolia Film Lab</dd>
              </div>
              <div>
                <dt>{copy.profile.email}</dt>
                <dd>hello@magnoliafilmlab.com</dd>
              </div>
              <div>
                <dt>{copy.profile.capabilities}</dt>
                <dd>{copy.profile.capabilityValue}</dd>
              </div>
              <div>
                <dt>{copy.profile.wallet}</dt>
                <dd>
                  {walletConnected
                    ? copy.profile.walletConnected
                    : copy.profile.walletDisconnected}
                </dd>
              </div>
            </dl>
            <p className="preview-signin__note">{copy.profile.mockNote}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function buildCustomerOffers(): CustomerOffer[] {
  const seeded: CustomerOffer = {
    id: 'seeded-magnolia-camora',
    campaignName: en.campaignName,
    advertiserName: en.personaMagnolia,
    hostPartner: 'Camora',
    perks: en.preview.camoraRewardShort,
    features: en.preview.rewardBody,
    requirements: en.preview.camoraRequirement,
    dealTerms: `${en.preview.perRedemption} ${en.preview.maxRedemptions}`,
    requiredVisits: 3,
    logoDataUrl: magnoliaLogo,
    partnerLogoUrl: camoraLogo,
    accent: '#1f6b4a',
    source: 'seeded',
  };

  const fakeOffers: CustomerOffer[] = [
    {
      id: 'fake-fabrika-pulsegym',
      campaignName: 'Morning Loop',
      advertiserName: 'Fabrika Roast',
      hostPartner: 'Pulse Gym',
      perks: 'Free flat white after 4 gym check-ins',
      features: 'Valid on weekdays before noon at Fabrika Roast',
      requirements: '4 verified visits at Pulse Gym',
      dealTerms: '0.004 SOL per redemption Max 20',
      requiredVisits: 4,
      logoDataUrl: fabrikaLogo,
      partnerLogoUrl: pulseGymLogo,
      accent: '#d97757',
      source: 'fake',
    },
    {
      id: 'fake-doughlab-citrus',
      campaignName: 'Sweet Circuit',
      advertiserName: 'Dough Lab',
      hostPartner: 'Citrus Lane',
      perks: 'Buy one pastry, get a juice upgrade free',
      features: 'Weekend brunch window only',
      requirements: '2 verified visits at Citrus Lane',
      dealTerms: '0.003 SOL per redemption Max 15',
      requiredVisits: 2,
      logoDataUrl: doughLabLogo,
      partnerLogoUrl: citrusLogo,
      accent: '#e8a0b0',
      source: 'fake',
    },
    {
      id: 'fake-booknook-camora',
      campaignName: 'Night Readers',
      advertiserName: 'Book Nook',
      hostPartner: 'Camora',
      perks: '15% off any novel with a Camora stamp card',
      features: 'Applies to in-store purchases over 40 ₾',
      requirements: '2 verified visits at Camora',
      dealTerms: '0.002 SOL per redemption Max 25',
      requiredVisits: 2,
      logoDataUrl: bookNookLogo,
      partnerLogoUrl: camoraLogo,
      accent: '#0f766e',
      source: 'fake',
    },
  ];

  const saved = loadSavedCampaigns()
    .filter((campaign) => campaign.hasDesiredPartner && campaign.hostPartner.trim())
    .map((campaign): CustomerOffer => {
      const match = campaign.requirements.match(/(\d+)/);
      return {
        id: campaign.id,
        campaignName: campaign.campaignName,
        advertiserName: en.personaMagnolia,
        hostPartner: campaign.hostPartner,
        perks: campaign.perks,
        features: campaign.features,
        requirements: campaign.requirements,
        dealTerms: campaign.dealTerms,
        requiredVisits: match ? Number(match[1]) : 3,
        logoDataUrl: campaign.logoDataUrl ?? magnoliaLogo,
        partnerLogoUrl: campaign.partnerLogoUrl ?? camoraLogo,
        accent: '#f0c94d',
        source: 'saved',
      };
    });

  const hasMatchingSaved = saved.some(
    (offer) =>
      offer.campaignName === seeded.campaignName &&
      offer.hostPartner.toLowerCase() === 'camora',
  );

  return hasMatchingSaved
    ? [...saved, ...fakeOffers]
    : [seeded, ...saved, ...fakeOffers];
}

type LocalOfferProgress = {
  verifiedVisits: number;
  claimStatus: PreviewState['claimStatus'];
};

function CustomerOfferPass({
  offer,
  progress,
  onSimulateVisit,
  onRequestRedemption,
}: {
  offer: CustomerOffer;
  progress: LocalOfferProgress;
  onSimulateVisit?: () => void;
  onRequestRedemption: () => void;
}) {
  const copy = en.preview.customerOffers;
  const hostLabel = offer.hostPartner.toUpperCase();

  return (
    <section className="preview-workspace" aria-labelledby="offer-pass-title">
      <header className="preview-workspace__header">
        <div>
          <span className="preview-kicker">{copy.detailEyebrow}</span>
          <h2 id="offer-pass-title">{copy.detailTitle(offer.advertiserName)}</h2>
          <p>
            {offer.campaignName} — {copy.detailBody}
          </p>
        </div>
        <StatusBadge kind="claim" status={progress.claimStatus} />
      </header>

      <div className="preview-offer-detail__logos">
        <div className="preview-offers__logo preview-offers__logo--lg">
          {offer.logoDataUrl ? (
            <img src={offer.logoDataUrl} alt="" />
          ) : (
            <span>{offer.advertiserName.slice(0, 1)}</span>
          )}
        </div>
        {offer.partnerLogoUrl ? (
          <>
            <span className="preview-create__logo-x" aria-hidden="true">
              ×
            </span>
            <div className="preview-offers__logo preview-offers__logo--md">
              <img src={offer.partnerLogoUrl} alt="" />
            </div>
          </>
        ) : null}
      </div>

      <article className="preview-customer-pass">
        <div className="preview-customer-pass__top">
          <div>
            <span className="preview-kicker">{en.preview.progress}</span>
            <strong className="preview-progress-number">
              {progress.verifiedVisits}
              <span>/{offer.requiredVisits}</span>
            </strong>
          </div>
          <span className="mono">{offer.id.slice(0, 12)}</span>
        </div>
        <div className="preview-stamps">
          {Array.from({ length: offer.requiredVisits }, (_, index) => {
            const visit = index + 1;
            return (
              <div
                className={`preview-stamp ${
                  visit <= progress.verifiedVisits ? 'preview-stamp--filled' : ''
                }`}
                key={visit}
              >
                <span>0{visit}</span>
                <small>{hostLabel.slice(0, 8)}</small>
              </div>
            );
          })}
        </div>
      </article>

      {onSimulateVisit ? (
        <button
          className="preview-choice"
          type="button"
          disabled={progress.verifiedVisits >= offer.requiredVisits}
          onClick={onSimulateVisit}
        >
          <span>
            {progress.verifiedVisits >= offer.requiredVisits
              ? copy.allVisitsDone
              : copy.simulateVisit(offer.hostPartner)}
          </span>
          <span className="preview-choice__arrow" aria-hidden="true">
            →
          </span>
        </button>
      ) : (
        <p className="preview-signin__note">{copy.visitHint}</p>
      )}

      <article
        className={`preview-reward-card ${
          progress.claimStatus !== 'locked' ? 'preview-reward-card--open' : ''
        }`}
      >
        <span className="preview-kicker">{en.preview.reward}</span>
        <h3>{offer.perks}</h3>
        <p>{offer.features}</p>
        <strong>
          {progress.claimStatus === 'locked'
            ? en.preview.lockedReward
            : en.preview.unlockedReward}
        </strong>
        <button
          className="preview-action preview-action--green"
          type="button"
          disabled={progress.claimStatus !== 'unlocked'}
          onClick={onRequestRedemption}
        >
          {progress.claimStatus === 'redemption_requested' ||
          progress.claimStatus === 'redeemed'
            ? en.preview.redemptionRequested
            : en.preview.requestReward}
        </button>
      </article>
    </section>
  );
}

function CustomerOffersScreen({
  onBack,
  state,
  dispatch,
}: {
  onBack: () => void;
  state: PreviewState;
  dispatch: React.Dispatch<Parameters<typeof previewReducer>[1]>;
}) {
  const copy = en.preview.customerOffers;
  const offers = useMemo(() => buildCustomerOffers(), []);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [localProgress, setLocalProgress] = useState<
    Record<string, LocalOfferProgress>
  >({});

  const selectedOffer =
    offers.find((offer) => offer.id === selectedOfferId) ?? null;

  function getLocalProgress(offer: CustomerOffer): LocalOfferProgress {
    return (
      localProgress[offer.id] ?? {
        verifiedVisits: 0,
        claimStatus: 'locked',
      }
    );
  }

  function simulateLocalVisit(offer: CustomerOffer) {
    setLocalProgress((current) => {
      const existing = current[offer.id] ?? {
        verifiedVisits: 0,
        claimStatus: 'locked' as const,
      };
      if (existing.verifiedVisits >= offer.requiredVisits) return current;
      const verifiedVisits = existing.verifiedVisits + 1;
      return {
        ...current,
        [offer.id]: {
          verifiedVisits,
          claimStatus:
            verifiedVisits >= offer.requiredVisits ? 'unlocked' : 'locked',
        },
      };
    });
  }

  function requestLocalRedemption(offer: CustomerOffer) {
    setLocalProgress((current) => {
      const existing = current[offer.id] ?? {
        verifiedVisits: 0,
        claimStatus: 'locked' as const,
      };
      if (existing.claimStatus !== 'unlocked') return current;
      return {
        ...current,
        [offer.id]: {
          ...existing,
          claimStatus: 'redemption_requested',
        },
      };
    });
  }

  if (selectedOffer) {
    const isSeeded = selectedOffer.source === 'seeded';

    return (
      <main className="demo-preview demo-preview--create">
        <header className="preview-hero preview-hero--compact">
          <div className="preview-hero__nav">
            <div className="preview-hero__brand">
              <a className="preview-logo" href="/demo-preview">
                LocalLoop<span>●</span>
              </a>
              <span className="preview-pill preview-pill--mock">
                OFFER PASS
              </span>
            </div>
            <button
              className="preview-reset"
              type="button"
              onClick={() => setSelectedOfferId(null)}
            >
              ← {copy.backToOffers}
            </button>
          </div>
        </header>

        <section className="preview-customer-offers preview-customer-offers--detail">
          {isSeeded ? (
            <>
              <p className="preview-signin__note">{copy.visitHint}</p>
              <CustomerView
                state={state}
                dispatch={dispatch}
                offer={selectedOffer}
              />
            </>
          ) : (
            <CustomerOfferPass
              offer={selectedOffer}
              progress={getLocalProgress(selectedOffer)}
              onSimulateVisit={() => simulateLocalVisit(selectedOffer)}
              onRequestRedemption={() => requestLocalRedemption(selectedOffer)}
            />
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="demo-preview demo-preview--create">
      <header className="preview-hero preview-hero--compact">
        <div className="preview-hero__nav">
          <div className="preview-hero__brand">
            <a className="preview-logo" href="/demo-preview">
              LocalLoop<span>●</span>
            </a>
            <span className="preview-pill preview-pill--mock">CUSTOMER OFFERS</span>
          </div>
          <button className="preview-reset" type="button" onClick={onBack}>
            ← {copy.back}
          </button>
        </div>
      </header>

      <section
        className="preview-customer-offers"
        aria-labelledby="customer-offers-title"
      >
        <div className="preview-customer-offers__intro">
          <div>
            <span className="preview-kicker">{copy.eyebrow}</span>
            <h1 id="customer-offers-title">{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="preview-campaigns__empty">
            <p>{copy.empty}</p>
          </div>
        ) : (
          <ul className="preview-offers">
            {offers.map((offer) => (
              <li key={offer.id}>
                <button
                  className="preview-offers__card"
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'switch_persona', persona: 'customer' });
                    setSelectedOfferId(offer.id);
                  }}
                >
                  <div
                    className="preview-offers__hero"
                    style={{ backgroundColor: offer.accent }}
                  >
                    <div className="preview-offers__badges">
                      <span className="preview-offers__badge preview-offers__badge--dark">
                        {offer.source === 'seeded'
                          ? copy.seededLabel
                          : offer.source === 'saved'
                            ? copy.savedLabel
                            : copy.fakeLabel}
                      </span>
                      <span className="preview-offers__badge preview-offers__badge--light">
                        {offer.campaignName}
                      </span>
                    </div>
                    <div className="preview-offers__hero-logos">
                      <div className="preview-offers__logo preview-offers__logo--lg">
                        {offer.logoDataUrl ? (
                          <img src={offer.logoDataUrl} alt="" />
                        ) : (
                          <span>{offer.advertiserName.slice(0, 1)}</span>
                        )}
                      </div>
                      {offer.partnerLogoUrl ? (
                        <>
                          <span
                            className="preview-offers__hero-x"
                            aria-hidden="true"
                          >
                            ×
                          </span>
                          <div className="preview-offers__logo preview-offers__logo--md">
                            <img src={offer.partnerLogoUrl} alt="" />
                          </div>
                        </>
                      ) : null}
                    </div>
                    <p className="preview-offers__hero-perk">{offer.perks}</p>
                  </div>

                  <div className="preview-offers__footer">
                    <div className="preview-offers__footer-brand">
                      <div className="preview-offers__logo preview-offers__logo--sm">
                        {offer.logoDataUrl ? (
                          <img src={offer.logoDataUrl} alt="" />
                        ) : (
                          <span>{offer.advertiserName.slice(0, 1)}</span>
                        )}
                      </div>
                      <div>
                        <strong>{offer.advertiserName}</strong>
                        <span>
                          {copy.hostAt} {offer.hostPartner}
                        </span>
                      </div>
                    </div>
                    <p>{offer.requirements}</p>
                    <span className="preview-offers__open">{copy.openOffer} →</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function isCamoraHost(partner: string): boolean {
  return partner.trim().toLowerCase() === 'camora';
}

function buildHostCampaigns(state: PreviewState): HostCampaign[] {
  const seeded: HostCampaign = {
    id: 'seeded-magnolia-camora',
    campaignName: en.campaignName,
    advertiserName: en.personaMagnolia,
    hostPartner: 'Camora',
    perks: en.preview.camoraRewardShort,
    features: en.preview.rewardBody,
    requirements: en.preview.camoraRequirement,
    dealTerms: `${en.preview.perRedemption} ${en.preview.maxRedemptions}`,
    requiredVisits: 3,
    logoDataUrl: magnoliaLogo,
    partnerLogoUrl: camoraLogo,
    accent: '#1f6b4a',
    source: 'seeded',
    initialDealStatus: state.dealStatus === 'proposed' ? 'proposed' : 'active',
  };

  const fakeCampaigns: HostCampaign[] = [
    {
      id: 'host-fake-booknook',
      campaignName: 'Night Readers',
      advertiserName: 'Book Nook',
      hostPartner: 'Camora',
      perks: '15% off any novel with a Camora stamp card',
      features: 'Applies to in-store purchases over 40 ₾',
      requirements: '2 verified visits at Camora',
      dealTerms: '0.002 SOL per redemption Max 25',
      requiredVisits: 2,
      logoDataUrl: bookNookLogo,
      partnerLogoUrl: camoraLogo,
      accent: '#0f766e',
      source: 'fake',
      initialDealStatus: 'proposed',
    },
    {
      id: 'host-fake-atelier',
      campaignName: 'Darkroom Evenings',
      advertiserName: 'Atelier Print',
      hostPartner: 'Camora',
      perks: 'Free 4×6 print pack after Camora nights out',
      features: 'Valid Thu–Sat after 8pm',
      requirements: '3 verified visits at Camora',
      dealTerms: '0.004 SOL per redemption Max 12',
      requiredVisits: 3,
      logoDataUrl: doughLabLogo,
      partnerLogoUrl: camoraLogo,
      accent: '#5b4b8a',
      source: 'fake',
      initialDealStatus: 'active',
    },
  ];

  const saved = loadSavedCampaigns()
    .filter(
      (campaign) =>
        campaign.hasDesiredPartner && isCamoraHost(campaign.hostPartner),
    )
    .map((campaign): HostCampaign => {
      const match = campaign.requirements.match(/(\d+)/);
      return {
        id: campaign.id,
        campaignName: campaign.campaignName,
        advertiserName: en.personaMagnolia,
        hostPartner: campaign.hostPartner,
        perks: campaign.perks,
        features: campaign.features,
        requirements: campaign.requirements,
        dealTerms: campaign.dealTerms,
        requiredVisits: match ? Number(match[1]) : 3,
        logoDataUrl: campaign.logoDataUrl ?? magnoliaLogo,
        partnerLogoUrl: campaign.partnerLogoUrl ?? camoraLogo,
        accent: '#f0c94d',
        source: 'saved',
        initialDealStatus: 'proposed',
      };
    });

  const hasMatchingSaved = saved.some(
    (campaign) => campaign.campaignName === seeded.campaignName,
  );

  return hasMatchingSaved
    ? [...saved, ...fakeCampaigns]
    : [seeded, ...saved, ...fakeCampaigns];
}

type LocalHostProgress = {
  dealStatus: 'proposed' | 'active';
  verifiedVisits: number;
};

function HostCampaignPass({
  campaign,
  progress,
  onApprove,
  onVerifyVisit,
}: {
  campaign: HostCampaign;
  progress: LocalHostProgress;
  onApprove: () => void;
  onVerifyVisit: () => void;
}) {
  const copy = en.preview.hostCampaigns;
  const canApprove = progress.dealStatus === 'proposed';
  const canVerify =
    progress.dealStatus === 'active' &&
    progress.verifiedVisits < campaign.requiredVisits;

  return (
    <section className="preview-workspace" aria-labelledby="host-pass-title">
      <header className="preview-workspace__header">
        <div>
          <span className="preview-kicker">{copy.detailEyebrow}</span>
          <h2 id="host-pass-title">
            {campaign.advertiserName} × Camora
          </h2>
          <p>
            {campaign.campaignName} — {copy.detailBody}
          </p>
        </div>
        <StatusBadge kind="deal" status={progress.dealStatus} />
      </header>

      <div className="preview-offer-detail__logos">
        <div className="preview-offers__logo preview-offers__logo--lg">
          {campaign.logoDataUrl ? (
            <img src={campaign.logoDataUrl} alt="" />
          ) : (
            <span>{campaign.advertiserName.slice(0, 1)}</span>
          )}
        </div>
        {campaign.partnerLogoUrl ? (
          <>
            <span className="preview-create__logo-x" aria-hidden="true">
              ×
            </span>
            <div className="preview-offers__logo preview-offers__logo--md">
              <img src={campaign.partnerLogoUrl} alt="" />
            </div>
          </>
        ) : null}
      </div>

      <div className="preview-two-column preview-two-column--host">
        <article className="preview-card">
          <div className="preview-card__title-row">
            <h3>{campaign.campaignName}</h3>
            <StatusBadge kind="deal" status={progress.dealStatus} />
          </div>
          <p>
            {campaign.advertiserName} {campaign.dealTerms}
          </p>
          <button
            className="preview-action preview-action--green"
            type="button"
            disabled={!canApprove}
            onClick={onApprove}
          >
            {progress.dealStatus === 'proposed'
              ? en.preview.approveDeal
              : en.preview.offerApproved}
          </button>
        </article>

        <article className="preview-pass">
          <div className="preview-pass__copy">
            <span className="preview-kicker">{en.preview.passTitle}</span>
            <strong className="mono">{campaign.id.slice(0, 12)}</strong>
            <p>{en.preview.passHint}</p>
          </div>
          <div className="preview-qr" aria-hidden="true">
            {Array.from({ length: 25 }, (_, index) => (
              <span
                key={index}
                className={index % 3 === 0 || index % 7 === 0 ? 'on' : ''}
              />
            ))}
          </div>
        </article>
      </div>

      <article className="preview-visit-console">
        <div>
          <span className="preview-kicker">{en.preview.progress}</span>
          <strong className="preview-visit-count">
            {progress.verifiedVisits}/{campaign.requiredVisits}
          </strong>
        </div>
        <div className="preview-stamps preview-stamps--compact">
          {Array.from({ length: campaign.requiredVisits }, (_, index) => {
            const visit = index + 1;
            return (
              <div
                className={`preview-stamp ${
                  visit <= progress.verifiedVisits ? 'preview-stamp--filled' : ''
                }`}
                key={visit}
              >
                <span>0{visit}</span>
                <small>
                  {visit <= progress.verifiedVisits
                    ? en.preview.visitVerified
                    : en.preview.visitPending}
                </small>
              </div>
            );
          })}
        </div>
        <button
          className="preview-action preview-action--coral"
          type="button"
          disabled={!canVerify}
          onClick={onVerifyVisit}
        >
          {progress.verifiedVisits < campaign.requiredVisits
            ? `${en.preview.verifyVisit} ${progress.verifiedVisits + 1}/${campaign.requiredVisits}`
            : en.preview.allVisitsVerified}
        </button>
      </article>
    </section>
  );
}

function HostCampaignCard({
  campaign,
  bucket,
  onOpen,
}: {
  campaign: HostCampaign;
  bucket: 'incoming' | 'hosting';
  onOpen: () => void;
}) {
  const copy = en.preview.hostCampaigns;

  return (
    <li>
      <button className="preview-offers__card" type="button" onClick={onOpen}>
        <div
          className="preview-offers__hero"
          style={{ backgroundColor: campaign.accent }}
        >
          <div className="preview-offers__badges">
            <span className="preview-offers__badge preview-offers__badge--dark">
              {bucket === 'incoming' ? copy.proposedLabel : copy.activeLabel}
            </span>
            <span className="preview-offers__badge preview-offers__badge--light">
              {campaign.source === 'seeded'
                ? copy.seededLabel
                : campaign.source === 'saved'
                  ? copy.savedLabel
                  : copy.fakeLabel}
            </span>
          </div>
          <div className="preview-offers__hero-logos">
            <div className="preview-offers__logo preview-offers__logo--lg">
              {campaign.logoDataUrl ? (
                <img src={campaign.logoDataUrl} alt="" />
              ) : (
                <span>{campaign.advertiserName.slice(0, 1)}</span>
              )}
            </div>
            {campaign.partnerLogoUrl ? (
              <>
                <span className="preview-offers__hero-x" aria-hidden="true">
                  ×
                </span>
                <div className="preview-offers__logo preview-offers__logo--md">
                  <img src={campaign.partnerLogoUrl} alt="" />
                </div>
              </>
            ) : null}
          </div>
          <p className="preview-offers__hero-perk">{campaign.perks}</p>
        </div>

        <div className="preview-offers__footer">
          <div className="preview-offers__footer-brand">
            <div className="preview-offers__logo preview-offers__logo--sm">
              {campaign.logoDataUrl ? (
                <img src={campaign.logoDataUrl} alt="" />
              ) : (
                <span>{campaign.advertiserName.slice(0, 1)}</span>
              )}
            </div>
            <div>
              <strong>{campaign.campaignName}</strong>
              <span>
                {copy.fromAdvertiser} {campaign.advertiserName}
              </span>
            </div>
          </div>
          <p>{campaign.dealTerms}</p>
          <span className="preview-offers__open">{copy.openCampaign} →</span>
        </div>
      </button>
    </li>
  );
}

function HostCampaignsScreen({
  onBack,
  state,
  dispatch,
}: {
  onBack: () => void;
  state: PreviewState;
  dispatch: React.Dispatch<Parameters<typeof previewReducer>[1]>;
}) {
  const copy = en.preview.hostCampaigns;
  const campaigns = useMemo(() => buildHostCampaigns(state), [state.dealStatus]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<'incoming' | 'hosting'>(
    'incoming',
  );
  const [localProgress, setLocalProgress] = useState<
    Record<string, LocalHostProgress>
  >({});

  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;

  function getLocalProgress(campaign: HostCampaign): LocalHostProgress {
    return (
      localProgress[campaign.id] ?? {
        dealStatus: campaign.initialDealStatus,
        verifiedVisits: campaign.initialDealStatus === 'active' ? 1 : 0,
      }
    );
  }

  function resolveDealStatus(campaign: HostCampaign): 'proposed' | 'active' {
    if (campaign.source === 'seeded') {
      return state.dealStatus === 'proposed' ? 'proposed' : 'active';
    }
    return getLocalProgress(campaign).dealStatus;
  }

  const incoming = campaigns.filter(
    (campaign) => resolveDealStatus(campaign) === 'proposed',
  );
  const hosting = campaigns.filter(
    (campaign) => resolveDealStatus(campaign) === 'active',
  );

  const tabs = [
    {
      id: 'incoming' as const,
      label: `${copy.tabs.incoming} (${incoming.length})`,
    },
    {
      id: 'hosting' as const,
      label: `${copy.tabs.hosting} (${hosting.length})`,
    },
  ];

  const visibleCampaigns = activeTab === 'incoming' ? incoming : hosting;

  function approveLocal(campaign: HostCampaign) {
    setLocalProgress((current) => {
      const existing = current[campaign.id] ?? {
        dealStatus: campaign.initialDealStatus,
        verifiedVisits: campaign.initialDealStatus === 'active' ? 1 : 0,
      };
      if (existing.dealStatus !== 'proposed') return current;
      return {
        ...current,
        [campaign.id]: {
          ...existing,
          dealStatus: 'active',
        },
      };
    });
  }

  function verifyLocalVisit(campaign: HostCampaign) {
    setLocalProgress((current) => {
      const existing = current[campaign.id] ?? {
        dealStatus: campaign.initialDealStatus,
        verifiedVisits: campaign.initialDealStatus === 'active' ? 1 : 0,
      };
      if (
        existing.dealStatus !== 'active' ||
        existing.verifiedVisits >= campaign.requiredVisits
      ) {
        return current;
      }
      return {
        ...current,
        [campaign.id]: {
          ...existing,
          verifiedVisits: existing.verifiedVisits + 1,
        },
      };
    });
  }

  if (selectedCampaign) {
    const isSeeded = selectedCampaign.source === 'seeded';

    return (
      <main className="demo-preview demo-preview--create">
        <header className="preview-hero preview-hero--compact">
          <div className="preview-hero__nav">
            <div className="preview-hero__brand">
              <a className="preview-logo" href="/demo-preview">
                LocalLoop<span>●</span>
              </a>
              <span className="preview-pill preview-pill--mock">HOST CONSOLE</span>
            </div>
            <button
              className="preview-reset"
              type="button"
              onClick={() => {
                if (
                  selectedCampaign.source !== 'seeded' &&
                  getLocalProgress(selectedCampaign).dealStatus === 'active'
                ) {
                  setActiveTab('hosting');
                } else if (
                  selectedCampaign.source === 'seeded' &&
                  state.dealStatus !== 'proposed'
                ) {
                  setActiveTab('hosting');
                }
                setSelectedCampaignId(null);
              }}
            >
              ← {copy.backToList}
            </button>
          </div>
        </header>

        <section className="preview-host-campaigns preview-host-campaigns--detail">
          {isSeeded ? (
            <HostView
              state={state}
              dispatch={dispatch}
              campaign={selectedCampaign}
              waitingForFundingHint={copy.waitingForFunding}
            />
          ) : (
            <HostCampaignPass
              campaign={selectedCampaign}
              progress={getLocalProgress(selectedCampaign)}
              onApprove={() => approveLocal(selectedCampaign)}
              onVerifyVisit={() => verifyLocalVisit(selectedCampaign)}
            />
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="demo-preview demo-preview--create">
      <header className="preview-hero preview-hero--compact">
        <div className="preview-hero__nav">
          <div className="preview-hero__brand">
            <a className="preview-logo" href="/demo-preview">
              LocalLoop<span>●</span>
            </a>
            <span className="preview-pill preview-pill--mock">HOST CAMPAIGNS</span>
          </div>
          <button className="preview-reset" type="button" onClick={onBack}>
            ← {copy.back}
          </button>
        </div>
      </header>

      <section
        className="preview-host-campaigns"
        aria-labelledby="host-campaigns-title"
      >
        <div className="preview-host-campaigns__intro">
          <span className="preview-kicker">{copy.eyebrow}</span>
          <h1 id="host-campaigns-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        <nav className="preview-profile-tabs" aria-label={copy.tabsLabel}>
          {tabs.map((tab) => (
            <button
              className="preview-profile-tab"
              type="button"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              key={tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="preview-host-campaigns__panel">
          <div className="preview-host-campaigns__section-head">
            <h2>
              {activeTab === 'incoming'
                ? copy.incomingTitle
                : copy.hostingTitle}
            </h2>
            <p>
              {activeTab === 'incoming'
                ? copy.incomingSubtitle
                : copy.hostingSubtitle}
            </p>
          </div>

          {visibleCampaigns.length === 0 ? (
            <div className="preview-campaigns__empty">
              <p>
                {activeTab === 'incoming'
                  ? copy.incomingEmpty
                  : copy.hostingEmpty}
              </p>
            </div>
          ) : (
            <ul className="preview-offers">
              {visibleCampaigns.map((campaign) => (
                <HostCampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  bucket={activeTab}
                  onOpen={() => {
                    dispatch({ type: 'switch_persona', persona: 'host' });
                    setSelectedCampaignId(campaign.id);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
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
        onSignIn={() => setScreen('advertiser-profile')}
        onContinue={(destination) => {
          if (destination === 'create') {
            setScreen('create-campaign');
            return;
          }
          dispatch({ type: 'switch_persona', persona: 'host' });
          setScreen('host-campaigns');
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
          setScreen('advertiser-profile');
        }}
      />
    );
  }

  if (screen === 'advertiser-profile') {
    return (
      <AdvertiserProfileScreen
        onBack={() => setScreen('demo')}
        onCreate={() => setScreen('create-campaign')}
        state={state}
        dispatch={dispatch}
      />
    );
  }

  if (screen === 'customer-offers') {
    return (
      <CustomerOffersScreen
        onBack={() => setScreen('demo')}
        state={state}
        dispatch={dispatch}
      />
    );
  }

  if (screen === 'host-campaigns') {
    return (
      <HostCampaignsScreen
        onBack={() => setScreen('demo')}
        state={state}
        dispatch={dispatch}
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
              onClick={() => setScreen('customer-offers')}
            >
              {en.preview.forCustomers}
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
                onClick={() => {
                  if (nextStep.persona === 'advertiser') {
                    dispatch({ type: 'switch_persona', persona: 'advertiser' });
                    setScreen('advertiser-profile');
                    return;
                  }
                  dispatch({ type: 'switch_persona', persona: nextStep.persona });
                }}
              >
                {personaShortLabels[nextStep.persona]} →
              </button>
            ) : null}
            {!completed &&
            state.activePersona === 'advertiser' &&
            nextStep.persona === 'advertiser' ? (
              <button
                type="button"
                onClick={() => setScreen('advertiser-profile')}
              >
                {en.preview.advertiserProfile.openFromDemo.action} →
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
                  onClick={() => {
                    dispatch({ type: 'switch_persona', persona });
                    if (persona === 'advertiser') {
                      setScreen('advertiser-profile');
                    }
                  }}
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
            <section className="preview-workspace preview-workspace--handoff">
              <header className="preview-workspace__header">
                <div>
                  <span className="preview-kicker">
                    {en.preview.advertiserKicker}
                  </span>
                  <h2>{en.preview.advertiserProfile.openFromDemo.title}</h2>
                  <p>{en.preview.advertiserProfile.openFromDemo.body}</p>
                </div>
              </header>
              <button
                className="preview-choice"
                type="button"
                onClick={() => setScreen('advertiser-profile')}
              >
                <span>{en.preview.advertiserProfile.openFromDemo.action}</span>
                <span className="preview-choice__arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </section>
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
