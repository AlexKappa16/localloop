import type { ChainTransaction } from '../../shared/types';
import { en, transactionTypeLabel } from '../copy/en';
import { shortenAddress } from '../lib/wallet';

type Props = {
  transaction?: ChainTransaction | null;
};

export function TransactionReceipt({ transaction }: Props) {
  if (!transaction) {
    return (
      <div className="receipt">
        <p className="muted">{en.noReceipt}</p>
        <p className="muted">{en.settlementLabel}</p>
      </div>
    );
  }

  return (
    <div className="receipt">
      <div className="receipt__row">
        <strong>{transactionTypeLabel[transaction.type]}</strong>
        <span className="mono">{transaction.cluster}</span>
      </div>
      <div className="receipt__row">
        <span className="mono">{shortenAddress(transaction.signature, 6)}</span>
        <span>{transaction.status}</span>
      </div>
      <p className="muted mono">{transaction.memo}</p>
      <p className="muted">{en.settlementLabel}</p>
      <a
        className="btn btn--primary"
        href={transaction.explorerUrl}
        target="_blank"
        rel="noreferrer"
      >
        {en.openExplorer}
      </a>
    </div>
  );
}
