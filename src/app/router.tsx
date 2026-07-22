import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ids } from '../../shared/ids';
import type { BusinessCapability } from '../../shared/types';
import { AppShell } from '../components/AppShell';
import { BusinessWorkspaceSwitcher } from '../components/BusinessWorkspaceSwitcher';
import { StatusBadge } from '../components/StatusBadge';
import { TransactionReceipt } from '../components/TransactionReceipt';
import { ka } from '../copy/ka';
import { AdvertiserPage } from '../features/advertiser/AdvertiserPage';
import { CustomerPage } from '../features/customer/CustomerPage';
import { HostPage } from '../features/host/HostPage';
import { useDemoState } from './DemoStateProvider';
import { Link } from 'react-router-dom';

function DemoLauncher() {
  return (
    <AppShell title={ka.brand}>
      <div className="panel stack">
        <p>{ka.demoLauncherTitle}</p>
        <p>{ka.demoLauncherBody}</p>
        <div className="launcher-grid">
          <Link className="btn btn--primary" to="/customer">
            {ka.openCustomer}
          </Link>
          <Link className="btn btn--primary" to="/advertiser">
            {ka.openAdvertiser}
          </Link>
          <Link className="btn btn--primary" to="/host">
            {ka.openHost}
          </Link>
        </div>
        <div className="stack">
          <div>
            <StatusBadge kind="claim" status="locked" />{' '}
            <StatusBadge kind="payout" status="not_ready" />{' '}
            <StatusBadge kind="campaign" status="draft" />
          </div>
          <TransactionReceipt transaction={null} />
        </div>
      </div>
    </AppShell>
  );
}

function BusinessWorkspaceRoute({
  workspace,
}: {
  workspace: BusinessCapability;
}) {
  const { businessId = '' } = useParams();
  const { state, status, errorKa } = useDemoState();
  const business = state.businesses.find((item) => item.id === businessId);

  if (status === 'loading') {
    return (
      <AppShell>
        <p>{ka.loading}</p>
      </AppShell>
    );
  }

  if (!business) {
    return <Navigate to="/" replace />;
  }

  if (!business.capabilities.includes(workspace)) {
    return (
      <AppShell>
        <div className="panel">
          <p>{ka.capabilityMissing}</p>
          <Link className="btn" to="/">
            {ka.brand}
          </Link>
        </div>
      </AppShell>
    );
  }

  const switcher = (
    <BusinessWorkspaceSwitcher
      businessId={business.id}
      capabilities={business.capabilities}
    />
  );

  if (workspace === 'advertiser') {
    return (
      <AppShell
        title={`${business.name} — ${ka.workspaceAdvertiser}`}
        workspaceSwitch={switcher}
      >
        {errorKa ? <p>{errorKa}</p> : null}
        <AdvertiserPage businessId={business.id} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${business.name} — ${ka.workspaceHost}`}
      workspaceSwitch={switcher}
    >
      {errorKa ? <p>{errorKa}</p> : null}
      <HostPage businessId={business.id} />
    </AppShell>
  );
}

function CustomerRoute() {
  const { customerId = '' } = useParams();
  const { state } = useDemoState();
  const customer = state.customers.find((item) => item.id === customerId);

  if (!customer) {
    return <Navigate to={`/customer/${ids.nino}`} replace />;
  }

  return (
    <AppShell title={`${ka.personaNino}`}>
      <CustomerPage customerId={customer.id} />
    </AppShell>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DemoLauncher />} />
      <Route path="/customer" element={<Navigate to={`/customer/${ids.nino}`} replace />} />
      <Route path="/customer/:customerId" element={<CustomerRoute />} />
      <Route
        path="/advertiser"
        element={
          <Navigate to={`/business/${ids.magnolia}/advertiser`} replace />
        }
      />
      <Route
        path="/host"
        element={<Navigate to={`/business/${ids.camora}/host`} replace />}
      />
      <Route
        path="/business/:businessId/advertiser"
        element={<BusinessWorkspaceRoute workspace="advertiser" />}
      />
      <Route
        path="/business/:businessId/host"
        element={<BusinessWorkspaceRoute workspace="host" />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
