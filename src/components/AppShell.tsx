import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ka } from '../copy/ka';
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
        <Link to="/" className="app-shell__brand">
          {ka.brand}
        </Link>
        <div className="app-shell__meta">
          <DemoPersonaSwitcher />
          {workspaceSwitch}
          <span className="mono muted">
            {ka.revisionLabel}: {status === 'ready' ? state.revision : '—'}
          </span>
          <DemoResetButton />
        </div>
      </header>
      <main className="app-shell__main">
        {title ? <h1>{title}</h1> : null}
        {children}
      </main>
    </div>
  );
}
