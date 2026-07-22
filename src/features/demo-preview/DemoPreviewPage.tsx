import { useMemo, useReducer } from 'react';
import { ids } from '../../../shared/ids';
import { StatusBadge } from '../../components/StatusBadge';
import {
  campaignStatusKa,
  claimStatusKa,
  dealStatusKa,
  ka,
  payoutStatusKa,
} from '../../copy/ka';
import {
  getNextStep,
  initialPreviewState,
  previewReducer,
  type PreviewPersona,
  type PreviewReceipt,
  type PreviewState,
} from './demoPreviewState';

const personaLabels: Record<PreviewPersona, string> = {
  advertiser: ka.preview.advertiserTab,
  host: ka.preview.hostTab,
  customer: ka.preview.customerTab,
};

const personaShortLabels: Record<PreviewPersona, string> = {
  advertiser: 'Magnolia',
  host: 'Camora',
  customer: 'ნინო',
};

function MockReceipt({ receipt }: { receipt: PreviewReceipt }) {
  return (
    <article className="preview-receipt" aria-label={ka.preview.receipt}>
      <div className="preview-receipt__topline">
        <span className="preview-kicker">
          {receipt.type === 'funding'
            ? ka.preview.fundingProof
            : ka.preview.payoutProof}
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
          <dt>{ka.preview.receiptReference}</dt>
          <dd className="mono">{receipt.reference}</dd>
        </div>
        <div>
          <dt>{ka.preview.receiptMemo}</dt>
          <dd className="mono">{receipt.memo}</dd>
        </div>
      </dl>
      <p className="preview-fineprint">{ka.preview.noExplorer}</p>
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
    <div className="preview-budget" aria-label={ka.preview.simulatedBudget}>
      <div>
        <span>{ka.preview.simulatedBudget}</span>
        <strong>0.050 SOL</strong>
      </div>
      <div>
        <span>{ka.preview.remainingBudget}</span>
        <strong>{remaining.toFixed(3)} SOL</strong>
      </div>
      <div>
        <span>რეზერვი</span>
        <strong>{reserved.toFixed(3)} SOL</strong>
      </div>
      <div>
        <span>{ka.preview.paidBudget}</span>
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
          <span className="preview-kicker">{ka.preview.advertiserKicker}</span>
          <h2 id="advertiser-title">{ka.preview.advertiserTitle}</h2>
          <p>{ka.preview.advertiserBody}</p>
        </div>
        <StatusBadge kind="campaign" status={state.campaignStatus} />
      </header>

      <BudgetStrip state={state} />

      <div className="preview-two-column">
        <article className="preview-card preview-card--green">
          <div className="preview-card__heading">
            <span className="preview-kicker">{ka.preview.wallet}</span>
            <span
              className={`preview-dot ${
                state.walletConnected ? 'preview-dot--on' : ''
              }`}
              aria-hidden="true"
            />
          </div>
          <h3>
            {state.walletConnected
              ? ka.preview.walletConnected
              : ka.preview.walletDisconnected}
          </h3>
          <p>{ka.preview.signDisclosure}</p>
          {!state.walletConnected ? (
            <button
              className="preview-action preview-action--yellow"
              type="button"
              onClick={() => dispatch({ type: 'connect_wallet' })}
            >
              {ka.preview.connectWallet}
            </button>
          ) : (
            <button
              className="preview-action preview-action--yellow"
              type="button"
              disabled={state.campaignStatus !== 'draft'}
              onClick={() => dispatch({ type: 'authorize_funding' })}
            >
              {state.campaignStatus === 'draft'
                ? ka.preview.signFunding
                : 'ავტორიზაცია დასრულებულია'}
            </button>
          )}
        </article>

        <article className="preview-card">
          <span className="preview-kicker">{ka.preview.canonicalDeal}</span>
          <div className="preview-card__title-row">
            <h3>Camora</h3>
            <StatusBadge kind="deal" status={state.dealStatus} />
          </div>
          <p>Camora-ში 3 დადასტურებული ვიზიტი</p>
          <strong className="preview-reward">
            10 ₾ ფასდაკლება ფირის გამჟღავნებასა და სკანირებაზე
          </strong>
          <div className="preview-card__meta">
            <span>0.005 SOL / გამოყენება</span>
            <span>მაქს. 10</span>
          </div>
          {state.claimStatus === 'redemption_requested' ? (
            <button
              className="preview-action preview-action--coral"
              type="button"
              onClick={() => dispatch({ type: 'validate_redemption' })}
            >
              {ka.preview.validate}
            </button>
          ) : null}
          {state.payoutStatus === 'processing' ? (
            <button
              className="preview-action preview-action--coral"
              type="button"
              onClick={() => dispatch({ type: 'complete_payout' })}
            >
              {ka.preview.completePayout}
            </button>
          ) : null}
        </article>
      </div>

      <article className="preview-card preview-card--mock">
        <div className="preview-card__title-row">
          <div>
            <span className="preview-kicker">{ka.preview.partnerNetwork}</span>
            <h3>TSRE Gym</h3>
          </div>
          <span className="preview-pill preview-pill--mock">
            {ka.preview.proposedMock}
          </span>
        </div>
        <p>{ka.preview.tsreRequirement}</p>
        <div className="preview-card__meta">
          <span>{ka.preview.tsreReward}</span>
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
          <span className="preview-kicker">{ka.preview.hostKicker}</span>
          <h2 id="host-title">{ka.preview.hostTitle}</h2>
          <p>{ka.preview.hostBody}</p>
        </div>
        <StatusBadge kind="payout" status={state.payoutStatus} />
      </header>

      <div className="preview-two-column preview-two-column--host">
        <article className="preview-card">
          <div className="preview-card__title-row">
            <h3>„გაამჟღავნე ღამე“</h3>
            <StatusBadge kind="deal" status={state.dealStatus} />
          </div>
          <p>Magnolia Film Lab · 0.005 SOL თითო გამოყენებაზე</p>
          <button
            className="preview-action preview-action--green"
            type="button"
            disabled={!canApprove}
            onClick={() => dispatch({ type: 'approve_deal' })}
          >
            {state.dealStatus === 'proposed'
              ? ka.preview.approveDeal
              : 'შეთავაზება დამტკიცებულია'}
          </button>
          {!canApprove && state.campaignStatus === 'draft' ? (
            <span className="preview-disabled-hint">
              ჯერ Magnolia-ს სიმულირებულ დაფინანსებას ელოდება
            </span>
          ) : null}
        </article>

        <article className="preview-pass">
          <div className="preview-pass__copy">
            <span className="preview-kicker">{ka.preview.passTitle}</span>
            <strong className="mono">{ids.claim}</strong>
            <p>{ka.preview.passHint}</p>
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
          <span className="preview-kicker">{ka.preview.progress}</span>
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
                  ? ka.preview.visitVerified
                  : ka.preview.visitPending}
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
            ? `${ka.preview.verifyVisit} ${state.verifiedVisits + 1}/3`
            : 'სამივე ვიზიტი დადასტურებულია'}
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
          <span className="preview-kicker">{ka.preview.customerKicker}</span>
          <h2 id="customer-title">{ka.preview.customerTitle}</h2>
          <p>{ka.preview.customerBody}</p>
        </div>
        <StatusBadge kind="claim" status={state.claimStatus} />
      </header>

      <article className="preview-customer-pass">
        <div className="preview-customer-pass__top">
          <div>
            <span className="preview-kicker">{ka.preview.progress}</span>
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
        <span className="preview-kicker">{ka.preview.reward}</span>
        <h3>10 ₾ ფასდაკლება</h3>
        <p>
          40 ₾-ზე მეტი ღირებულების ფირის გამჟღავნებასა და სკანირებაზე Magnolia
          Film Lab-ში.
        </p>
        <strong>
          {state.claimStatus === 'locked'
            ? ka.preview.lockedReward
            : ka.preview.unlockedReward}
        </strong>
        <button
          className="preview-action preview-action--green"
          type="button"
          disabled={state.claimStatus !== 'unlocked'}
          onClick={() => dispatch({ type: 'request_redemption' })}
        >
          {state.claimStatus === 'redemption_requested' ||
          state.claimStatus === 'redeemed'
            ? 'გამოყენება მოთხოვნილია'
            : ka.preview.requestReward}
        </button>
      </article>
    </section>
  );
}

