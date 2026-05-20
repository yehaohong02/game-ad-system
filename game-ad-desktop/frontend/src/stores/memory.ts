import { create } from 'zustand';
import { aiApi } from '../services/api';

export interface CaseResult {
  case_id: string;
  campaign_id: string;
  country: string;
  platform: string;
  summary: string;
  final_result: {
    total_spend: number;
    total_installs: number;
    roas: number;
  };
  similarity: number;
}

interface MemoryState {
  searchQuery: string;
  searchResults: CaseResult[];
  weeklyReport: string;
  loading: boolean;
  reportLoading: boolean;
  hasSearched: boolean;
  setSearchQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  fetchWeeklyReport: () => Promise<void>;
}

const mockCases: CaseResult[] = [
  {
    case_id: 'case_001',
    campaign_id: 'campaign_001',
    country: 'US',
    platform: 'Meta',
    summary: '美国市场休闲游戏推广，通过优化素材CTR从0.8%提升至2.1%，ROAS在第7天突破1.0，整体花费$8,200获得9,100安装。',
    final_result: { total_spend: 8200, total_installs: 9100, roas: 1.05 },
    similarity: 0.95,
  },
  {
    case_id: 'case_002',
    campaign_id: 'campaign_002',
    country: 'JP',
    platform: 'Google',
    summary: '日本市场RPG游戏投放，采用分时段出价策略，凌晨时段降低30%出价，整体CPI从$4.5降至$2.8，节省预算$3,500。',
    final_result: { total_spend: 12000, total_installs: 4280, roas: 1.32 },
    similarity: 0.89,
  },
  {
    case_id: 'case_003',
    campaign_id: 'campaign_003',
    country: 'KR',
    platform: 'Meta',
    summary: '韩国市场策略游戏，发现CPI持续超标后触发熔断机制，暂停低效素材后整体CPI回落至$3.2，避免了$5,000的无效花费。',
    final_result: { total_spend: 6800, total_installs: 2125, roas: 0.78 },
    similarity: 0.85,
  },
  {
    case_id: 'case_004',
    campaign_id: 'campaign_004',
    country: 'DE',
    platform: 'TikTok',
    summary: '德国市场超休闲游戏，TikTok渠道素材自然衰减周期约5天，通过每5天更换素材包保持CTR稳定在1.5%以上，ROAS达0.95。',
    final_result: { total_spend: 4500, total_installs: 5625, roas: 0.95 },
    similarity: 0.82,
  },
  {
    case_id: 'case_005',
    campaign_id: 'campaign_005',
    country: 'BR',
    platform: 'Google',
    summary: '巴西市场模拟经营游戏，利用lookalike受众扩展，安装量提升40%的同时CPI仅上涨12%，最终ROAS突破1.5成为标杆案例。',
    final_result: { total_spend: 5600, total_installs: 7000, roas: 1.52 },
    similarity: 0.78,
  },
  {
    case_id: 'case_006',
    campaign_id: 'campaign_006',
    country: 'ID',
    platform: 'Meta',
    summary: '印尼市场SLG游戏投放初期CPI高达$6.8，通过排除低质量placement并将预算集中至Feed和Story，CPI降至$3.1。',
    final_result: { total_spend: 9300, total_installs: 3000, roas: 0.88 },
    similarity: 0.73,
  },
  {
    case_id: 'case_007',
    campaign_id: 'campaign_007',
    country: 'US',
    platform: 'Google',
    summary: '美国市场消除游戏全渠道投放，Google UAC自动化出价配合每日预算上限调整，7天内实现ROAS 1.1的稳定表现。',
    final_result: { total_spend: 15000, total_installs: 12500, roas: 1.10 },
    similarity: 0.70,
  },
];

const mockWeeklyReport = `## 本周记忆沉淀报告 (5/9 - 5/15)

### 案例总结
本周共沉淀 **7** 个典型案例，覆盖 US、JP、KR、DE、BR、ID 六大市场。

### 关键发现
- **素材优化效果显著**：US 市场休闲游戏通过素材迭代将 CTR 提升 162%，建议将此策略推广至同类 campaign。
- **分时段出价策略**：JP 市场 RPG 游戏凌晨降价 30% 可节省约 29% 预算，适用于用户活跃时段差异明显的游戏类型。
- **熔断机制有效性**：KR 市场案例证明自动熔断可避免约 $5,000 无效花费，建议所有 campaign 启用。
- **素材衰减周期**：超休闲游戏素材自然衰减周期约 5 天，建议设置自动替换规则。

### 本周最佳实践
1. 超休闲游戏素材每 5 天更换一次，保持 CTR ≥ 1.5%
2. CPI 超标 2 小时自动触发降价 15%
3. 预算使用达 90% 时启动熔断
4. lookalike 受众扩展可在控制成本前提下提升 40% 安装量

### 待关注风险
- BR 市场 CPI 有上升趋势，需持续监控
- ID 市场 placement 质量波动较大，建议加入自动排除规则`;

export const useMemoryStore = create<MemoryState>((set) => ({
  searchQuery: '',
  searchResults: [],
  weeklyReport: '',
  loading: false,
  reportLoading: false,
  hasSearched: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  search: async (query: string) => {
    set({ loading: true, hasSearched: true, searchQuery: query });
    try {
      // Try real API first
      const res = await aiApi.chat({
        messages: [{ role: 'user', content: `semantic_search:${query}` }],
      });
      if ((res as any)?.data?.results) {
        set({ searchResults: (res as any).data.results });
      } else {
        // Fallback to mock data with simulated delay
        await new Promise((r) => setTimeout(r, 800));
        const queryLower = query.toLowerCase();
        const filtered = mockCases.filter(
          (c) =>
            c.summary.toLowerCase().includes(queryLower) ||
            c.country.toLowerCase().includes(queryLower) ||
            c.platform.toLowerCase().includes(queryLower) ||
            c.campaign_id.toLowerCase().includes(queryLower)
        );
        set({ searchResults: filtered.length > 0 ? filtered : mockCases.slice(0, 5) });
      }
    } catch {
      // Fallback to mock on error
      await new Promise((r) => setTimeout(r, 800));
      set({ searchResults: mockCases.slice(0, 5) });
    } finally {
      set({ loading: false });
    }
  },

  fetchWeeklyReport: async () => {
    set({ reportLoading: true });
    try {
      const res = await aiApi.chat({
        messages: [{ role: 'user', content: 'generate_weekly_memory_report' }],
      });
      if ((res as any)?.data?.content) {
        set({ weeklyReport: (res as any).data.content });
      } else {
        await new Promise((r) => setTimeout(r, 600));
        set({ weeklyReport: mockWeeklyReport });
      }
    } catch {
      await new Promise((r) => setTimeout(r, 600));
      set({ weeklyReport: mockWeeklyReport });
    } finally {
      set({ reportLoading: false });
    }
  },
}));
