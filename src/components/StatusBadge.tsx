import {
  campaignStatusLabel,
  claimStatusLabel,
  dealStatusLabel,
  payoutStatusLabel,
} from '../copy/en';
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
      return claimStatusLabel[status as ClaimStatus];
    case 'payout':
      return payoutStatusLabel[status as PayoutStatus];
    case 'campaign':
      return campaignStatusLabel[status as CampaignStatus];
    case 'deal':
      return dealStatusLabel[status as DealStatus];
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
