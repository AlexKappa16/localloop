import { StatusBadge } from '../../components/StatusBadge';
import { useDemoState } from '../../app/DemoStateProvider';
import { ka } from '../../copy/ka';

type Props = { customerId: string };

export function CustomerPage({ customerId }: Props) {
  const { state } = useDemoState();
  const claim = state.claims.find((item) => item.customerId === customerId);

  return (
    <div className="panel stack">
      <p>{ka.customerScaffold}</p>
      <p>
        {ka.campaignName} · {claim?.verifiedVisits ?? 0}/
        {claim?.requiredVisits ?? 3}
      </p>
      {claim ? <StatusBadge kind="claim" status={claim.status} /> : null}
    </div>
  );
}
