import { create } from 'zustand';

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

interface SafetyState {
  budget: BudgetInfo;
  circuitBreakers: CircuitBreaker[];
  rules: RiskRule[];
  auditLog: AuditLogEntry[];
  loading: boolean;
  toggleRule: (ruleId: string) => void;
  deleteRule: (ruleId: string) => void;
  addRule: (rule: RiskRule) => void;
}

export const useSafetyStore = create<SafetyState>((set) => ({
  budget: {
    dailyLimit: 10000,
    dailyUsed: 3280,
    monthlyLimit: 300000,
    monthlyUsed: 89000,
  },
  circuitBreakers: [
    { operation: '广告创建', status: 'closed', failures: 0, threshold: 5 },
    { operation: '出价调整', status: 'closed', failures: 1, threshold: 5 },
    { operation: '预算变更', status: 'half-open', failures: 3, threshold: 5 },
    { operation: '素材上传', status: 'open', failures: 5, threshold: 5 },
    { operation: '批量操作', status: 'closed', failures: 0, threshold: 3 },
  ],
  rules: [
    { rule_id: 'r001', name: '单日预算上限', type: 'budget', condition: '日花费 > $10,000', enabled: true },
    { rule_id: 'r002', name: '月度预算上限', type: 'budget', condition: '月花费 > $300,000', enabled: true },
    { rule_id: 'r003', name: '出价变动频率', type: 'rate', condition: '30min内调价 > 3次', enabled: true },
    { rule_id: 'r004', name: '单次出价上限', type: 'bid', condition: '单次出价 > $50', enabled: false },
    { rule_id: 'r005', name: '异常消耗检测', type: 'budget', condition: '小时消耗 > 日预算20%', enabled: true },
    { rule_id: 'r006', name: '批量暂停限制', type: 'rate', condition: '单次暂停 > 10个计划', enabled: true },
  ],
  auditLog: [
    { timestamp: '2026-05-15 14:32:01', action: '出价调整', user: '张三', detail: 'campaign_001 出价 $5 → $8', result: 'blocked' },
    { timestamp: '2026-05-15 14:28:15', action: '预算变更', user: '李四', detail: 'campaign_002 日预算 $500 → $1000', result: 'success' },
    { timestamp: '2026-05-15 13:55:00', action: '批量暂停', user: '王五', detail: '暂停12个低效计划', result: 'blocked' },
    { timestamp: '2026-05-15 13:20:33', action: '广告创建', user: '张三', detail: '新建 campaign_005', result: 'success' },
    { timestamp: '2026-05-15 12:45:10', action: '素材上传', user: '赵六', detail: '上传视频素材 v_015', result: 'success' },
    { timestamp: '2026-05-15 11:30:22', action: '出价调整', user: '李四', detail: 'campaign_003 出价 $3 → $15', result: 'blocked' },
    { timestamp: '2026-05-15 10:15:45', action: '预算变更', user: '王五', detail: 'campaign_004 月预算 $20K → $50K', result: 'success' },
    { timestamp: '2026-05-15 09:05:18', action: '批量操作', user: '张三', detail: '批量更新5个计划定向', result: 'success' },
  ],
  loading: false,
  toggleRule: (ruleId: string) =>
    set((state) => ({
      rules: state.rules.map((r) =>
        r.rule_id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
    })),
  deleteRule: (ruleId: string) =>
    set((state) => ({
      rules: state.rules.filter((r) => r.rule_id !== ruleId),
    })),
  addRule: (rule: RiskRule) =>
    set((state) => ({
      rules: [...state.rules, rule],
    })),
}));
