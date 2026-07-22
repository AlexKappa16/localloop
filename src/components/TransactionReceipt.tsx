import type { ChainTransaction } from '../../shared/types';
import { ka, transactionTypeKa } from '../copy/ka';

type Props = {
  transaction?: ChainTransaction | null;
};

export function TransactionReceipt({ transaction }: Props) {
  if (!transaction) {
    return (
      <div className="receipt">
        <p className="muted">{ka.noReceipt}</p>
        <p className="muted">{ka.settlementLabel}</p>
      </div>
    );
  }

  return (
    <div className="receipt">
      <div className="receipt__row">
        <strong>{transactionTypeKa[transaction.type]}</strong>
        <span className="mono">{transaction.cluster}</span>
      </div>
      <div className="receipt__row">
        <span className="mono">{transaction.signature.slice(0, 12)}…</span>
        <span>{transaction.status}</span>
      </div>
      <a
        className="btn btn--primary"
        href={transaction.explorerUrl}
        target="_blank"
        rel="noreferrer"
      >
        {ka.openExplorer}
      </a>
    </div>
  );
}
