import {
  campaignStatusKa,
  claimStatusKa,
  dealStatusKa,
  payoutStatusKa,
} from '../copy/ka';
import type {
  CampaignStatus,
  ClaimStatus,
  DealStatus,
  PayoutStatus,
} from '../../shared/types';

type StatusKind = 'claim' | 'payout' | 'campaign' | 'deal';

type Props =
  | { kind: 'claim'; status: ClaimStatus }
  | { kind: 'payout'; status: PayoutStatus }
  | { kind: 'campaign'; status: CampaignStatus }
  | { kind: 'deal'; status: DealStatus };

function labelFor(kind: StatusKind, status: string): string {
  switch (kind) {
    case 'claim':
      return claimStatusKa[status as ClaimStatus];
    case 'payout':
      return payoutStatusKa[status as PayoutStatus];
    case 'campaign':
      return campaignStatusKa[status as CampaignStatus];
    case 'deal':
      return dealStatusKa[status as DealStatus];
  }
}

export function StatusBadge(props: Props) {
  const label = labelFor(props.kind, props.status);
  return (
    <span className={`badge badge--${props.status}`} data-kind={props.kind}>
      {label}
    </span>
  );
}
