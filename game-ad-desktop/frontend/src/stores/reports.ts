import { create } from 'zustand';
import { reportsApi } from '../services/api';

export interface DailyMetrics {
  total_spend: number;
  total_installs: number;
  avg_roas: number;
  avg_cpi: number;
  avg_ctr: number;
}

export interface DailyAlerts {
  total: number;
  critical: number;
}

export interface TopCreative {
  creative_id: string;
  roas: number;
  spend: number;
}

export interface DailyReport {
  date: string;
  metrics: DailyMetrics;
  alerts: DailyAlerts;
  top_creatives: TopCreative[];
}

export interface WeeklyReport {
  period: string;
  type: string;
  metrics: DailyMetrics;
}

// Mock data
const mockDailyReport: DailyReport = {
  date: '2026-05-14',
  metrics: {
    total_spend: 128500,
    total_installs: 34200,
    avg_roas: 1.35,
    avg_cpi: 3.76,
    avg_ctr: 0.028,
  },
  alerts: { total: 7, critical: 2 },
  top_creatives: [
    { creative_id: 'gd_007', roas: 2.15, spend: 18500 },
    { creative_id: 'gd_005', roas: 1.92, spend: 15200 },
    { creative_id: 'ax_001', roas: 1.78, spend: 22000 },
    { creative_id: 'ry_005', roas: 1.65, spend: 12800 },
    { creative_id: 'gd_001', roas: 1.51, spend: 9600 },
  ],
};

const mockWeeklyReport: WeeklyReport = {
  period: '2026-05-08 ~ 2026-05-14',
  type: 'weekly',
  metrics: {
    total_spend: 892000,
    total_installs: 238500,
    avg_roas: 1.42,
    avg_cpi: 3.74,
    avg_ctr: 0.031,
  },
};

interface ReportsState {
  reportType: 'daily' | 'weekly';
  dailyReport: DailyReport | null;
  weeklyReport: WeeklyReport | null;
  loading: boolean;

  setReportType: (t: 'daily' | 'weekly') => void;
  fetchDailyReport: (date?: string) => Promise<void>;
  fetchWeeklyReport: () => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set) => ({
  reportType: 'daily',
  dailyReport: null,
  weeklyReport: null,
  loading: false,

  setReportType: (t) => {
    set({ reportType: t });
  },

  fetchDailyReport: async (date?: string) => {
    set({ loading: true });
    try {
      const res: any = await reportsApi.getDaily(date);
      const data: DailyReport = res?.data ?? res;
      if (data && data.metrics && typeof data.metrics.total_spend === 'number') {
        set({ dailyReport: data });
      } else {
        await new Promise((r) => setTimeout(r, 300));
        set({ dailyReport: mockDailyReport });
      }
    } catch {
      await new Promise((r) => setTimeout(r, 300));
      set({ dailyReport: mockDailyReport });
    } finally {
      set({ loading: false });
    }
  },

  fetchWeeklyReport: async () => {
    set({ loading: true });
    try {
      const res: any = await reportsApi.getWeekly();
      const data: WeeklyReport = res?.data ?? res;
      if (data && data.metrics && typeof data.metrics.total_spend === 'number') {
        set({ weeklyReport: data });
      } else {
        await new Promise((r) => setTimeout(r, 300));
        set({ weeklyReport: mockWeeklyReport });
      }
    } catch {
      await new Promise((r) => setTimeout(r, 300));
      set({ weeklyReport: mockWeeklyReport });
    } finally {
      set({ loading: false });
    }
  },
}));
