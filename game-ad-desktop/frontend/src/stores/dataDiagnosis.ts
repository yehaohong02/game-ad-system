import { create } from 'zustand';
import { dataApi } from '../services/api';

export interface Campaign {
  campaign_id: string;
  country: string;
  platform: string;
  spend: number;
  installs: number;
  cpi: number;
  roas: number;
  status: 'active' | 'paused' | 'completed' | 'error';
}

interface Filters {
  dateRange: [string, string] | null;
  country: string | undefined;
  platform: string | undefined;
  status: string | undefined;
}

interface DataDiagnosisState {
  campaigns: Campaign[];
  filters: Filters;
  selectedRows: string[];
  loading: boolean;
  aiDiagnosis: string;
  aiDrawerOpen: boolean;
  importedData: any[] | null;
  importFileName: string;
  dataUpdatedAt: string;
  setFilters: (filters: Partial<Filters>) => void;
  setSelectedRows: (keys: string[]) => void;
  fetchCampaigns: () => Promise<void>;
  batchPause: () => void;
  batchResume: () => void;
  batchAdjustBudget: (percent: number) => void;
  openAiDrawer: () => void;
  closeAiDrawer: () => void;
  fetchAiDiagnosis: () => Promise<void>;
  setImportedData: (data: any[] | null, fileName: string) => void;
}

const mockCampaigns: Campaign[] = [
  { campaign_id: 'CMP-001', country: 'US', platform: 'iOS', spend: 1250.5, installs: 620, cpi: 2.02, roas: 1.15, status: 'active' },
  { campaign_id: 'CMP-002', country: 'US', platform: 'Android', spend: 980.3, installs: 510, cpi: 1.92, roas: 0.88, status: 'active' },
  { campaign_id: 'CMP-003', country: 'JP', platform: 'iOS', spend: 2100.0, installs: 400, cpi: 5.25, roas: 0.62, status: 'paused' },
  { campaign_id: 'CMP-004', country: 'KR', platform: 'Android', spend: 760.8, installs: 380, cpi: 2.0, roas: 1.05, status: 'active' },
  { campaign_id: 'CMP-005', country: 'DE', platform: 'iOS', spend: 540.2, installs: 210, cpi: 2.57, roas: 0.75, status: 'active' },
  { campaign_id: 'CMP-006', country: 'BR', platform: 'Android', spend: 320.0, installs: 290, cpi: 1.1, roas: 1.32, status: 'active' },
  { campaign_id: 'CMP-007', country: 'US', platform: 'iOS', spend: 1800.0, installs: 850, cpi: 2.12, roas: 0.95, status: 'active' },
  { campaign_id: 'CMP-008', country: 'UK', platform: 'Android', spend: 620.5, installs: 310, cpi: 2.0, roas: 0.82, status: 'paused' },
  { campaign_id: 'CMP-009', country: 'JP', platform: 'Android', spend: 1450.0, installs: 520, cpi: 2.79, roas: 0.71, status: 'error' },
  { campaign_id: 'CMP-010', country: 'KR', platform: 'iOS', spend: 890.0, installs: 440, cpi: 2.02, roas: 1.1, status: 'active' },
  { campaign_id: 'CMP-011', country: 'FR', platform: 'iOS', spend: 410.0, installs: 180, cpi: 2.28, roas: 0.68, status: 'completed' },
  { campaign_id: 'CMP-012', country: 'US', platform: 'Android', spend: 2200.0, installs: 1100, cpi: 2.0, roas: 0.98, status: 'active' },
];

