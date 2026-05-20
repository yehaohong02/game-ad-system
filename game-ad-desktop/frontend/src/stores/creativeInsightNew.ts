import { create } from 'zustand';
import materialDataJson from '../data/materialData.json';
import { formulas, structures, Formula, StructureItem } from './workshop';

// Types
export interface TrendItem {
  id: string;
  name: string;
  description: string;
  growth: number;
  tags: string[];
}

export interface CreativeAnalysis {
  id: string;
  name: string;
  thumbnail: string;
  ctr: number;
  cvr: number;
  playRate: number;
  tags: string[];
  status: 'excellent' | 'good' | 'average' | 'poor';
}

export interface OptimizationSuggestion {
  id: string;
  type: 'title' | 'visual' | 'scene' | 'music' | 'cta';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  example?: string;
  impact: string;
  // 新增：关联素材和数据支撑
  relatedMaterials?: { id: string; spend: number; ctr: number; reason: string }[];
  dataEvidence?: string;
}

export interface FormulaRecommendation {
  formulaId: string;
  formulaName: string;
  formulaIcon: string;
  formulaColor: string;
  materials: {
    materialId: string;
    category: string;
    spend: number;
    ctr: number;
    completionRate: number;
    play2sRate: number;
    reason: string; // 为什么这个素材适合这个公式
    expectedImprovement: string;
  }[];
  platformContext?: string; // 来自平台数据的参考
}

export interface PlatformInsight {
  type: 'competitor' | 'trend' | 'media' | 'region';
  title: string;
  detail: string;
  source: string;
  actionable: string;
}

export interface CreativeBrief {
  id: string;
  title: string;
  objective: string;
  targetAudience: string;
  keyMessage: string;
  creativeElements: string[];
  timeline: string;
  budget: string;
  status: 'draft' | 'approved' | 'generated';
}

export interface FormulaWithData extends Formula {
  matchedCategory: string;
  matchedCount: number;
  matchedSpend: number;
  matchedAvgCtr: number;
  matchedAvgCompletion: number;
  dataScore: number;
  structure: StructureItem[];
  recommendations: FormulaRecommendation;
}

export type ActiveTab = 'trends' | 'formulas' | 'analysis' | 'optimization' | 'brief';

interface CreativeInsightState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  trends: TrendItem[];
  creatives: CreativeAnalysis[];
  suggestions: OptimizationSuggestion[];
  selectedSuggestions: string[];
  toggleSuggestion: (id: string) => void;

  formulasWithData: FormulaWithData[];
  selectedFormula: FormulaWithData | null;
  selectFormula: (f: FormulaWithData | null) => void;

  platformInsights: PlatformInsight[];

  brief: CreativeBrief | null;
  generateBrief: () => void;
}

// Map formula tags to material categories
const formulaCategoryMap: Record<string, string[]> = {
  f1: ['SLG', '建造', '经营', '模拟', '生存', '末世', '策略'],
  f2: ['RPG', '剧情', '真人', '角色扮演', '冒险'],
  f3: ['休闲', '解压', '治愈', '模拟经营', '农场', '田园'],
  f4: ['竞技', 'MOBA', '射击', '动作', '吃鸡', '枪战'],
  f5: ['竞技', 'MOBA', '技巧', '对战', '5v5'],
  f6: ['RPG', '卡牌', '角色', '策略', '放置'],
  f7: ['休闲', '益智', '解压', '三消', '消除'],
};

