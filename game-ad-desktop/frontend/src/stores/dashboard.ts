import { create } from 'zustand';
import { dataApi } from '../services/api';
import { useDataDiagnosisStore, type Campaign } from './dataDiagnosis';

interface DashboardState {
  metrics: { spend: number; installs: number; cpi: number; roas: number };
  alerts: any[];
  loading: boolean;
  fetchAlerts: () => Promise<void>;
  computeMetrics: () => void;
}

function computeFromCampaigns(campaigns: Campaign[]) {
  if (campaigns.length === 0) return { spend: 0, installs: 0, cpi: 0, roas: 0 };
  const spend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const installs = campaigns.reduce((s, c) => s + (c.installs || 0), 0);
  const cpi = installs > 0 ? spend / installs : 0;
  const roas = campaigns.reduce((s, c) => s + (c.roas || 0), 0) / campaigns.length;
  return { spend: Math.round(spend), installs, cpi: +cpi.toFixed(2), roas: +roas.toFixed(2) };
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: { spend: 0, installs: 0, cpi: 0, roas: 0 },
  alerts: [],
  loading: false,

  computeMetrics: () => {
    const campaigns = useDataDiagnosisStore.getState().campaigns;
    set({ metrics: computeFromCampaigns(campaigns) });
  },

  fetchAlerts: async () => {
    set({ loading: true });
    try {
      const res = await dataApi.getAlerts();
      set({ alerts: (res as any).data || [] });
    } catch {
      set({ alerts: [] });
    } finally {
      set({ loading: false });
    }
  },
}));

// Sync metrics from dataDiagnosis campaigns
export function initDashboardSync() {
  useDataDiagnosisStore.subscribe((state) => {
    if (state.campaigns.length > 0) {
      useDashboardStore.setState({ metrics: computeFromCampaigns(state.campaigns) });
    }
  });
  const campaigns = useDataDiagnosisStore.getState().campaigns;
  if (campaigns.length > 0) {
    useDashboardStore.setState({ metrics: computeFromCampaigns(campaigns) });
  }
}