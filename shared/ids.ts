export const ids = {
  magnolia: 'magnolia-film-lab',
  camora: 'camora',
  tsreGym: 'tsre-gym',
  nino: 'nino',
  campaign: 'magnolia-develop-the-night',
  camoraDeal: 'camora-deal',
  tsreDeal: 'tsre-gym-deal',
  claim: 'LL-NINO-001',
} as const;

export type BusinessId = (typeof ids)[keyof Pick<
  typeof ids,
  'magnolia' | 'camora' | 'tsreGym'
>];

export type CustomerId = (typeof ids)['nino'];
export type CampaignId = (typeof ids)['campaign'];
export type DealId = (typeof ids)['camoraDeal'] | (typeof ids)['tsreDeal'];
export type ClaimId = (typeof ids)['claim'];
