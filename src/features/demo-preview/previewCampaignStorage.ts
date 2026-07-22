export type SavedPreviewCampaign = {
  id: string;
  campaignName: string;
  perks: string;
  features: string;
  dealTerms: string;
  hasDesiredPartner: boolean;
  hostPartner: string;
  requirements: string;
  budgetSol: number;
  walletConnected: boolean;
  logoDataUrl: string | null;
  partnerLogoUrl: string | null;
  createdAt: string;
};

const STORAGE_KEY = 'localloop.demo-preview.campaigns';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadSavedCampaigns(): SavedPreviewCampaign[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value) => {
      const campaign = normalizeCampaign(value);
      return campaign ? [campaign] : [];
    });
  } catch {
    return [];
  }
}

export function saveCampaign(
  campaign: Omit<SavedPreviewCampaign, 'id' | 'createdAt'>,
): SavedPreviewCampaign {
  const next: SavedPreviewCampaign = {
    ...campaign,
    id: `campaign-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existing = loadSavedCampaigns();
  const updated = [next, ...existing];
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return next;
}

export function deleteCampaign(campaignId: string): SavedPreviewCampaign[] {
  const updated = loadSavedCampaigns().filter(
    (campaign) => campaign.id !== campaignId,
  );
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

function normalizeCampaign(value: unknown): SavedPreviewCampaign | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== 'string' ||
    typeof item.campaignName !== 'string' ||
    typeof item.perks !== 'string' ||
    typeof item.features !== 'string' ||
    typeof item.dealTerms !== 'string' ||
    typeof item.hasDesiredPartner !== 'boolean' ||
    typeof item.hostPartner !== 'string' ||
    typeof item.requirements !== 'string' ||
    typeof item.budgetSol !== 'number' ||
    typeof item.walletConnected !== 'boolean' ||
    typeof item.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    id: item.id,
    campaignName: item.campaignName,
    perks: item.perks,
    features: item.features,
    dealTerms: item.dealTerms,
    hasDesiredPartner: item.hasDesiredPartner,
    hostPartner: item.hostPartner,
    requirements: item.requirements,
    budgetSol: item.budgetSol,
    walletConnected: item.walletConnected,
    logoDataUrl: typeof item.logoDataUrl === 'string' ? item.logoDataUrl : null,
    partnerLogoUrl:
      typeof item.partnerLogoUrl === 'string' ? item.partnerLogoUrl : null,
    createdAt: item.createdAt,
  };
}
