import { create } from 'zustand';
import { executionApi } from '../services/api';

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

interface ExecutionState {
  mode: ExecutionMode;
  rules: Rule[];
  queue: QueueTask[];
  logs: LogEntry[];
  loading: boolean;
  setMode: (mode: ExecutionMode) => void;
  addRule: (rule: Omit<Rule, 'rule_id'>) => void;
  toggleRule: (ruleId: string) => void;
  deleteRule: (ruleId: string) => void;
  runAgent: () => Promise<void>;
}

const mockRules: Rule[] = [
  { rule_id: 'r_001', name: 'CPI超限自动降价', condition: 'CPI > $3.0 持续 2h', action: '出价降低 15%', enabled: true },
  { rule_id: 'r_002', name: 'ROAS达标加预算', condition: 'ROAS ≥ 1.2 持续 24h', action: '日预算增加 20%', enabled: true },
  { rule_id: 'r_003', name: 'CTR过低暂停素材', condition: 'CTR < 0.5% 持续 6h', action: '暂停关联素材', enabled: false },
  { rule_id: 'r_004', name: '花费超预算熔断', condition: '日花费 > 预算 90%', action: '暂停全部投放', enabled: true },
];

const mockQueue: QueueTask[] = [
  { task_id: 't_001', type: '出价调整', status: 'done', created_at: '2026-05-15 10:30' },
  { task_id: 't_002', type: '素材暂停', status: 'done', created_at: '2026-05-15 10:15' },
  { task_id: 't_003', type: '预算分配', status: 'running', created_at: '2026-05-15 10:45' },
  { task_id: 't_004', type: '人群包更新', status: 'pending', created_at: '2026-05-15 11:00' },
  { task_id: 't_005', type: '异常检测', status: 'failed', created_at: '2026-05-15 09:50' },
];

const mockLogs: LogEntry[] = [
  { timestamp: '10:45:01', level: 'info', message: 'Agent 启动: 开始执行预算分配任务' },
  { timestamp: '10:45:03', level: 'info', message: '读取 campaign_001 当前日预算: $500' },
  { timestamp: '10:45:05', level: 'warn', message: 'campaign_003 CPI 偏高 ($5.2), 建议降低出价' },
  { timestamp: '10:45:08', level: 'info', message: '执行规则: CPI超限自动降价 -> campaign_003 出价降低 15%' },
  { timestamp: '10:45:10', level: 'error', message: 'campaign_005 API 调用超时, 重试中...' },
  { timestamp: '10:45:12', level: 'info', message: 'campaign_005 重试成功, 出价已更新' },
  { timestamp: '10:45:15', level: 'info', message: '预算分配完成: campaign_001 $500, campaign_002 $300, campaign_003 $200' },
  { timestamp: '10:45:18', level: 'warn', message: '总花费已达日预算 85%, 接近熔断阈值' },
];

let ruleCounter = 5;

export const useExecutionStore = create<ExecutionState>((set) => ({
  mode: 'semi-auto',
  rules: mockRules,
  queue: mockQueue,
  logs: mockLogs,
  loading: false,

  setMode: (mode) => set({ mode }),

  addRule: (rule) =>
    set((state) => ({
      rules: [
        ...state.rules,
        { ...rule, rule_id: `r_${String(ruleCounter++).padStart(3, '0')}` },
      ],
    })),

  toggleRule: (ruleId) =>
    set((state) => ({
      rules: state.rules.map((r) =>
        r.rule_id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
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