// Formula-specific improvement logic
const formulaImprovementMap: Record<string, { check: (r: any) => boolean; reason: string; expected: string }[]> = {
  f1: [
    { check: r => r.ctr < 0.01 && r.spend > 500, reason: '高花费低CTR，需要更强的开场冲击', expected: 'CTR 提升 30-50%' },
    { check: r => r.play100 / Math.max(r.playCount, 1) < 0.03 && r.playCount > 1000, reason: '完播率低，建造过程缺乏爽感', expected: '完播率提升 2-3 倍' },
    { check: r => r.category.includes('SLG') || r.category.includes('建造'), reason: '品类匹配末世建造公式', expected: '整体效果提升 20-40%' },
  ],
  f2: [
    { check: r => r.ctr > 0.01 && r.play100 / Math.max(r.playCount, 1) < 0.02, reason: 'CTR高但完播低，需要剧情牵引', expected: '完播率提升 3-5 倍' },
    { check: r => r.category.includes('RPG') || r.category.includes('剧情'), reason: '品类适合真人剧情混剪', expected: 'CTR 提升 15-25%' },
  ],
  f3: [
    { check: r => r.ctr < 0.005 && r.spend > 200, reason: '需要治愈系开场降低跳出', expected: 'CTR 提升 40-60%' },
    { check: r => r.category.includes('休闲') || r.category.includes('解压'), reason: '品类匹配解压治愈风格', expected: '用户停留时长 +50%' },
  ],
  f4: [
    { check: r => r.ctr > 0.008 && r.spend > 1000, reason: '已有基础，突发事件钩子可再拉升', expected: 'CTR 再提升 20-30%' },
    { check: r => r.category.includes('竞技') || r.category.includes('射击'), reason: '品类适合竞技快节奏', expected: '转化率提升 25-40%' },
  ],
  f5: [
    { check: r => r.ctr < 0.008 && r.spend > 300, reason: '真人出镜可增加信任感', expected: 'CTR 提升 30-50%' },
    { check: r => r.category.includes('竞技') || r.category.includes('MOBA'), reason: '品类适合技巧展示', expected: '下载转化 +35%' },
  ],
  f6: [
    { check: r => r.ctr > 0.01, reason: '高CTR素材适合首发新角色/玩法', expected: '新内容首发效果 +40%' },
    { check: r => r.category.includes('RPG') || r.category.includes('卡牌'), reason: '品类适合角色/卡牌展示', expected: '用户期待感提升' },
  ],
  f7: [
    { check: r => r.spend > 0 && r.ctr < 0.01, reason: '短平快测试快速验证方向', expected: '测试效率提升 3 倍' },
    { check: r => r.category.includes('休闲') || r.category.includes('益智'), reason: '品类适合快节奏展示', expected: 'CTR 提升 20-35%' },
  ],
};

// Derive trends from real material data
function deriveTrends(): TrendItem[] {
  const data = (materialDataJson as any[]).filter(r => r.spend > 0);
  const catMap: Record<string, { count: number; spend: number; imp: number; clicks: number }> = {};
  data.forEach(r => {
    if (!catMap[r.category]) catMap[r.category] = { count: 0, spend: 0, imp: 0, clicks: 0 };
    const c = catMap[r.category];
    c.count++; c.spend += r.spend; c.imp += r.impressions; c.clicks += r.clicks;
  });

  const cats = Object.entries(catMap)
    .map(([name, v]) => ({ name, ...v, avgCtr: v.imp > 0 ? v.clicks / v.imp : 0 }))
    .sort((a, b) => b.spend - a.spend);

  const trendDefs: TrendItem[] = [];

  if (cats.length > 0) trendDefs.push({ id: 't1', name: `${cats[0].name} 领跑`, description: `「${cats[0].name}」以 $${cats[0].spend.toFixed(0)} 花费位居第一，${cats[0].count} 条素材`, growth: Math.round(cats[0].count / data.length * 100), tags: [cats[0].name, '高花费'] });
  if (cats.length > 1) trendDefs.push({ id: 't2', name: `${cats[1].name} 紧追`, description: `「${cats[1].name}」$${cats[1].spend.toFixed(0)}，CTR ${(cats[1].avgCtr*100).toFixed(2)}%`, growth: Math.round(cats[1].count / data.length * 100), tags: [cats[1].name, '潜力'] });

  const highCtrCats = cats.filter(c => c.avgCtr > 0.01 && c.count >= 3).sort((a, b) => b.avgCtr - a.avgCtr);
  if (highCtrCats.length > 0) trendDefs.push({ id: 't3', name: `高点击: ${highCtrCats[0].name}`, description: `CTR ${(highCtrCats[0].avgCtr*100).toFixed(2)}%，远超均值`, growth: Math.round((highCtrCats[0].avgCtr / 0.008 - 1) * 100), tags: ['高CTR', highCtrCats[0].name] });

  const dataWithPlay = data.filter(r => r.playCount > 0);
  const highCompletion = dataWithPlay.filter(r => r.play100 / r.playCount > 0.05).length;
  if (highCompletion > 0) trendDefs.push({ id: 't4', name: '高完播素材涌现', description: `${highCompletion} 条素材完播率超 5%`, growth: Math.round(highCompletion / dataWithPlay.length * 100), tags: ['完播率', '视频质量'] });

  const lowCtrCount = data.filter(r => r.ctr > 0 && r.ctr < 0.003).length;
  if (lowCtrCount > 0) trendDefs.push({ id: 't5', name: '低效素材预警', description: `${lowCtrCount} 条素材 CTR < 0.3%`, growth: -Math.round(lowCtrCount / data.length * 100), tags: ['低CTR', '需优化'] });

  return trendDefs;
}

