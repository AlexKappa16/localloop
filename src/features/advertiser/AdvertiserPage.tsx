import { StatusBadge } from '../../components/StatusBadge';
import { TransactionReceipt } from '../../components/TransactionReceipt';
import { useDemoState } from '../../app/DemoStateProvider';
import { ka } from '../../copy/ka';
import { ids } from '../../../shared/ids';

type Props = { businessId: string };

export function AdvertiserPage({ businessId }: Props) {
  const { state } = useDemoState();
  const campaign = state.campaigns.find(
    (item) => item.advertiserBusinessId === businessId,
  );
  const fundingTx = state.transactions.find((tx) => tx.type === 'funding_proof');

  return (
    <div className="panel stack">
      <p>{ka.advertiserScaffold}</p>
      {campaign ? (
        <>
          <p>
            {campaign.nameKa} · {ka.fundingLabel}: {campaign.budget.remainingSol}{' '}
            SOL
          </p>
          <StatusBadge kind="campaign" status={campaign.status} />
        </>
      ) : (
        <p className="muted">{ka.emptyState}</p>
      )}
      <p className="mono muted">{ids.campaign}</p>
      <TransactionReceipt transaction={fundingTx} />
    </div>
  );
}
