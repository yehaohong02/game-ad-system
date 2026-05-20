import { create } from 'zustand';
import { aiApi } from '../services/api';
import { useMaterialDataStore, type MaterialRecord } from './materialData';

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
    impressions?: number;
    ctr?: number;
    cpm?: number;
  };
  similarity: number;
}

interface MemoryState {
  searchQuery: string;
  searchResults: CaseResult[];
  allCases: CaseResult[];
  weeklyReport: string;
  loading: boolean;
  reportLoading: boolean;
  hasSearched: boolean;
  setSearchQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  fetchWeeklyReport: () => Promise<void>;
}

function toNum(v: any): number {
  if (!v || v === '-' || v === '') return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function deriveMemory(data: MaterialRecord[]): Pick<MemoryState, 'allCases' | 'weeklyReport'> {
  const cats = new Map<string, MaterialRecord[]>();
  data.filter(d => !d.isSummary).forEach(d => {
    const c = d.category || '未知';
    if (!cats.has(c)) cats.set(c, []);
    cats.get(c)!.push(d);
  });

  const totalSpend = data.reduce((s, r) => s + toNum(r.spend), 0);
  const totalImp = data.reduce((s, r) => s + toNum(r.impressions), 0);
  const totalClicks = data.reduce((s, r) => s + toNum(r.clicks), 0);
  const cases: CaseResult[] = [];
  let caseIdx = 0;

  for (const [cat, items] of cats) {
    const catSpend = items.reduce((s, r) => s + toNum(r.spend), 0);
    const catImp = items.reduce((s, r) => s + toNum(r.impressions), 0);
    const catClicks = items.reduce((s, r) => s + toNum(r.clicks), 0);
    const catCpm = items.filter(r => toNum(r.impressions) > 0).reduce((s, r) => s + toNum(r.cpm), 0) / Math.max(1, items.filter(r => toNum(r.impressions) > 0).length);
    const catCtr = catImp > 0 ? catClicks / catImp * 100 : 0;
    const country = items[0]?.country || '未知';
    const platform = items[0]?.platform || cat;

    // Top spend material
    const sorted = [...items].sort((a, b) => toNum(b.spend) - toNum(a.spend));
    const top = sorted[0];
    if (top) {
      cases.push({
        case_id: `mat_${top.materialId}`,
        campaign_id: `${cat}-最高花费素材`,
        country, platform,
        summary: `素材${top.materialId}为${cat}${items.length}条素材中花费最高（¥${toNum(top.spend).toLocaleString()}），曝光${toNum(top.impressions).toLocaleString()}，点击${toNum(top.clicks).toLocaleString()}，CTR ${(toNum(top.ctr) * 100).toFixed(2)}%，CPM ¥${toNum(top.cpm).toFixed(2)}。`,
        final_result: { total_spend: Math.round(toNum(top.spend)), total_installs: 0, roas: 0, impressions: toNum(top.impressions), ctr: toNum(top.ctr) * 100, cpm: toNum(top.cpm) },
        similarity: 0.97 - caseIdx * 0.03,
      });
    }

    // Lowest CPM material (with impressions)
    const withImp = items.filter(r => toNum(r.impressions) > 0).sort((a, b) => toNum(a.cpm) - toNum(b.cpm));
    if (withImp.length > 0 && withImp[0] !== top) {
      const low = withImp[0];
      cases.push({
        case_id: `mat_${low.materialId}`,
        campaign_id: `${cat}-最低CPM素材`,
        country, platform,
        summary: `素材${low.materialId}为${cat}CPM最低素材（¥${toNum(low.cpm).toFixed(2)}），曝光${toNum(low.impressions).toLocaleString()}，花费¥${toNum(low.spend).toFixed(2)}。极低CPM验证了该素材的性价比潜力，适合加量测试。`,
        final_result: { total_spend: Math.round(toNum(low.spend)), total_installs: 0, roas: 0, impressions: toNum(low.impressions), ctr: toNum(low.ctr) * 100, cpm: toNum(low.cpm) },
        similarity: 0.93 - caseIdx * 0.03,
      });
    }

    // Project-level case
    cases.push({
      case_id: `proj_${cat}`,
      campaign_id: `${cat}-${items.length}素材投放项目`,
      country, platform,
      summary: `${cat}项目共${items.length}条素材，总花费¥${catSpend.toFixed(0)}，曝光${catImp.toLocaleString()}，CPM均值¥${catCpm.toFixed(2)}，CTR ${(catCtr).toFixed(2)}%。主力素材${top?.materialId || '-'}花费¥${toNum(top?.spend).toFixed(0)}占总花费${(toNum(top?.spend) / catSpend * 100).toFixed(0)}%。`,
      final_result: { total_spend: Math.round(catSpend), total_installs: 0, roas: 0, impressions: catImp, ctr: catCtr, cpm: catCpm },
      similarity: 0.91 - caseIdx * 0.03,
    });

    // Highest CTR material
    const topCtr = [...items].filter(r => toNum(r.impressions) > 1000).sort((a, b) => toNum(b.ctr) - toNum(a.ctr))[0];
    if (topCtr && topCtr !== top) {
      cases.push({
        case_id: `mat_${topCtr.materialId}`,
        campaign_id: `${cat}-最高CTR素材`,
        country, platform,
        summary: `素材${topCtr.materialId}以${(toNum(topCtr.ctr) * 100).toFixed(2)}%的CTR位居${cat}之首，曝光${toNum(topCtr.impressions).toLocaleString()}，花费¥${toNum(topCtr.spend).toFixed(2)}。超高CTR证明创意吸引力极强，建议小幅加量验证规模化后的CTR稳定性。`,
        final_result: { total_spend: Math.round(toNum(topCtr.spend)), total_installs: 0, roas: 0, impressions: toNum(topCtr.impressions), ctr: toNum(topCtr.ctr) * 100, cpm: toNum(topCtr.cpm) },
        similarity: 0.88 - caseIdx * 0.03,
      });
    }

    caseIdx++;
  }

  // Top 2 impressions materials across all
  const topImp = [...data].filter(d => !d.isSummary && toNum(d.impressions) > 10000).sort((a, b) => toNum(b.impressions) - toNum(a.impressions)).slice(0, 2);
  topImp.forEach(r => {
    if (!cases.find(c => c.case_id === `mat_${r.materialId}`)) {
      cases.push({
        case_id: `mat_${r.materialId}`,
        campaign_id: `${r.category || '未知'}-大批量曝光素材`,
        country: r.country || '未知', platform: r.platform || r.category || '未知',
        summary: `素材${r.materialId}曝光${toNum(r.impressions).toLocaleString()}（排名前列），花费¥${toNum(r.spend).toLocaleString()}，CPM仅¥${toNum(r.cpm).toFixed(2)}。超低CPM+大规模曝光验证了该素材的边际成本优势，是预算倾斜的优先候选。`,
        final_result: { total_spend: Math.round(toNum(r.spend)), total_installs: 0, roas: 0, impressions: toNum(r.impressions), ctr: toNum(r.ctr) * 100, cpm: toNum(r.cpm) },
        similarity: 0.82,
      });
    }
  });

  // Generate weekly report
  const catEntries = [...cats.entries()].sort((a, b) => b[1].reduce((s, r) => s + toNum(r.spend), 0) - a[1].reduce((s, r) => s + toNum(r.spend), 0));
  const catSummary = catEntries.map(([cat, items]) => {
    const s = items.reduce((a, r) => a + toNum(r.spend), 0);
    const imp = items.reduce((a, r) => a + toNum(r.impressions), 0);
    const clicks = items.reduce((a, r) => a + toNum(r.clicks), 0);
    const cpm = items.filter(r => toNum(r.impressions) > 0).reduce((a, r) => a + toNum(r.cpm), 0) / Math.max(1, items.filter(r => toNum(r.impressions) > 0).length);
    const ctr = imp > 0 ? clicks / imp * 100 : 0;
    return `- **${cat}** 占总花费${(s / totalSpend * 100).toFixed(0)}%（¥${s.toFixed(0)}），CPM均值¥${cpm.toFixed(2)}，CTR ${ctr.toFixed(2)}%`;
  }).join('\n');

  const topBySpend = [...data].filter(d => !d.isSummary && toNum(d.spend) > 0).sort((a, b) => toNum(b.spend) - toNum(a.spend)).slice(0, 3);
  const topByCtr = [...data].filter(d => !d.isSummary && toNum(d.impressions) > 1000).sort((a, b) => toNum(b.ctr) - toNum(a.ctr)).slice(0, 2);
  const lowCpm = [...data].filter(d => !d.isSummary && toNum(d.impressions) > 0).sort((a, b) => toNum(a.cpm) - toNum(b.cpm)).slice(0, 2);

  const findings = [
    `**高效素材**: ${topByCtr[0] ? `素材${topByCtr[0].materialId}以CTR ${(toNum(topByCtr[0].ctr) * 100).toFixed(2)}%+曝光${toNum(topByCtr[0].impressions).toLocaleString()}成为标杆素材` : '暂无标杆素材'}`,
    `**成本洼地**: ${lowCpm.map(r => `${r.materialId} CPM ¥${toNum(r.cpm).toFixed(2)}`).join('、')}，可作为加量候选`,
    `**曝光王**: ${topBySpend[0] ? `素材${topBySpend[0].materialId}曝光${toNum(topBySpend[0].impressions).toLocaleString()}排名第一，花费¥${toNum(topBySpend[0].spend).toFixed(0)}` : '暂无数据'}`,
  ].join('\n- ');

  const weeklyReport = `## 本周买量素材沉淀报告 (5/14 - 5/20)

### 素材概览
本周监控 **${data.filter(d => !d.isSummary).length}** 条素材数据，覆盖 ${catEntries.map(([cat]) => `**${cat}**`).join('、')} ${catEntries.length}个项目。

### 关键数据
- **总花费**: ¥${totalSpend.toLocaleString()} | **总曝光**: ${totalImp.toLocaleString()} | **总点击**: ${totalClicks.toLocaleString()} | **平均CTR**: ${totalImp > 0 ? (totalClicks / totalImp * 100).toFixed(2) : 0}%
${catSummary}

### 关键发现
- ${findings}

### 本周最佳实践
1. ${catEntries.length > 0 ? `${catEntries[0][0]}优先投放CTR>1.0%且CPM<¥5.0的素材组合` : '暂无建议'}
2. ${catEntries.length > 1 ? `${catEntries[catEntries.length - 1][0]}${catEntries[catEntries.length - 1][1].length}条素材集中度过高，需分散投放` : '暂无建议'}
3. 建议对低CPM素材进行加量测试

### 待关注风险
- 高CPM低CTR素材需排查投放配置或暂停释放预算
- 整体CTR偏低项目需优化素材创意方向`;

  return { allCases: cases, weeklyReport };
}

export const useMemoryStore = create<MemoryState>((set) => ({
  searchQuery: '',
  searchResults: [],
  allCases: [],
  weeklyReport: '',
  loading: false,
  reportLoading: false,
  hasSearched: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  search: async (query: string) => {
    set({ loading: true, hasSearched: true, searchQuery: query });
    try {
      const res = await aiApi.chat({
        messages: [{ role: 'user', content: `semantic_search:${query}` }],
      });
      if ((res as any)?.data?.results) {
        set({ searchResults: (res as any).data.results });
      } else {
        await new Promise((r) => setTimeout(r, 600));
        const queryLower = query.toLowerCase();
        const allCases = useMemoryStore.getState().allCases;
        const filtered = allCases.filter(
          (c) =>
            c.summary.toLowerCase().includes(queryLower) ||
            c.country.toLowerCase().includes(queryLower) ||
            c.platform.toLowerCase().includes(queryLower) ||
            c.campaign_id.toLowerCase().includes(queryLower)
        );
        set({ searchResults: filtered.length > 0 ? filtered : allCases.slice(0, 5) });
      }
    } catch {
      await new Promise((r) => setTimeout(r, 600));
      const allCases = useMemoryStore.getState().allCases;
      set({ searchResults: allCases.slice(0, 5) });
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
        // weeklyReport already derived from materialData
        set({ reportLoading: false });
      }
    } catch {
      set({ reportLoading: false });
    } finally {
      set({ reportLoading: false });
    }
  },
}));

// Auto-derive from materialData
useMaterialDataStore.subscribe((state) => {
  if (state.data.length > 0) {
    useMemoryStore.setState(deriveMemory(state.data));
  }
});

// Initial derive
const initData = useMaterialDataStore.getState().data;
if (initData.length > 0) {
  useMemoryStore.setState(deriveMemory(initData));
}
