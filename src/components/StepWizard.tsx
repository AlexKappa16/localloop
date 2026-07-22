import type { ReactNode } from 'react';

type Props = {
  step: number;
  total: number;
  stepTitle: string;
  headline: string;
  body: string;
  badge?: ReactNode;
  children?: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryBusy?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
  waiting?: string | null;
  error?: string | null;
  success?: string | null;
};

export function StepWizard({
  step,
  total,
  stepTitle,
  headline,
  body,
  badge,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryBusy,
  secondaryLabel,
  onSecondary,
  secondaryDisabled,
  waiting,
  error,
  success,
}: Props) {
  return (
    <div className="wizard stack">
      <p className="wizard__meta mono muted">
        Step {step} of {total} · {stepTitle}
      </p>
      <div className="panel stack wizard__panel">
        {badge}
        <h2>{headline}</h2>
        <p>{body}</p>
        {children}
        {waiting ? <p className="muted">{waiting}</p> : null}
        {success ? <p className="success">{success}</p> : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {(primaryLabel && onPrimary) || (secondaryLabel && onSecondary) ? (
          <div className="wizard__actions">
            {primaryLabel && onPrimary ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={primaryDisabled || primaryBusy}
                onClick={onPrimary}
              >
                {primaryBusy ? 'Working…' : primaryLabel}
              </button>
            ) : null}
            {secondaryLabel && onSecondary ? (
              <button
                type="button"
                className="btn"
                disabled={secondaryDisabled || primaryBusy}
                onClick={onSecondary}
              >
                {secondaryLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