export const useDataDiagnosisStore = create<DataDiagnosisState>((set, get) => ({
  campaigns: [],
  filters: { dateRange: null, country: undefined, platform: undefined, status: undefined },
  selectedRows: [],
  loading: false,
  aiDiagnosis: '',
  aiDrawerOpen: false,
  importedData: null,
  importFileName: '',
  dataUpdatedAt: '',

  setFilters: (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),

  setSelectedRows: (keys) => set({ selectedRows: keys }),

  fetchCampaigns: async () => {
    set({ loading: true });
    try {
      const res = await dataApi.getPerformance(get().filters);
      const data = (res as any)?.data;
      if (Array.isArray(data) && data.length > 0) {
        set({ campaigns: data });
      } else {
        set({ campaigns: mockCampaigns });
      }
    } catch {
      set({ campaigns: mockCampaigns });
    } finally {
      set({ loading: false });
    }
  },

  batchPause: () => {
    const { selectedRows, campaigns } = get();
    set({
      campaigns: campaigns.map((c) =>
        selectedRows.includes(c.campaign_id) ? { ...c, status: 'paused' as const } : c
      ),
      selectedRows: [],
    });
  },

  batchResume: () => {
    const { selectedRows, campaigns } = get();
    set({
      campaigns: campaigns.map((c) =>
        selectedRows.includes(c.campaign_id) ? { ...c, status: 'active' as const } : c
      ),
      selectedRows: [],
    });
  },

  batchAdjustBudget: (percent: number) => {
    const { selectedRows, campaigns } = get();
    set({
      campaigns: campaigns.map((c) =>
        selectedRows.includes(c.campaign_id)
          ? { ...c, spend: +(c.spend * (1 + percent / 100)).toFixed(2) }
          : c
      ),
      selectedRows: [],
    });
  },

  openAiDrawer: () => set({ aiDrawerOpen: true }),
  closeAiDrawer: () => set({ aiDrawerOpen: false }),

  fetchAiDiagnosis: async () => {
    set({ aiDiagnosis: '正在分析...' });
    try {
      const { campaigns, selectedRows } = get();
      const targets = selectedRows.length > 0
        ? campaigns.filter((c) => selectedRows.includes(c.campaign_id))
        : campaigns;
      const res = await dataApi.getAlerts({ campaigns: targets.map((c) => c.campaign_id) });
      const alerts = (res as any)?.data;
      if (Array.isArray(alerts) && alerts.length > 0) {
        set({ aiDiagnosis: alerts.map((a: any) => `[${a.severity}] ${a.metric}: ${a.campaign_id}`).join('\n') });
      } else {
        throw new Error('fallback');
      }
    } catch {
      const { campaigns, selectedRows } = get();
      const targets = selectedRows.length > 0
        ? campaigns.filter((c) => selectedRows.includes(c.campaign_id))
        : campaigns;
      const highCpi = targets.filter((c) => c.cpi > 2.5);
      const lowRoas = targets.filter((c) => c.roas < 0.8);
      const lines: string[] = ['📊 AI 诊断报告\n'];
      if (highCpi.length > 0) {
        lines.push(`⚠️ 高 CPI 告警：以下 campaign 的 CPI 超过 $2.5，建议优化素材或调整定向：`);
        highCpi.forEach((c) => lines.push(`  - ${c.campaign_id} (${c.country}/${c.platform}): CPI $${c.cpi}`));
        lines.push('');
      }
      if (lowRoas.length > 0) {
        lines.push(`🔴 低 ROAS 告警：以下 campaign 的 ROAS 低于 0.8，建议暂停或大幅调整：`);
        lowRoas.forEach((c) => lines.push(`  - ${c.campaign_id} (${c.country}/${c.platform}): ROAS ${c.roas}`));
        lines.push('');
      }
      if (highCpi.length === 0 && lowRoas.length === 0) {
        lines.push('✅ 所有选中 campaign 表现正常，暂无异常。');
      }
      lines.push('\n💡 建议：');
      lines.push('  1. 对高 CPI campaign 进行 A/B 测试，尝试新素材');
      lines.push('  2. 将预算向 ROAS > 1.0 的 campaign 倾斜');
      lines.push('  3. 关注日本市场的 CPI 趋势，考虑调整出价策略');
      set({ aiDiagnosis: lines.join('\n') });
    }
  },

  setImportedData: (data, fileName) => set({
    importedData: data,
    importFileName: fileName,
    dataUpdatedAt: new Date().toLocaleString('zh-CN'),
  }),
}));
