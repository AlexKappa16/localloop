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
  preview: {
    eyebrow: 'ინტერაქტიული პროტოტიპი · მხოლოდ frontend',
    title: 'ერთი კამპანია. სამი მონაწილე. ერთი ცოცხალი ისტორია.',
    subtitle:
      'გაიარეთ Magnolia × Camora × ნინოს სრული გზა — დაფინანსებიდან ჯილდოს გამოყენებამდე.',
    mockDisclosure:
      'ეს არის სრულიად მოკი პროტოტიპი: საფულე, ხელმოწერა და devnet ოპერაციები მხოლოდ ვიზუალურადაა სიმულირებული.',
    guidedDemo: 'დემოს გზამკვლევი',
    nextAction: 'შემდეგი მოქმედება',
    switchToAction: 'გადადით საჭირო ხედზე',
    reset: 'პროტოტიპის თავიდან დაწყება',
    campaign: 'კამპანია',
    campaignStory:
      'Magnolia აჯილდოებს Camora-ს ერთგულ სტუმრებს ფირის გამჟღავნებაზე.',
    simulatedBudget: 'სიმულირებული ბიუჯეტი',
    remainingBudget: 'დარჩენილი ბიუჯეტი',
    paidBudget: 'გადახდილი',
    partnerNetwork: 'პარტნიორების ქსელი',
    proposedMock: 'მოკი შეთავაზება',
    canonicalDeal: 'მთავარი დემო გზა',
    fullJourney: 'სრული გზა',
    advertiserTab: 'Magnolia · რეკლამის განმთავსებელი',
    hostTab: 'Camora · მასპინძელი',
    customerTab: 'ნინო · მომხმარებელი',
    advertiserKicker: 'კამპანიის მართვა',
    advertiserTitle: 'Magnolia Film Lab',
    advertiserBody:
      'დააფინანსეთ კამპანია სიმულირებულად და დაადასტურეთ ნინოს ჯილდოს გამოყენება.',
    wallet: 'საფულე',
    walletDisconnected: 'არ არის დაკავშირებული',
    walletConnected: '7Fka…Loop · მოკი კავშირი',
    connectWallet: 'მოკი საფულის დაკავშირება',
    signFunding: 'ავტორიზაციაზე ხელმოწერა',
    signDisclosure:
      'უფასო შეტყობინების ხელმოწერა — საფულიდან SOL არ იგზავნება.',
    validate: 'გამოყენების დადასტურება',
    completePayout: 'მოკი გადახდის დასრულება',
    hostKicker: 'თანამშრომლის რეჟიმი',
    hostTitle: 'Camora',
    hostBody:
      'დაამტკიცეთ პარტნიორობა და დაადასტურეთ ნინოს დარჩენილი ვიზიტები.',
    approveDeal: 'შეთავაზების დამტკიცება',
    verifyVisit: 'ვიზიტის დადასტურება',
    passTitle: 'ნინოს LocalLoop პასი',
    passHint: 'QR ვიზუალი · კამერა ამ პროტოტიპში არ გამოიყენება',
    customerKicker: 'ჯილდოს პასი',
    customerTitle: 'გამარჯობა, ნინო',
    customerBody:
      'Camora-ში სამი დადასტურებული ვიზიტი Magnolia-ს ჯილდოს ხსნის.',
    progress: 'ვიზიტების პროგრესი',
    reward: 'შენი ჯილდო',
    requestReward: 'ჯილდოს გამოყენების მოთხოვნა',
    lockedReward: 'კიდევ ერთი ნაბიჯი და ჯილდო გაიხსნება.',
    unlockedReward: 'ჯილდო მზადაა გამოსაყენებლად.',
    history: 'ცოცხალი აქტივობა',
    emptyHistory: 'მოქმედებები აქ გამოჩნდება.',
    receipt: 'მოკი devnet ქვითარი',
    receiptReference: 'პროტოტიპის ნომერი',
    receiptMemo: 'Memo',
    noExplorer:
      'Explorer-ის ბმული განზრახ არ არის — ეს ჩანაწერი blockchain ტრანზაქცია არ არის.',
    fundingProof: 'დაფინანსების მოკი მტკიცებულება',
    payoutProof: 'გადახდის მოკი მტკიცებულება',
    successTitle: 'სრული LocalLoop დაიხურა',
    successBody:
      'ნინომ მიიღო ჯილდო, Camora-მ — 0.005 SOL მოკი გადახდა, Magnolia-ს დარჩა 0.045 SOL.',
    statusReady: 'მზადაა',
    statusWaiting: 'ელოდება წინა ნაბიჯს',
    visitVerified: 'დადასტურებულია',
    visitPending: 'მოსალოდნელია',
    tsreRequirement: 'TSRE Gym-ში 2 დადასტურებული ვიზიტი',
    tsreReward: 'მომავალი პარტნიორული შეთავაზება',
  },
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