// Derive formulas with real data matching + material-level recommendations
function deriveFormulasWithData(): FormulaWithData[] {
  const data = (materialDataJson as any[]).filter(r => r.spend > 0);
  const catMap: Record<string, { count: number; spend: number; imp: number; clicks: number; play: number; play100: number }> = {};
  data.forEach(r => {
    if (!catMap[r.category]) catMap[r.category] = { count: 0, spend: 0, imp: 0, clicks: 0, play: 0, play100: 0 };
    const c = catMap[r.category];
    c.count++; c.spend += r.spend; c.imp += r.impressions; c.clicks += r.clicks; c.play += r.playCount; c.play100 += r.play100;
  });

  return formulas.map(f => {
    const matchCats = formulaCategoryMap[f.id] || [];
    const matched = Object.entries(catMap).filter(([name]) => matchCats.some(k => name.includes(k)));
    const totalMatched = matched.reduce((s, [, v]) => s + v.count, 0);
    const totalSpend = matched.reduce((s, [, v]) => s + v.spend, 0);
    const totalImp = matched.reduce((s, [, v]) => s + v.imp, 0);
    const totalClicks = matched.reduce((s, [, v]) => s + v.clicks, 0);
    const totalPlay = matched.reduce((s, [, v]) => s + v.play, 0);
    const totalPlay100 = matched.reduce((s, [, v]) => s + v.play100, 0);
    const avgCtr = totalImp > 0 ? totalClicks / totalImp : 0;
    const avgCompletion = totalPlay > 0 ? totalPlay100 / totalPlay : 0;
    const matchedCategory = matched.map(([name]) => name).join('、') || '无匹配';
    const dataScore = totalMatched * 10 + totalSpend * 0.01 + avgCtr * 10000;

    // === 素材级别推荐 ===
    const improvementRules = formulaImprovementMap[f.id] || [];
    const materialRecs: FormulaRecommendation['materials'] = [];

    data.forEach(r => {
      for (const rule of improvementRules) {
        if (rule.check(r)) {
          materialRecs.push({
            materialId: r.materialId,
            category: r.category,
            spend: r.spend,
            ctr: r.ctr,
            completionRate: r.playCount > 0 ? r.play100 / r.playCount : 0,
            play2sRate: r.playCount > 0 ? r.play2s / r.playCount : 0,
            reason: rule.reason,
            expectedImprovement: rule.expected,
          });
          break; // 每个素材只匹配一条规则
        }
      }
    });

    // 按花费排序，取前5个推荐
    materialRecs.sort((a, b) => b.spend - a.spend);
    const topRecs = materialRecs.slice(0, 5);

    const recommendations: FormulaRecommendation = {
      formulaId: f.id,
      formulaName: f.name,
      formulaIcon: f.icon,
      formulaColor: f.color,
      materials: topRecs,
    };

    return {
      ...f,
      matchedCategory,
      matchedCount: totalMatched,
      matchedSpend: totalSpend,
      matchedAvgCtr: avgCtr,
      matchedAvgCompletion: avgCompletion,
      dataScore,
      structure: structures[f.id] || [],
      recommendations,
    };
  }).sort((a, b) => b.dataScore - a.dataScore);
}

