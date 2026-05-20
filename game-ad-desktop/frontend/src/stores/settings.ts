import { create } from 'zustand';

// ---- Provider Presets ----

export interface ProviderPreset {
  id: string;
  name: string;
  category: 'official' | 'china' | 'aggregator' | 'cloud' | 'custom';
  baseUrl: string;
  apiFormat: 'openai' | 'anthropic' | 'custom';
  defaultModel: string;
  models: string[];
  description?: string;
  needsBaseUrl?: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  // ---- 官方 & 大厂 ----
  { id: 'anthropic', name: 'Claude Official', category: 'official', baseUrl: 'https://api.anthropic.com', apiFormat: 'anthropic', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'] },
  { id: 'openai', name: 'OpenAI', category: 'official', baseUrl: 'https://api.openai.com/v1', apiFormat: 'openai', defaultModel: 'gpt-4.1', models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3', 'o3-mini', 'o4-mini', 'o1-mini', 'o1-preview', 'gpt-4.5-preview'] },
  { id: 'google', name: 'Gemini Native', category: 'official', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', apiFormat: 'custom', defaultModel: 'gemini-2.5-pro', models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'] },
  { id: 'deepseek', name: 'DeepSeek', category: 'official', baseUrl: 'https://api.deepseek.com/v1', apiFormat: 'openai', defaultModel: 'deepseek-chat', models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'] },
  { id: 'zhipu', name: 'Zhipu GLM', category: 'official', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', apiFormat: 'openai', defaultModel: 'glm-4-plus', models: ['glm-4-plus', 'glm-4-flash', 'glm-4-air', 'glm-4-long', 'glm-4-flashx', 'codegeex-4'] },
  { id: 'zhipu_en', name: 'Zhipu GLM en', category: 'official', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', apiFormat: 'openai', defaultModel: 'glm-4-plus', models: ['glm-4-plus', 'glm-4-flash', 'glm-4-air'] },
  { id: 'bailian', name: 'Bailian', category: 'official', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiFormat: 'openai', defaultModel: 'qwen-max', models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long', 'qwen-vl-max', 'qwen-vl-plus', 'qwq-32b', 'qwen3-235b-a22b', 'qwen3-32b', 'qwen3-30b-a3b'] },
  { id: 'bailian_coding', name: 'Bailian For Coding', category: 'official', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiFormat: 'openai', defaultModel: 'qwen-coder-turbo', models: ['qwen-coder-turbo', 'qwen-coder-plus', 'qwen2.5-coder-32b-instruct'] },
  { id: 'kimi', name: 'Kimi', category: 'official', baseUrl: 'https://api.moonshot.cn/v1', apiFormat: 'openai', defaultModel: 'moonshot-v1-128k', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
  { id: 'kimi_coding', name: 'Kimi For Coding', category: 'official', baseUrl: 'https://api.moonshot.cn/v1', apiFormat: 'openai', defaultModel: 'k2-latest', models: ['k2-latest', 'k2-0711'] },
  { id: 'stepfun', name: 'StepFun', category: 'official', baseUrl: 'https://api.stepfun.com/v1', apiFormat: 'openai', defaultModel: 'step-2-16k', models: ['step-2-16k', 'step-2-flash', 'step-1-flash'] },
  { id: 'stepfun_en', name: 'StepFun en', category: 'official', baseUrl: 'https://api.stepfun.com/v1', apiFormat: 'openai', defaultModel: 'step-2-16k', models: ['step-2-16k', 'step-2-flash'] },
  { id: 'minimax', name: 'MiniMax', category: 'official', baseUrl: 'https://api.minimax.chat/v1', apiFormat: 'openai', defaultModel: 'MiniMax-Text-01', models: ['MiniMax-Text-01', 'abab7-chat', 'abab6.5s-chat'] },
  { id: 'minimax_en', name: 'MiniMax en', category: 'official', baseUrl: 'https://api.minimax.chat/v1', apiFormat: 'openai', defaultModel: 'MiniMax-Text-01', models: ['MiniMax-Text-01', 'abab7-chat'] },
  { id: 'doubao', name: 'DouBaoSeed', category: 'official', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', apiFormat: 'openai', defaultModel: 'doubao-1.5-pro-256k', models: ['doubao-1.5-pro-256k', 'doubao-1.5-pro-32k', 'doubao-pro-256k', 'doubao-pro-32k', 'doubao-lite-32k'] },
  { id: 'xiaomi', name: 'Xiaomi MiMo', category: 'official', baseUrl: 'https://api.xiaomi.com/v1', apiFormat: 'openai', defaultModel: 'MiMo-7B-RL', models: ['MiMo-7B-RL'] },
  { id: 'github_copilot', name: 'GitHub Copilot', category: 'official', baseUrl: 'https://api.githubcopilot.com', apiFormat: 'openai', defaultModel: 'gpt-4o', models: ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4-6', 'o3-mini', 'o4-mini'] },
  { id: 'codex', name: 'Codex', category: 'official', baseUrl: 'https://api.openai.com/v1', apiFormat: 'openai', defaultModel: 'codex-mini-latest', models: ['codex-mini-latest', 'o4-mini'] },

  // ---- 云服务商 ----
  { id: 'aws_bedrock_aksk', name: 'AWS Bedrock (AKSK)', category: 'cloud', baseUrl: 'https://bedrock-runtime.{region}.amazonaws.com', apiFormat: 'custom', defaultModel: 'anthropic.claude-sonnet-4-6-v1:0', models: ['anthropic.claude-opus-4-7-v1:0', 'anthropic.claude-opus-4-6-v1:0', 'anthropic.claude-sonnet-4-6-v1:0', 'anthropic.claude-haiku-4-5-20251001-v1:0', 'anthropic.claude-3-7-sonnet-v1:0'] },
  { id: 'aws_bedrock_key', name: 'AWS Bedrock (API Key)', category: 'cloud', baseUrl: 'https://bedrock-runtime.{region}.amazonaws.com', apiFormat: 'custom', defaultModel: 'anthropic.claude-sonnet-4-6-v1:0', models: ['anthropic.claude-opus-4-7-v1:0', 'anthropic.claude-opus-4-6-v1:0', 'anthropic.claude-sonnet-4-6-v1:0', 'anthropic.claude-haiku-4-5-20251001-v1:0'] },
  { id: 'nvidia', name: 'Nvidia', category: 'cloud', baseUrl: 'https://integrate.api.nvidia.com/v1', apiFormat: 'openai', defaultModel: 'meta/llama-3.3-70b-instruct', models: ['meta/llama-3.3-70b-instruct', 'meta/llama-3.1-405b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct', 'deepseek-ai/deepseek-r1'] },

  // ---- 国内供应商 ----
  { id: 'shengsuan', name: '胜算云', category: 'china', baseUrl: 'https://api.shengsuan.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6', 'gpt-4.1', 'gpt-4o', 'deepseek-chat', 'deepseek-reasoner', 'gemini-2.5-pro'] },
  { id: 'modelscope', name: 'ModelScope', category: 'china', baseUrl: 'https://api.modelscope.cn/v1', apiFormat: 'openai', defaultModel: 'Qwen/Qwen3-235B-A22B', models: ['Qwen/Qwen3-235B-A22B', 'Qwen/Qwen3-32B', 'Qwen/Qwen2.5-72B-Instruct', 'Qwen/Qwen2.5-Coder-32B-Instruct', 'deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'] },
  { id: 'aihubmix', name: 'AiHubMix', category: 'china', baseUrl: 'https://api.aihubmix.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'gpt-4o', 'deepseek-chat', 'deepseek-reasoner', 'gemini-2.5-pro', 'gemini-2.5-flash'] },
  { id: 'siliconflow', name: 'Silicon Flow', category: 'china', baseUrl: 'https://api.siliconflow.cn/v1', apiFormat: 'openai', defaultModel: 'deepseek-ai/DeepSeek-V3-0324', models: ['deepseek-ai/DeepSeek-V3-0324', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen3-235B-A22B', 'Qwen/Qwen2.5-72B-Instruct', 'Pro/deepseek-ai/DeepSeek-V3', 'Pro/deepseek-ai/DeepSeek-R1'] },
  { id: 'siliconflow_en', name: 'SiliconFlow en', category: 'china', baseUrl: 'https://api.siliconflow.com/v1', apiFormat: 'openai', defaultModel: 'deepseek-ai/DeepSeek-V3-0324', models: ['deepseek-ai/DeepSeek-V3-0324', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen3-235B-A22B', 'Qwen/Qwen2.5-72B-Instruct'] },
  { id: 'dmxapi', name: 'DMXAPI', category: 'china', baseUrl: 'https://www.dmxapi.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'gpt-4o', 'deepseek-chat', 'deepseek-reasoner', 'gemini-2.5-pro'] },
  { id: 'youyun', name: '优云智算', category: 'china', baseUrl: 'https://api.youyun.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'deepseek-chat'] },
  { id: 'bailing', name: 'BaiLing', category: 'china', baseUrl: 'https://api.bailing.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-sonnet-4-6', 'gpt-4.1', 'gpt-4o', 'deepseek-chat'] },
  { id: 'kat_coden', name: 'KAT-Coden', category: 'china', baseUrl: 'https://api.kat-coden.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'deepseek-chat'] },
  { id: 'longcat', name: 'Longcat', category: 'china', baseUrl: 'https://api.longcat.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'lemondata', name: 'LemonData', category: 'china', baseUrl: 'https://api.lemondata.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'deepseek-chat'] },
  { id: 'pipellm', name: 'PIPELLM', category: 'china', baseUrl: 'https://api.pipellm.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'packycode', name: 'PackyCode', category: 'china', baseUrl: 'https://api.packycode.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'cubence', name: 'Cubence', category: 'china', baseUrl: 'https://api.cubence.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'aigocode', name: 'AIGoCode', category: 'china', baseUrl: 'https://api.aigocode.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'deepseek-chat'] },
  { id: 'rightcode', name: 'RightCode', category: 'china', baseUrl: 'https://api.rightcode.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'aicodemirron', name: 'AICodeMirron', category: 'china', baseUrl: 'https://api.aicodemirron.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'alicoding', name: 'AlCoding', category: 'china', baseUrl: 'https://api.alicoding.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'ctok', name: 'CTok.ai', category: 'china', baseUrl: 'https://api.ctok.ai/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'ddshub', name: 'DDSHub', category: 'china', baseUrl: 'https://api.ddshub.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'eflowcode', name: 'E-FlowCode', category: 'china', baseUrl: 'https://api.eflowcode.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'lionccapi', name: 'LionCCAPI', category: 'china', baseUrl: 'https://api.lionccapi.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'micu', name: 'Micu', category: 'china', baseUrl: 'https://api.micu.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'sssaicode', name: 'SSSAiCode', category: 'china', baseUrl: 'https://api.sssaicode.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1'] },
  { id: 'crazyrouter', name: 'CrazyRouter', category: 'china', baseUrl: 'https://api.crazyrouter.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'deepseek-chat'] },

  // ---- 国际聚合平台 ----
  { id: 'openrouter', name: 'OpenRouter', category: 'aggregator', baseUrl: 'https://openrouter.ai/api/v1', apiFormat: 'openai', defaultModel: 'anthropic/claude-sonnet-4-6', models: ['anthropic/claude-opus-4-7', 'anthropic/claude-sonnet-4-6', 'anthropic/claude-haiku-4-5-20251001', 'openai/gpt-4.1', 'openai/gpt-4o', 'openai/o3', 'google/gemini-2.5-pro-preview', 'google/gemini-2.5-flash-preview', 'deepseek/deepseek-chat-v3-0324', 'deepseek/deepseek-r1', 'meta-llama/llama-4-maverick'] },
  { id: 'therouter', name: 'TheRouter', category: 'aggregator', baseUrl: 'https://api.therouter.com/v1', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'gpt-4o', 'deepseek-chat', 'gemini-2.5-pro'] },
  { id: 'novita', name: 'Novita AI', category: 'aggregator', baseUrl: 'https://api.novita.ai/v3/openai', apiFormat: 'openai', defaultModel: 'claude-sonnet-4-6', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'gpt-4.1', 'gpt-4o', 'deepseek-chat', 'deepseek-r1'] },

  // ---- 自定义 ----
  { id: 'custom', name: '自定义配置', category: 'custom', baseUrl: '', apiFormat: 'openai', defaultModel: '', models: [], needsBaseUrl: true, description: '需手动填写所有必要字段' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  official: '官方 & 大厂',
  china: '国内供应商',
  aggregator: '国际聚合平台',
  cloud: '云服务商',
  custom: '自定义',
};

// ---- Types ----

export interface AIModelConfig {
  providerId: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  apiFormat: 'openai' | 'anthropic' | 'custom';
  nickname?: string;
  notes?: string;
}

export interface Connection {
  name: string;
  type: 'clickhouse' | 'redis' | 'chromadb';
  host: string;
  port: number;
  status: 'connected' | 'disconnected';
}

export interface NotificationConfig {
  email: boolean;
  desktop: boolean;
  alertLevel: 'all' | 'critical';
}

interface SettingsState {
  aiModel: AIModelConfig;
  connections: Connection[];
  notifications: NotificationConfig;
  saving: boolean;
  aiEnabled: boolean;
  updateAIModel: (config: Partial<AIModelConfig>) => void;
  selectProvider: (presetId: string) => void;
  updateNotifications: (config: Partial<NotificationConfig>) => void;
  testConnection: (type: Connection['type']) => void;
  saveSettings: () => Promise<void>;
  getApiKey: () => string;
  getProviderConfig: () => { apiKey: string; baseUrl: string; model: string; provider: string; apiFormat: string };
}

// ---- Persistence ----

const SETTINGS_KEY = 'app_settings';

function loadSettings(): Partial<AIModelConfig> {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

const saved = loadSettings();

// Migrate old settings
const defaultPreset = PROVIDER_PRESETS[0]; // Claude Official

export const useSettingsStore = create<SettingsState>((set, get) => ({
  aiModel: {
    providerId: saved.providerId || (saved as any).provider || 'anthropic',
    model: saved.model || defaultPreset.defaultModel,
    apiKey: saved.apiKey || '',
    baseUrl: saved.baseUrl || defaultPreset.baseUrl,
    apiFormat: (saved.apiFormat as any) || defaultPreset.apiFormat,
    nickname: saved.nickname || '',
    notes: saved.notes || '',
  },
  connections: [
    { name: 'ClickHouse', type: 'clickhouse', host: '192.168.1.100', port: 8123, status: 'connected' },
    { name: 'Redis', type: 'redis', host: '192.168.1.101', port: 6379, status: 'connected' },
    { name: 'ChromaDB', type: 'chromadb', host: '192.168.1.102', port: 8000, status: 'disconnected' },
  ],
  notifications: { email: true, desktop: true, alertLevel: 'critical' },
  saving: false,
  aiEnabled: !!(saved.apiKey),

  selectProvider: (presetId) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    set((state) => ({
      aiModel: {
        ...state.aiModel,
        providerId: presetId,
        baseUrl: preset.baseUrl,
        model: preset.defaultModel,
        apiFormat: preset.apiFormat,
      },
    }));
  },

  updateAIModel: (config) =>
    set((state) => {
      const updated = { ...state.aiModel, ...config };
      return { aiModel: updated, aiEnabled: !!updated.apiKey };
    }),

  updateNotifications: (config) =>
    set((state) => ({ notifications: { ...state.notifications, ...config } })),

  testConnection: (type) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.type === type ? { ...c, status: c.status === 'connected' ? 'disconnected' : 'connected' } : c
      ),
    })),

  saveSettings: async () => {
    set({ saving: true });
    const { aiModel } = get();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(aiModel));
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ saving: false, aiEnabled: !!aiModel.apiKey });
  },

  getApiKey: () => get().aiModel.apiKey,

  getProviderConfig: () => {
    const { aiModel } = get();
    return {
      apiKey: aiModel.apiKey,
      baseUrl: aiModel.baseUrl,
      model: aiModel.model,
      provider: aiModel.providerId,
      apiFormat: aiModel.apiFormat,
    };
  },
}));
