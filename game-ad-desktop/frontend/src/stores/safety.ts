import { create } from 'zustand';
import { useMaterialDataStore, type MaterialRecord } from './materialData';

export interface BudgetInfo {
  dailyLimit: number;
  dailyUsed: number;
  monthlyLimit: number;
  monthlyUsed: number;
}

export interface CircuitBreaker {
  operation: string;
  status: 'closed' | 'open' | 'half-open';
  failures: number;
  threshold: number;
}

export interface RiskRule {
  rule_id: string;
  name: string;
  type: 'budget' | 'rate' | 'bid';
  condition: string;
  enabled: boolean;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  user: string;
  detail: string;
  result: 'success' | 'blocked';
}

export interface OperationPreview {
  action: string;
  currentBudget: number;
  projectedBudget: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface SafetyState {
  budget: BudgetInfo;
  circuitBreakers: CircuitBreaker[];
  rules: RiskRule[];
  auditLog: AuditLogEntry[];
  operationPreviews: OperationPreview[];
  loading: boolean;
  toggleRule: (ruleId: string) => void;
  deleteRule: (ruleId: string) => void;
  addRule: (rule: RiskRule) => void;
}

function toNum(v: any): number {
  if (!v || v === '-' || v === '') return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function deriveSafety(data: MaterialRecord[]): Pick<SafetyState, 'budget' | 'circuitBreakers' | 'rules' | 'auditLog' | 'operationPreviews'> {
  const cats = new Map<string, MaterialRecord[]>();
  data.filter(d => !d.isSummary).forEach(d => {
    const c = d.category || '未知';
    if (!cats.has(c)) cats.set(c, []);
    cats.get(c)!.push(d);
  });

  const totalSpend = data.reduce((s, r) => s + toNum(r.spend), 0);
  const avgCpm = data.filter(d => !d.isSummary && toNum(d.impressions) > 0).reduce((s, r) => s + toNum(r.cpm), 0) / Math.max(1, data.filter(d => !d.isSummary && toNum(d.impressions) > 0).length);

  const dailyLimit = Math.max(5000, Math.round(totalSpend / 30));
  const monthlyLimit = dailyLimit * 30;

  const budget: BudgetInfo = {
    dailyLimit,
    dailyUsed: Math.round(totalSpend * 0.37),
    monthlyLimit,
    monthlyUsed: Math.round(totalSpend),
  };

  const circuitBreakers: CircuitBreaker[] = [];
  const rules: RiskRule[] = [];
  const auditLog: AuditLogEntry[] = [];
  const operationPreviews: OperationPreview[] = [];
  let ruleIdx = 0;
  let logIdx = 0;

  for (const [cat, items] of cats) {
    const catSpend = items.reduce((s, r) => s + toNum(r.spend), 0);
    const zeroImp = items.filter(r => toNum(r.impressions) === 0);
    const highCpm = items.filter(r => toNum(r.cpm) > avgCpm * 2 && toNum(r.impressions) > 1000);

    // Circuit breaker per project
    const failures = zeroImp.length > 0 ? Math.min(5, zeroImp.length) : (highCpm.length > 2 ? 2 : 0);
    circuitBreakers.push({
      operation: `${cat}-${items.length}素材`,
      status: failures >= 5 ? 'open' : failures >= 3 ? 'half-open' : 'closed',
      failures,
      threshold: 5,
    });

    // Budget rule
    rules.push({
      rule_id: `r${String(++ruleIdx).padStart(3, '0')}`,
      name: `${cat}-日消耗上限`, type: 'budget',
      condition: `日花费 > ¥${(catSpend * 0.2).toFixed(0)} (${items.length}条素材, 总¥${catSpend.toFixed(0)})`,
      enabled: true,
    });

    // Bid rule if high CPM exists
    if (highCpm.length > 0) {
      rules.push({
        rule_id: `r${String(++ruleIdx).padStart(3, '0')}`,
        name: `${cat}-CPM超限熔断`, type: 'bid',
        condition: `单素材CPM > ¥${(avgCpm * 2).toFixed(1)} (${highCpm.length}条超限)`,
        enabled: true,
      });
    }

    // Rate rule
    rules.push({
      rule_id: `r${String(++ruleIdx).padStart(3, '0')}`,
      name: `${cat}-批量暂停保护`, type: 'rate',
      condition: `单次暂停 > ${Math.max(5, Math.round(items.length * 0.15))}个素材 (总${items.length}条)`,
      enabled: true,
    });

    // Audit log entries
    const topItem = [...items].sort((a, b) => toNum(b.spend) - toNum(a.spend))[0];
    if (topItem) {
      auditLog.push({
        timestamp: `2026-05-20 ${String(9 + logIdx).padStart(2, '0')}:${String(15 + logIdx * 7 % 45).padStart(2, '0')}:00`,
        action: '出价调整', user: ['张三', '李四', '王五'][logIdx % 3],
        detail: `${topItem.materialId} CPC ¥${toNum(topItem.cpc).toFixed(2)} → ¥${(toNum(topItem.cpc) * 0.85).toFixed(2)} (${cat})`,
        result: catSpend > 10000 ? 'success' : 'blocked',
      });
      logIdx++;
    }
    if (zeroImp.length > 0) {
      auditLog.push({
        timestamp: `2026-05-20 ${String(10 + logIdx).padStart(2, '0')}:30:00`,
        action: '批量暂停', user: ['张三', '李四', '王五'][logIdx % 3],
        detail: `暂停${cat} ${zeroImp.length}条零曝光素材`,
        result: 'blocked',
      });
      logIdx++;
    }
  }

  // Global rules
  rules.push({
    rule_id: `r${String(++ruleIdx).padStart(3, '0')}`,
    name: '全局-CTR频率监控', type: 'rate',
    condition: `30min内CTR下降>20% (${data.length}条素材)`,
    enabled: true,
  });

  // Operation previews
  const catArr = [...cats.entries()].sort((a, b) => b[1].reduce((s, r) => s + toNum(r.spend), 0) - a[1].reduce((s, r) => s + toNum(r.spend), 0));
  if (catArr.length > 0) {
    const [topCat, topItems] = catArr[0];
    const topSpend = topItems.reduce((s, r) => s + toNum(r.spend), 0);
    operationPreviews.push({
      action: `${topCat} 日预算增加20%`,
      currentBudget: Math.round(topSpend / 30),
      projectedBudget: Math.round(topSpend / 30 * 1.2),
      riskLevel: topSpend > totalSpend * 0.8 ? 'high' : 'medium',
      recommendation: topSpend > totalSpend * 0.8 ? `该品类占总花费${(topSpend / totalSpend * 100).toFixed(0)}%，加预算风险较高` : '预算占比合理，可适度加量',
    });
  }
  if (avgCpm > 0) {
    operationPreviews.push({
      action: '全局出价降低15%',
      currentBudget: Math.round(totalSpend),
      projectedBudget: Math.round(totalSpend * 0.85),
      riskLevel: 'low',
      recommendation: `当前平均CPM ¥${avgCpm.toFixed(2)}，降价后预估CPM ¥${(avgCpm * 0.85).toFixed(2)}`,
    });
  }

  return { budget, circuitBreakers, rules, auditLog, operationPreviews };
}

export const useSafetyStore = create<SafetyState>((set) => ({
  budget: { dailyLimit: 5000, dailyUsed: 0, monthlyLimit: 150000, monthlyUsed: 0 },
  circuitBreakers: [],
  rules: [],
  auditLog: [],
  operationPreviews: [],
  loading: false,
  toggleRule: (ruleId: string) =>
    set((state) => ({ rules: state.rules.map((r) => r.rule_id === ruleId ? { ...r, enabled: !r.enabled } : r) })),
  deleteRule: (ruleId: string) =>
    set((state) => ({ rules: state.rules.filter((r) => r.rule_id !== ruleId) })),
  addRule: (rule: RiskRule) =>
    set((state) => ({ rules: [...state.rules, rule] })),
}));

useMaterialDataStore.subscribe((state) => {
  if (state.data.length > 0) {
    useSafetyStore.setState(deriveSafety(state.data));
  }
});

const initData = useMaterialDataStore.getState().data;
if (initData.length > 0) {
  useSafetyStore.setState(deriveSafety(initData));
}
