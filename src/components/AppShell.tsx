import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { en } from '../copy/en';
import { DemoPersonaSwitcher } from './DemoPersonaSwitcher';
import { DemoResetButton } from './DemoResetButton';
import { useDemoState } from '../app/DemoStateProvider';

type AppShellProps = {
  children: ReactNode;
  title?: string;
  workspaceSwitch?: ReactNode;
};

export function AppShell({ children, title, workspaceSwitch }: AppShellProps) {
  const { state, status } = useDemoState();

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__top">
          <Link to="/" className="app-shell__brand">
            {en.brand}
          </Link>
          <div className="app-shell__tools">
            <span className="app-shell__revision mono muted">
              {en.revisionLabel} {status === 'ready' ? state.revision : '—'}
            </span>
            <DemoResetButton />
          </div>
        </div>
        <div className="app-shell__nav">
          <DemoPersonaSwitcher />
          {workspaceSwitch}
        </div>
      </header>
      <main className="app-shell__main">
        {title ? <p className="app-shell__context muted">{title}</p> : null}
        {children}
      </main>
    </div>
  );
}
