import type {
  CampaignStatus,
  ClaimStatus,
  DealStatus,
  PayoutStatus,
  TransactionType,
} from '../../shared/types';

export const ka = {
  brand: 'LocalLoop',
  demoMode: 'დემოს რეჟიმი',
  demoLauncherTitle: 'ადგილობრივი ჯილდოების ქსელი',
  demoLauncherBody:
    'აირჩიეთ პერსონა და გაიარეთ Magnolia × Camora დემო ერთი სერვერის მდგომარეობით.',
  openCustomer: 'კლიენტი — ნინო',
  openAdvertiser: 'რეკლამის განმთავსებელი — Magnolia',
  openHost: 'მასპინძელი — Camora',
  reset: 'დემოს თავიდან დაწყება',
  loading: 'იტვირთება…',
  errorGeneric: 'რაღაც შეცდომა მოხდა. სცადეთ თავიდან.',
  emptyState: 'აქ ჯერ არაფერია საჩვენებელი.',
  workspaceAdvertiser: 'რეკლამის სივრცე',
  workspaceHost: 'მასპინძლის სივრცე',
  personaNino: 'ნინო',
  personaMagnolia: 'Magnolia Film Lab',
  personaCamora: 'Camora',
  campaignName: '„გაამჟღავნე ღამე“',
  fundAction: 'კამპანიის სიმულირებული დაფინანსება',
  verifyVisit: 'Camora-ს ვიზიტის დადასტურება',
  redeemRequest: 'ჯილდოს გამოყენების მოთხოვნა',
  validateRedemption: 'გამოყენების დადასტურება',
  fundingLabel: 'სიმულირებული ბიუჯეტი',
  settlementLabel: 'სატესტო ანგარიშსწორება Solana devnet-ზე',
  customerScaffold: 'კლიენტის ხედი — ფუნქციები LL-103-ში დასრულდება.',
  advertiserScaffold:
    'რეკლამის განმთავსებლის სივრცე — ფუნქციები LL-104 / LL-105-ში დასრულდება.',
  hostScaffold: 'მასპინძლის სივრცე — ფუნქციები LL-103-ში დასრულდება.',
  capabilityMissing: 'ამ ბიზნესს არ აქვს მოთხოვნილი შესაძლებლობა.',
  revisionLabel: 'რევიზია',
  openExplorer: 'გახსნა Explorer-ში',
  noReceipt: 'ტრანზაქციის ქვითარი ჯერ არ არის.',
} as const;

export const claimStatusKa: Record<ClaimStatus, string> = {
  locked: 'ჩაკეტილია',
  unlocked: 'გახსნილია',
  redemption_requested: 'გამოყენება მოთხოვნილია',
  redeemed: 'გამოყენებულია',
};

export const payoutStatusKa: Record<PayoutStatus, string> = {
  not_ready: 'ჯერ არ არის მზად',
  pending: 'მოლოდინშია',
  processing: 'მუშავდება',
  paid: 'გადახდილია',
  failed: 'ვერ შესრულდა',
};

export const campaignStatusKa: Record<CampaignStatus, string> = {
  draft: 'მონახაზი',
  simulated_funded: 'სიმულირებულად დაფინანსებული',
  live: 'აქტიური',
  completed: 'დასრულებული',
};

export const dealStatusKa: Record<DealStatus, string> = {
  proposed: 'შემოთავაზებული',
  active: 'აქტიური',
  completed: 'დასრულებული',
};

export const transactionTypeKa: Record<TransactionType, string> = {
  funding_proof: 'დაფინანსების მტკიცებულება',
  host_payout: 'მასპინძლის გადახდა',
};