// Derive creative analysis
function deriveCreatives(): CreativeAnalysis[] {
  const data = (materialDataJson as any[]).filter(r => r.spend > 0);
  return data.sort((a, b) => b.spend - a.spend).slice(0, 20).map(r => {
    const ctr = r.ctr || 0;
    const playRate = r.playCount > 0 ? r.play2s / r.playCount : 0;
    const completionRate = r.playCount > 0 ? r.play100 / r.playCount : 0;
    let status: CreativeAnalysis['status'] = 'poor';
    if (ctr > 0.015 && completionRate > 0.05) status = 'excellent';
    else if (ctr > 0.008) status = 'good';
    else if (ctr > 0.003) status = 'average';

    const tags: string[] = [r.category];
    if (ctr > 0.015) tags.push('高CTR');
    if (completionRate > 0.05) tags.push('高完播');
    if (r.cpm > 8) tags.push('高CPM');

    return {
      id: r.materialId,
      name: `${r.materialId} (${r.category})`,
      thumbnail: r.preview || `https://picsum.photos/seed/${r.materialId}/120/80`,
      ctr: +(ctr * 100).toFixed(2),
      cvr: +(playRate * 100).toFixed(1),
      playRate: +(completionRate * 100).toFixed(1),
      tags,
      status,
    };
  });
}