export function DemoPreviewPage() {
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

  return (
    <main className="demo-preview">
      <header className="preview-hero">
        <div className="preview-hero__nav">
          <a className="preview-logo" href="/">
            LocalLoop<span>●</span>
          </a>
          <span className="preview-pill preview-pill--mock">DEMO PREVIEW</span>
          <button
            className="preview-reset"
            type="button"
            onClick={() => dispatch({ type: 'reset' })}
          >
            ↺ {ka.preview.reset}
          </button>
        </div>
        <div className="preview-hero__content">
          <div>
            <span className="preview-kicker">{ka.preview.eyebrow}</span>
            <h1>{ka.preview.title}</h1>
            <p>{ka.preview.subtitle}</p>
          </div>
          <aside className="preview-disclosure">
            <strong>MOCK / NO BACKEND</strong>
            <p>{ka.preview.mockDisclosure}</p>
          </aside>
        </div>
      </header>

      <section className="preview-storybar">
        <div>
          <span className="preview-kicker">{ka.preview.campaign}</span>
          <h2>„გაამჟღავნე ღამე“</h2>
          <p>{ka.preview.campaignStory}</p>
        </div>
        <div className="preview-storybar__route" aria-label={ka.preview.fullJourney}>
          <span>Magnolia</span><i aria-hidden="true">→</i>
          <span>Camora</span><i aria-hidden="true">→</i>
          <span>ნინო</span><i aria-hidden="true">→</i>
          <span>Magnolia</span>
        </div>
      </section>

      <div className="preview-layout">
        <aside className="preview-guide">
          <span className="preview-kicker">{ka.preview.guidedDemo}</span>
          <div className="preview-step-count">
            <strong>{journeySteps.filter(Boolean).length}</strong>
            <span>/ 7 ნაბიჯი</span>
          </div>
          <div className="preview-progress-track" aria-hidden="true">
            <span
              style={{
                width: `${(journeySteps.filter(Boolean).length / 7) * 100}%`,
              }}
            />
          </div>
          <div className="preview-next">
            <span>{ka.preview.nextAction}</span>
            <strong>{nextStep.labelKa}</strong>
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
            {[
              'მოკი საფულის კავშირი',
              'დაფინანსების ავტორიზაცია',
              'Camora-ს დამტკიცება',
              'ნინოს ვიზიტები 3/3',
              'ჯილდოს მოთხოვნა',
              'Magnolia-ს დადასტურება',
              'მოკი გადახდა',
            ].map((label, index) => (
              <li className={journeySteps[index] ? 'is-done' : ''} key={label}>
                <span>{journeySteps[index] ? '✓' : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </aside>

        <div className="preview-stage">
          <nav className="preview-personas" aria-label={ka.demoMode}>
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
                <h2>{ka.preview.successTitle}</h2>
                <p>{ka.preview.successBody}</p>
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
            <span className="preview-kicker">{ka.preview.history}</span>
            <h2>ყველა ხედის საერთო ამბავი</h2>
          </div>
          <div className="preview-status-row">
            <span>{campaignStatusKa[state.campaignStatus]}</span>
            <span>{dealStatusKa[state.dealStatus]}</span>
            <span>{claimStatusKa[state.claimStatus]}</span>
            <span>{payoutStatusKa[state.payoutStatus]}</span>
          </div>
        </div>
        <div className="preview-activity__list">
          {[...state.history].reverse().map((item) => (
            <article key={item.id}>
              <span>{String(item.id).padStart(2, '0')}</span>
              <div>
                <small>{personaShortLabels[item.persona]}</small>
                <strong>{item.labelKa}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
