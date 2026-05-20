import { create } from 'zustand';
import { reportsApi } from '../services/api';
import { useMaterialDataStore, type MaterialRecord } from './materialData';

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

export interface MarketInsight {
  title: string;
  source: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CompetitiveAlert {
  type: 'budget' | 'creative' | 'performance';
  message: string;
  severity: 'critical' | 'warning' | 'info';
  materials?: string[];
}

export interface DailyReport {
  date: string;
  metrics: DailyMetrics;
  alerts: DailyAlerts;
  top_creatives: TopCreative[];
  total_impressions?: number;
  total_clicks?: number;
  marketInsights?: MarketInsight[];
  competitiveAlerts?: CompetitiveAlert[];
}

export interface WeeklyReport {
  period: string;
  type: string;
  metrics: DailyMetrics;
}

interface ReportsState {
  reportType: 'daily' | 'weekly';
  dailyReport: DailyReport | null;
  weeklyReport: WeeklyReport | null;
  loading: boolean;

  setReportType: (t: 'daily' | 'weekly') => void;
  fetchDailyReport: (date?: string) => Promise<void>;
  fetchWeeklyReport: () => Promise<void>;
}

function toNum(v: any): number {
  if (!v || v === '-' || v === '') return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function deriveReports(data: MaterialRecord[]): Pick<ReportsState, 'dailyReport' | 'weeklyReport'> {
  const cats = new Map<string, MaterialRecord[]>();
  data.filter(d => !d.isSummary).forEach(d => {
    const c = d.category || '未知';
    if (!cats.has(c)) cats.set(c, []);
    cats.get(c)!.push(d);
  });

  const totalSpend = data.reduce((s, r) => s + toNum(r.spend), 0);
  const totalImp = data.reduce((s, r) => s + toNum(r.impressions), 0);
  const totalClicks = data.reduce((s, r) => s + toNum(r.clicks), 0);
  const avgCtr = totalImp > 0 ? totalClicks / totalImp : 0;

  // Top creatives by CTR
  const topCreatives: TopCreative[] = [...data]
    .filter(d => !d.isSummary && toNum(d.impressions) > 1000)
    .sort((a, b) => toNum(b.ctr) - toNum(a.ctr))
    .slice(0, 8)
    .map(r => ({
      creative_id: `${r.materialId}-${r.category || '未知'}`,
      roas: toNum(r.ctr) * 100, // use CTR% as the "score"
      spend: toNum(r.spend),
    }));

  // Alerts from data
  const zeroImp = data.filter(d => !d.isSummary && toNum(d.impressions) === 0);
  const highCpm = data.filter(d => !d.isSummary && toNum(d.cpm) > 8 && toNum(d.impressions) > 0);
  const lowCtr = data.filter(d => !d.isSummary && toNum(d.impressions) > 10000 && toNum(d.ctr) * 100 < 0.3);

  const alerts: DailyAlerts = {
    total: zeroImp.length + highCpm.length + lowCtr.length,
    critical: highCpm.length + (zeroImp.length > 5 ? 1 : 0),
  };

  // Market insights
  const avgCpm = data.filter(d => !d.isSummary && toNum(d.impressions) > 0).reduce((s, r) => s + toNum(r.cpm), 0) / Math.max(1, data.filter(d => !d.isSummary && toNum(d.impressions) > 0).length);
  const catEntries = [...cats.entries()].sort((a, b) => b[1].reduce((s, r) => s + toNum(r.spend), 0) - a[1].reduce((s, r) => s + toNum(r.spend), 0));
  const topCat = catEntries[0];
  const topCatSpend = topCat ? topCat[1].reduce((s, r) => s + toNum(r.spend), 0) : 0;

  const marketInsights: MarketInsight[] = [];
  if (topCat) {
    marketInsights.push({
      title: `${topCat[0]} 占总花费${(topCatSpend / totalSpend * 100).toFixed(0)}%`,
      source: '预算分析',
      detail: topCatSpend / totalSpend > 0.8 ? '预算过度集中，建议分散投放降低风险' : '预算分配合理，可维持当前策略',
      priority: topCatSpend / totalSpend > 0.8 ? 'high' : 'low',
    });
  }

  const lowCpmItems = [...data].filter(d => !d.isSummary && toNum(d.impressions) > 0).sort((a, b) => toNum(a.cpm) - toNum(b.cpm)).slice(0, 3);
  if (lowCpmItems.length > 0) {
    marketInsights.push({
      title: `发现${lowCpmItems.length}条低成本素材`,
      source: '成本分析',
      detail: `${lowCpmItems.map(r => `${r.materialId} CPM¥${toNum(r.cpm).toFixed(2)}`).join('、')}，可作为加量候选`,
      priority: 'medium',
    });
  }

  if (avgCpm > 0) {
    marketInsights.push({
      title: `全局平均CPM ¥${avgCpm.toFixed(2)}`,
      source: '效果监控',
      detail: `总计${data.filter(d => !d.isSummary).length}条素材，${catEntries.length}个项目在投`,
      priority: 'low',
    });
  }

  // Competitive alerts
  const competitiveAlerts: CompetitiveAlert[] = [];
  if (zeroImp.length > 0) {
    competitiveAlerts.push({
      type: 'creative',
      message: `${zeroImp.length}条素材零曝光，需排查投放配置`,
      severity: zeroImp.length > 5 ? 'critical' : 'warning',
      materials: zeroImp.slice(0, 5).map(r => String(r.materialId)),
    });
  }
  if (highCpm.length > 0) {
    competitiveAlerts.push({
      type: 'performance',
      message: `${highCpm.length}条素材CPM超¥8，成本异常`,
      severity: 'critical',
      materials: highCpm.slice(0, 5).map(r => String(r.materialId)),
    });
  }
  if (lowCtr.length > 0) {
    competitiveAlerts.push({
      type: 'performance',
      message: `${lowCtr.length}条素材CTR低于0.3%，效果不佳`,
      severity: 'warning',
      materials: lowCtr.slice(0, 5).map(r => String(r.materialId)),
    });
  }

  const dailyReport: DailyReport = {
    date: '2026-05-20',
    metrics: {
      total_spend: Math.round(totalSpend),
      total_installs: 0,
      avg_roas: 0,
      avg_cpi: 0,
      avg_ctr: avgCtr,
    },
    alerts,
    top_creatives: topCreatives,
    total_impressions: totalImp,
    total_clicks: totalClicks,
    marketInsights,
    competitiveAlerts,
  };

  const weeklyReport: WeeklyReport = {
    period: '2026-05-14 ~ 2026-05-20',
    type: 'weekly',
    metrics: {
      total_spend: Math.round(totalSpend),
      total_installs: 0,
      avg_roas: 0,
      avg_cpi: 0,
      avg_ctr: avgCtr,
    },
  };

  return { dailyReport, weeklyReport };
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
        // derived from materialData already
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
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
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    } finally {
      set({ loading: false });
    }
  },
}));

// Auto-derive from materialData
useMaterialDataStore.subscribe((state) => {
  if (state.data.length > 0) {
    useReportsStore.setState(deriveReports(state.data));
  }
});

// Initial derive
const initData = useMaterialDataStore.getState().data;
if (initData.length > 0) {
  useReportsStore.setState(deriveReports(initData));
}