// Derive optimization suggestions with data evidence + material references
function deriveSuggestions(): OptimizationSuggestion[] {
  const data = (materialDataJson as any[]).filter(r => r.spend > 0);
  const suggestions: OptimizationSuggestion[] = [];

  // 低CTR素材 — 关联具体素材
  const lowCtr = data.filter(r => r.ctr > 0 && r.ctr < 0.003);
  if (lowCtr.length > 0) {
    const wastedSpend = lowCtr.reduce((s, r) => s + r.spend, 0);
    const topLowCtr = lowCtr.sort((a, b) => b.spend - a.spend).slice(0, 3);
    suggestions.push({
      id: 's1', type: 'visual', priority: 'high',
      suggestion: `${lowCtr.length} 条素材 CTR < 0.3%，浪费 $${wastedSpend.toFixed(0)}`,
      example: '重新设计封面，增加视觉冲击力；前3秒加入悬念',
      impact: `预计节省 $${(wastedSpend * 0.3).toFixed(0)}`,
      relatedMaterials: topLowCtr.map(r => ({
        id: r.materialId, spend: r.spend, ctr: r.ctr,
        reason: `花费 $${r.spend.toFixed(0)} 但 CTR 仅 ${(r.ctr*100).toFixed(2)}%，严重低于均值`,
      })),
      dataEvidence: `${lowCtr.length} 条低效素材占总素材 ${((lowCtr.length/data.length)*100).toFixed(0)}%，花费占比 ${((wastedSpend/data.reduce((s,r)=>s+r.spend,0))*100).toFixed(1)}%`,
    });
  }

  // 高CPM素材
  const highCpm = data.filter(r => r.cpm > 8);
  if (highCpm.length > 0) {
    const topCpm = highCpm.sort((a, b) => b.cpm - a.cpm).slice(0, 3);
    suggestions.push({
      id: 's2', type: 'scene', priority: 'high',
      suggestion: `${highCpm.length} 条素材 CPM > $8，展示成本偏高`,
      example: '调整投放时段，测试更广泛受众',
      impact: 'CPM 降低 20-30%',
      relatedMaterials: topCpm.map(r => ({
        id: r.materialId, spend: r.spend, ctr: r.ctr,
        reason: `CPM $${r.cpm.toFixed(2)}，展示成本是均值的 ${(r.cpm / (data.reduce((s,r)=>s+r.cpm,0)/data.length)).toFixed(1)} 倍`,
      })),
      dataEvidence: `平均 CPM $${(data.reduce((s,r)=>s+r.cpm,0)/data.length).toFixed(2)}，高CPM素材占比 ${((highCpm.length/data.length)*100).toFixed(0)}%`,
    });
  }

  // 低完播率素材
  const dataWithPlay = data.filter(r => r.playCount > 100);
  const lowCompletion = dataWithPlay.filter(r => r.play100 / r.playCount < 0.02);
  if (lowCompletion.length > 0) {
    const topLow = lowCompletion.sort((a, b) => b.spend - a.spend).slice(0, 3);
    suggestions.push({
      id: 's3', type: 'title', priority: 'medium',
      suggestion: `${lowCompletion.length} 条素材完播率 < 2%，用户看完就走`,
      example: '缩短时长至 15 秒，开头展示精彩 gameplay',
      impact: '完播率提升 3-5 倍',
      relatedMaterials: topLow.map(r => ({
        id: r.materialId, spend: r.spend, ctr: r.ctr,
        reason: `播放 ${r.playCount.toLocaleString()} 次但完播仅 ${((r.play100/r.playCount)*100).toFixed(1)}%`,
      })),
      dataEvidence: `整体完播率 ${(dataWithPlay.reduce((s,r)=>s+r.play100,0)/dataWithPlay.reduce((s,r)=>s+r.playCount,0)*100).toFixed(1)}%，低完播素材占 ${((lowCompletion.length/dataWithPlay.length)*100).toFixed(0)}%`,
    });
  }

  // 高CTR素材可扩大
  const highCtr = data.filter(r => r.ctr > 0.015);
  if (highCtr.length > 0) {
    const topHigh = highCtr.sort((a, b) => b.spend - a.spend).slice(0, 3);
    suggestions.push({
      id: 's4', type: 'cta', priority: 'medium',
      suggestion: `${highCtr.length} 条高 CTR 素材可扩大投放`,
      example: '追加预算，拓展更多地区',
      impact: '新增安装量 +40-60%',
      relatedMaterials: topHigh.map(r => ({
        id: r.materialId, spend: r.spend, ctr: r.ctr,
        reason: `CTR ${(r.ctr*100).toFixed(2)}% 远超均值，追加投放 ROI 更高`,
      })),
      dataEvidence: `高CTR素材平均 CTR ${(highCtr.reduce((s,r)=>s+r.ctr,0)/highCtr.length*100).toFixed(2)}%，是整体均值的 ${(highCtr.reduce((s,r)=>s+r.ctr,0)/highCtr.length/(data.reduce((s,r)=>s+r.ctr,0)/data.length)).toFixed(1)} 倍`,
    });
  }

  // 高花费素材需要公式优化 — 这是新的核心建议
  const highSpendLowEfficiency = data.filter(r => r.spend > 1000 && r.ctr < 0.01);
  if (highSpendLowEfficiency.length > 0) {
    const top = highSpendLowEfficiency.sort((a, b) => b.spend - a.spend).slice(0, 3);
    const bestFormula = formulas.find(f => {
      const cats = formulaCategoryMap[f.id] || [];
      return cats.some(k => top[0].category.includes(k));
    });
    suggestions.push({
      id: 's6', type: 'visual', priority: 'high',
      suggestion: `${highSpendLowEfficiency.length} 条高花费素材效率偏低，建议套用爆款公式`,
      example: bestFormula ? `推荐「${bestFormula.name}」公式，参考 ${bestFormula.caseStudy}` : '参考创意工坊爆款公式重新制作',
      impact: `预计提升 ROI 30-50%`,
      relatedMaterials: top.map(r => ({
        id: r.materialId, spend: r.spend, ctr: r.ctr,
        reason: `花费 $${r.spend.toFixed(0)} 但 CTR 仅 ${(r.ctr*100).toFixed(2)}%，需要创意升级`,
      })),
      dataEvidence: `${highSpendLowEfficiency.length} 条素材总花费 $${highSpendLowEfficiency.reduce((s,r)=>s+r.spend,0).toFixed(0)}，占总预算 ${(highSpendLowEfficiency.reduce((s,r)=>s+r.spend,0)/data.reduce((s,r)=>s+r.spend,0)*100).toFixed(1)}%`,
    });
  }

  suggestions.push({ id: 's5', type: 'music', priority: 'medium', suggestion: '增加 UGC 风格素材占比', example: '模拟真实玩家录屏、弹幕互动、热门 BGM', impact: 'CTR +15-25%，成本 -50%' });

  return suggestions;
}

