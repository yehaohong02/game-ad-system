import { create } from 'zustand';
import { dataApi } from '../services/api';

interface DashboardState {
  metrics: { spend: number; installs: number; cpi: number; roas: number };
  alerts: any[];
  loading: boolean;
  fetchAlerts: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: { spend: 3280, installs: 1520, cpi: 2.16, roas: 0.92 },
  alerts: [],
  loading: false,
  fetchAlerts: async () => {
    set({ loading: true });
    try {
      const res = await dataApi.getAlerts();
      set({ alerts: (res as any).data || [] });
    } finally {
      set({ loading: false });
    }
  },
}));
