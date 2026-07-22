import { StatusBadge } from '../../components/StatusBadge';
import { TransactionReceipt } from '../../components/TransactionReceipt';
import { useDemoState } from '../../app/DemoStateProvider';
import { ka } from '../../copy/ka';

type Props = { businessId: string };

export function HostPage({ businessId }: Props) {
  const { state } = useDemoState();
  const deal = state.deals.find((item) => item.hostBusinessId === businessId);
  const payout = state.payouts.find((item) => item.hostBusinessId === businessId);
  const payoutTx = state.transactions.find((tx) => tx.type === 'host_payout');

  return (
    <div className="panel stack">
      <p>{ka.hostScaffold}</p>
      {deal ? (
        <>
          <p>{deal.requirementKa}</p>
          <StatusBadge kind="deal" status={deal.status} />
        </>
      ) : (
        <p className="muted">{ka.emptyState}</p>
      )}
      {payout ? <StatusBadge kind="payout" status={payout.status} /> : null}
      <TransactionReceipt transaction={payoutTx} />
    </div>
  );
}