export const useCreativeInsightStore = create<CreativeInsightState>((set, get) => ({
  activeTab: 'trends',
  setActiveTab: (tab) => set({ activeTab: tab }),

  trends: deriveTrends(),
  creatives: deriveCreatives(),
  suggestions: deriveSuggestions(),
  selectedSuggestions: [],
  toggleSuggestion: (id) => {
    const { selectedSuggestions } = get();
    set({ selectedSuggestions: selectedSuggestions.includes(id) ? selectedSuggestions.filter(s => s !== id) : [...selectedSuggestions, id] });
  },

  formulasWithData: deriveFormulasWithData(),
  selectedFormula: null,
  selectFormula: (f) => set({ selectedFormula: f }),

  platformInsights: [],

  brief: null,
  generateBrief: () => {
    const { suggestions, selectedSuggestions, selectedFormula, formulasWithData } = get();
    const selected = selectedSuggestions.length > 0 ? suggestions.filter(s => selectedSuggestions.includes(s.id)) : suggestions.filter(s => s.priority === 'high');

    const data = (materialDataJson as any[]).filter(r => r.spend > 0);
    const totalSpend = data.reduce((s, r) => s + r.spend, 0);
    const cats = [...new Set(data.map(r => r.category))];

    const formulaHint = selectedFormula
      ? `参考「${selectedFormula.name}」公式（${selectedFormula.caseStudy}），匹配分类：${selectedFormula.matchedCategory}`
      : `推荐使用 ${formulasWithData[0]?.name || '爆款公式'}`;

    // 从公式推荐中提取具体素材
    const formulaRecs = selectedFormula?.recommendations.materials || formulasWithData[0]?.recommendations.materials || [];
    const materialActions = formulaRecs.slice(0, 3).map(m =>
      `素材 ${m.materialId}（${m.category}）：${m.reason}，${m.expectedImprovement}`
    );

    set({
      brief: {
        id: 'brief-1',
        title: `${cats[0] || '游戏'}品类素材创意优化简报`,
        objective: '提升素材 CTR 和完播率，降低无效花费',
        targetAudience: '核心游戏玩家（18-35岁）',
        keyMessage: `基于 ${data.length} 条素材（$${totalSpend.toFixed(0)}）分析。${formulaHint}`,
        creativeElements: [
          ...selected.map(s => s.suggestion),
          ...materialActions,
        ],
        timeline: '1-2 周完成迭代',
        budget: `$${(totalSpend * 0.2).toFixed(0)}（当前 20% 用于测试）`,
        status: 'generated',
      },
    });
  },
}));
