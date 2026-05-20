import { create } from 'zustand';
import { executionApi } from '../services/api';
import { useMaterialDataStore, type MaterialRecord } from './materialData';

export type ExecutionMode = 'manual' | 'semi-auto' | 'full-auto';

export interface Rule {
  rule_id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface QueueTask {
  task_id: string;
  type: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  created_at: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface AgentStep {
  step: number;
  thinking: string;
  action: string;
  result: string;
  status: 'done' | 'running' | 'pending';
}

export interface CompetitiveInsight {
  title: string;
  source: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  relatedMaterials?: string[];
}

interface ExecutionState {
  mode: ExecutionMode;
  rules: Rule[];
  queue: QueueTask[];
  logs: LogEntry[];
  agentSteps: AgentStep[];
  insights: CompetitiveInsight[];
  loading: boolean;
  setMode: (mode: ExecutionMode) => void;
  addRule: (rule: Omit<Rule, 'rule_id'>) => void;
  toggleRule: (ruleId: string) => void;
  deleteRule: (ruleId: string) => void;
  runAgent: () => Promise<void>;
}

function toNum(v: any): number {
  if (!v || v === '-' || v === '') return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function deriveExecution(data: MaterialRecord[]): Pick<ExecutionState, 'rules' | 'queue' | 'logs' | 'agentSteps' | 'insights'> {
  const cats = new Map<string, MaterialRecord[]>();
  data.filter(d => !d.isSummary).forEach(d => {
    const c = d.category || '未知';
    if (!cats.has(c)) cats.set(c, []);
    cats.get(c)!.push(d);
  });

  const rules: Rule[] = [];
  const logs: LogEntry[] = [];
  const agentSteps: AgentStep[] = [];
  const insights: CompetitiveInsight[] = [];
  let ruleIdx = 0;
  let taskIdx = 0;
  const queue: QueueTask[] = [];
  let step = 0;

  // Step 1: Scan all materials
  agentSteps.push({
    step: ++step, thinking: `扫描 ${data.length} 条素材数据，识别 ${cats.size} 个项目`,
    action: '数据加载', result: `${data.filter(d => !d.isSummary).length} 条有效素材`, status: 'done',
  });
  logs.push({ timestamp: '10:00:01', level: 'info', message: `Agent 启动: 扫描 ${cats.size} 个项目 ${data.length} 条素材` });

  for (const [cat, items] of cats) {
    const totalSpend = items.reduce((s, r) => s + toNum(r.spend), 0);
    const totalImp = items.reduce((s, r) => s + toNum(r.impressions), 0);
    const avgCpm = items.reduce((s, r) => s + toNum(r.cpm), 0) / items.length;
    const avgCtr = totalImp > 0 ? items.reduce((s, r) => s + toNum(r.clicks), 0) / totalImp * 100 : 0;

    // Step: Analyze each project
    agentSteps.push({
      step: ++step, thinking: `分析「${cat}」: ${items.length}条素材, 总花费¥${totalSpend.toFixed(0)}, 均CPM¥${avgCpm.toFixed(2)}, CTR ${avgCtr.toFixed(2)}%`,
      action: '项目分析', result: `${cat} 数据扫描完成`, status: 'done',
    });

    // Rule: Low CTR materials
    const lowCtr = items.filter(r => toNum(r.impressions) > 10000 && (toNum(r.clicks) / toNum(r.impressions) * 100) < 0.5);
    if (lowCtr.length > 0) {
      rules.push({
        rule_id: `r_${String(++ruleIdx).padStart(3, '0')}`,
        name: `${cat}-低CTR素材降频`, condition: `CTR < 0.5% 且 曝光>1万 (${lowCtr.length}条)`, action: '暂停低效素材', enabled: true,
      });
      logs.push({ timestamp: `10:00:${String(3 + step).padStart(2, '0')}`, level: 'warn', message: `${cat} ${lowCtr.length}条素材CTR<0.5%, 已生成降频规则` });
      queue.push({ task_id: `t_${String(++taskIdx).padStart(3, '0')}`, type: `${cat}-低CTR扫描`, status: 'done', created_at: '2026-05-20 09:15' });
    }

    // Rule: High CPM materials
    const highCpm = items.filter(r => toNum(r.cpm) > avgCpm * 2 && toNum(r.impressions) > 1000);
    if (highCpm.length > 0) {
      rules.push({
        rule_id: `r_${String(++ruleIdx).padStart(3, '0')}`,
        name: `${cat}-CPM超限降价`, condition: `CPM > ¥${(avgCpm * 2).toFixed(1)} (${highCpm.length}条超限)`, action: '出价降低 15%', enabled: true,
      });
    }

    // Rule: Zero impression materials
    const zeroImp = items.filter(r => toNum(r.impressions) === 0);
    if (zeroImp.length > 0) {
      rules.push({
        rule_id: `r_${String(++ruleIdx).padStart(3, '0')}`,
        name: `${cat}-无曝光暂停`, condition: `曝光 = 0 (${zeroImp.length}条素材)`, action: '自动暂停投放', enabled: true,
      });
      insights.push({
        title: `${cat} ${zeroImp.length}条素材零曝光`,
        source: '数据诊断', suggestion: '排查投放配置或暂停释放预算', priority: 'high',
        relatedMaterials: zeroImp.map(r => String(r.materialId)),
      });
    }

    // Rule: High performer boost
    const topCtr = [...items].filter(r => toNum(r.impressions) > 1000).sort((a, b) => toNum(b.ctr) - toNum(a.ctr));
    if (topCtr.length > 0 && toNum(topCtr[0].ctr) * 100 > 1.5) {
      rules.push({
        rule_id: `r_${String(++ruleIdx).padStart(3, '0')}`,
        name: `${cat}-高效素材加量`, condition: `CTR > 1.5% (最高: ${topCtr[0].materialId} ${(toNum(topCtr[0].ctr) * 100).toFixed(2)}%)`, action: '日预算增加 30%', enabled: false,
      });
      insights.push({
        title: `${topCtr[0].materialId} CTR ${(toNum(topCtr[0].ctr) * 100).toFixed(2)}% 为项目最高`,
        source: '素材分析', suggestion: '小幅加量验证规模化后的CTR稳定性', priority: 'medium',
        relatedMaterials: [String(topCtr[0].materialId)],
      });
    }

    // Rule: Completion rate check
    const lowPlay = items.filter(r => toNum(r.playCount) > 50000 && toNum(r.play100) / toNum(r.playCount) < 0.1);
    if (lowPlay.length > 0) {
      rules.push({
        rule_id: `r_${String(++ruleIdx).padStart(3, '0')}`,
        name: `${cat}-完播率优化`, condition: `完播率 < 10% 且 播放>5万 (${lowPlay.length}条)`, action: '标记素材待优化', enabled: true,
      });
    }
  }

  // Global rule
  const totalSpendAll = data.reduce((s, r) => s + toNum(r.spend), 0);
  rules.push({
    rule_id: `r_${String(++ruleIdx).padStart(3, '0')}`,
    name: '全局-日消耗熔断', condition: `日花费 > ¥5,000 (当前总花费¥${totalSpendAll.toFixed(0)})`, action: '暂停全部投放', enabled: true,
  });

  // Cross-project insight
  const catEntries = [...cats.entries()].sort((a, b) =>
    b[1].reduce((s, r) => s + toNum(r.spend), 0) - a[1].reduce((s, r) => s + toNum(r.spend), 0)
  );
  if (catEntries.length > 1) {
    const [topCat, topItems] = catEntries[0];
    const topSpend = topItems.reduce((s, r) => s + toNum(r.spend), 0);
    const pct = (topSpend / totalSpendAll * 100).toFixed(0);
    insights.push({
      title: `${topCat} 占总花费${pct}%`,
      source: '预算分析', suggestion: parseInt(pct) > 80 ? '过度集中，建议分散投放降低风险' : '预算分配合理',
      priority: parseInt(pct) > 80 ? 'high' : 'low',
    });
  }

  // Agent final step
  agentSteps.push({
    step: ++step, thinking: `生成 ${rules.length} 条规则, ${insights.length} 条策略建议, ${queue.length} 个任务`,
    action: '决策汇总', result: `完成分析，等待执行确认`, status: 'done',
  });

  // Running task
  if (data.length > 0) {
    const first = data[0];
    queue.push({ task_id: `t_${String(++taskIdx).padStart(3, '0')}`, type: `${first.materialId}-曝光优化调整`, status: 'running', created_at: '2026-05-20 10:00' });
    agentSteps.push({ step: ++step, thinking: `正在执行 ${first.materialId} 的出价调整...`, action: '执行中', result: '等待结果', status: 'running' });
    queue.push({ task_id: `t_${String(++taskIdx).padStart(3, '0')}`, type: '全量CTR扫描', status: 'pending', created_at: '2026-05-20 10:15' });
  }

  return { rules, queue, logs, agentSteps, insights };
}

let ruleCounter = 100;

export const useExecutionStore = create<ExecutionState>((set) => ({
  mode: 'semi-auto',
  rules: [],
  queue: [],
  logs: [],
  agentSteps: [],
  insights: [],
  loading: false,

  setMode: (mode) => set({ mode }),

  addRule: (rule) =>
    set((state) => ({
      rules: [...state.rules, { ...rule, rule_id: `r_${String(ruleCounter++).padStart(3, '0')}` }],
    })),

  toggleRule: (ruleId) =>
    set((state) => ({
      rules: state.rules.map((r) => r.rule_id === ruleId ? { ...r, enabled: !r.enabled } : r),
    })),

  deleteRule: (ruleId) =>
    set((state) => ({
      rules: state.rules.filter((r) => r.rule_id !== ruleId),
    })),

  runAgent: async () => {
    set({ loading: true });
    try {
      await executionApi.runAgent({ mode: 'auto' });
    } catch {
      // swallow in mock mode
    } finally {
      set({ loading: false });
    }
  },
}));

// Auto-derive from materialData
useMaterialDataStore.subscribe((state) => {
  if (state.data.length > 0) {
    useExecutionStore.setState(deriveExecution(state.data));
  }
});

// Initial derive
const initData = useMaterialDataStore.getState().data;
if (initData.length > 0) {
  useExecutionStore.setState(deriveExecution(initData));
}
