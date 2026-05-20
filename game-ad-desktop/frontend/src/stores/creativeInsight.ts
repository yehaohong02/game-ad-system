import { create } from 'zustand';
import api, { aiApi } from '../services/api';

export interface Creative {
  creative_id: string;
  type: 'video' | 'image';
  thumbnail: string;
  videoUrl?: string;
  ctr: number;
  cpi: number;
  roas: number;
  tags: string[];
  status: 'active' | 'paused' | 'review' | 'fatigued';
  name: string;
  spend: number;
  installs: number;
  impressions: number;
  duration?: string;
  platform: string;
  advertiser: string;
  createdAt: string;
  trend: 'up' | 'down' | 'stable';
}

export interface CreativeAnalysis {
  tag: string;
  count: number;
  avgCtr: number;
  avgRoas: number;
  totalSpend: number;
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  image?: string;
  creative?: Creative;
  tags?: string[];
}

interface CreativeInsightState {
  creatives: Creative[];
  viewMode: 'grid' | 'list';
  selectedCreatives: string[];
  aiSuggestion: string;
  loading: boolean;
  aiLoading: boolean;
  filterStatus: string;
  filterType: string;
  sortBy: string;
  chatMessages: ChatMessage[];
  aiPanelCollapsed: boolean;
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  fetchAiSuggestion: (prompt: string) => Promise<void>;
  setFilterStatus: (s: string) => void;
  setFilterType: (t: string) => void;
  setSortBy: (s: string) => void;
  getTagAnalysis: () => CreativeAnalysis[];
  getTopPerformers: () => Creative[];
  getBottomPerformers: () => Creative[];
  addCreative: (creative: Creative) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  uploadAndRecognize: (file: File) => Promise<void>;
  toggleAiPanel: () => void;
}

const mockCreatives: Creative[] = [
  { creative_id: 'CR-001', type: 'video', thumbnail: 'https://picsum.photos/seed/cr001/320/180', ctr: 3.8, cpi: 1.45, roas: 1.35, tags: ['战斗', '特效', '高品质'], status: 'active', name: '英雄战斗场景 A', spend: 2800, installs: 1930, impressions: 73684, duration: '24秒', platform: 'TikTok', advertiser: 'GameStudio', createdAt: '2026-05-01', trend: 'up' },
  { creative_id: 'CR-002', type: 'image', thumbnail: 'https://picsum.photos/seed/cr002/320/180', ctr: 2.1, cpi: 2.3, roas: 0.88, tags: ['角色', '宣传图'], status: 'active', name: '角色展示海报', spend: 1500, installs: 652, impressions: 71428, platform: 'Facebook', advertiser: 'GameStudio', createdAt: '2026-05-03', trend: 'down' },
  { creative_id: 'CR-003', type: 'video', thumbnail: 'https://picsum.photos/seed/cr003/320/180', ctr: 4.5, cpi: 1.1, roas: 1.62, tags: ['玩法', '趣味', '短视频'], status: 'active', name: '趣味玩法混剪', spend: 3200, installs: 2909, impressions: 71111, duration: '18秒', platform: '抖音', advertiser: 'GameStudio', createdAt: '2026-05-02', trend: 'up' },
  { creative_id: 'CR-004', type: 'video', thumbnail: 'https://picsum.photos/seed/cr004/320/180', ctr: 1.9, cpi: 3.1, roas: 0.65, tags: ['剧情', '长视频'], status: 'paused', name: '剧情向宣传片', spend: 800, installs: 258, impressions: 42105, duration: '45秒', platform: 'YouTube', advertiser: 'GameStudio', createdAt: '2026-04-28', trend: 'down' },
  { creative_id: 'CR-005', type: 'image', thumbnail: 'https://picsum.photos/seed/cr005/320/180', ctr: 2.8, cpi: 1.8, roas: 1.12, tags: ['活动', '限时', '福利'], status: 'active', name: '限时福利活动图', spend: 2100, installs: 1167, impressions: 75000, platform: 'Google', advertiser: 'GameStudio', createdAt: '2026-05-05', trend: 'stable' },
  { creative_id: 'CR-006', type: 'video', thumbnail: 'https://picsum.photos/seed/cr006/320/180', ctr: 5.1, cpi: 0.95, roas: 1.88, tags: ['UGC', '真实玩家', '高转化'], status: 'active', name: '玩家实况 UGC', spend: 4500, installs: 4737, impressions: 88235, duration: '30秒', platform: 'TikTok', advertiser: 'GameStudio', createdAt: '2026-05-04', trend: 'up' },
  { creative_id: 'CR-007', type: 'image', thumbnail: 'https://picsum.photos/seed/cr007/320/180', ctr: 1.5, cpi: 2.8, roas: 0.72, tags: ['Banner', '静态'], status: 'fatigued', name: 'Banner 广告图', spend: 600, installs: 214, impressions: 40000, platform: 'Google', advertiser: 'GameStudio', createdAt: '2026-04-20', trend: 'down' },
  { creative_id: 'CR-008', type: 'video', thumbnail: 'https://picsum.photos/seed/cr008/320/180', ctr: 3.2, cpi: 1.6, roas: 1.25, tags: ['世界观', 'CG', '高品质'], status: 'active', name: '世界观 CG 预告', spend: 3800, installs: 2375, impressions: 118750, duration: '35秒', platform: 'YouTube', advertiser: 'GameStudio', createdAt: '2026-05-06', trend: 'stable' },
  { creative_id: 'CR-009', type: 'image', thumbnail: 'https://picsum.photos/seed/cr009/320/180', ctr: 2.4, cpi: 2.0, roas: 0.95, tags: ['社媒', '竖版'], status: 'active', name: '社媒竖版素材', spend: 1200, installs: 600, impressions: 50000, platform: 'Instagram', advertiser: 'GameStudio', createdAt: '2026-05-07', trend: 'stable' },
  { creative_id: 'CR-010', type: 'video', thumbnail: 'https://picsum.photos/seed/cr010/320/180', ctr: 3.9, cpi: 1.3, roas: 1.48, tags: ['开箱', '抽卡', '惊喜'], status: 'active', name: '抽卡开箱时刻', spend: 2900, installs: 2231, impressions: 74359, duration: '22秒', platform: '抖音', advertiser: 'GameStudio', createdAt: '2026-05-08', trend: 'up' },
  { creative_id: 'CR-011', type: 'video', thumbnail: 'https://picsum.photos/seed/cr011/320/180', ctr: 4.2, cpi: 1.05, roas: 1.75, tags: ['真人', 'KOL', '高转化'], status: 'active', name: 'KOL 真人推荐', spend: 5200, installs: 4952, impressions: 117857, duration: '28秒', platform: '快手', advertiser: 'GameStudio', createdAt: '2026-05-09', trend: 'up' },
  { creative_id: 'CR-012', type: 'image', thumbnail: 'https://picsum.photos/seed/cr012/320/180', ctr: 1.8, cpi: 2.5, roas: 0.80, tags: ['商店截图', '静态'], status: 'review', name: '商店截图优化版', spend: 300, installs: 120, impressions: 16667, platform: 'Google', advertiser: 'GameStudio', createdAt: '2026-05-10', trend: 'stable' },
];

export const useCreativeInsightStore = create<CreativeInsightState>((set, get) => ({
  creatives: mockCreatives,
  viewMode: 'grid',
  selectedCreatives: [],
  aiSuggestion: '',
  loading: false,
  aiLoading: false,
  filterStatus: 'all',
  filterType: 'all',
  sortBy: 'roas',
  chatMessages: [],
  aiPanelCollapsed: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setFilterStatus: (s) => set({ filterStatus: s }),
  setFilterType: (t) => set({ filterType: t }),
  setSortBy: (s) => set({ sortBy: s }),

  toggleSelect: (id) => {
    const { selectedCreatives } = get();
    if (selectedCreatives.includes(id)) {
      set({ selectedCreatives: selectedCreatives.filter((cid) => cid !== id) });
    } else if (selectedCreatives.length < 3) {
      set({ selectedCreatives: [...selectedCreatives, id] });
    }
  },

  clearSelection: () => set({ selectedCreatives: [] }),

  toggleAiPanel: () => set((s) => ({ aiPanelCollapsed: !s.aiPanelCollapsed })),

  addCreative: (creative) => set((s) => ({ creatives: [creative, ...s.creatives] })),

  addChatMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ chatMessages: [...s.chatMessages, { ...msg, id }] }));
  },

  uploadAndRecognize: async (file) => {
    set({ aiLoading: true });
    const imageUrl = URL.createObjectURL(file);
    const { addChatMessage } = get();

    addChatMessage({ role: 'user', content: '请识别这张素材图片', image: imageUrl });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/creative/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = (res as any)?.data || res;
      const creative = data.creative as Creative;
      const tags = data.tags as string[];

      addChatMessage({
        role: 'ai',
        content: `识别完成！\n\n场景标签：${tags.join('、')}\n建议名称：${creative.name}\n\n点击下方按钮将素材添加到列表。`,
        creative,
        tags,
      });
    } catch {
      addChatMessage({ role: 'ai', content: '图片识别服务暂时不可用，请稍后重试。' });
    } finally {
      set({ aiLoading: false });
    }
  },

  fetchAiSuggestion: async (prompt) => {
    set({ aiLoading: true });
    const { addChatMessage } = get();
    addChatMessage({ role: 'user', content: prompt });
    try {
      const res = await aiApi.chat({ message: prompt, expert: 'creative' });
      const response = (res as any)?.data?.response || (res as any)?.response || (res as any)?.data || '暂无建议';
      set({ aiSuggestion: response });
      addChatMessage({ role: 'ai', content: response });
    } catch {
      const errMsg = 'AI 服务暂时不可用，请检查 API Key 配置。';
      set({ aiSuggestion: errMsg });
      addChatMessage({ role: 'ai', content: errMsg });
    } finally {
      set({ aiLoading: false });
    }
  },

  getTagAnalysis: () => {
    const { creatives } = get();
    const tagMap = new Map<string, { ctrs: number[]; roas: number[]; spend: number }>();

    creatives.forEach((c) => {
      c.tags.forEach((tag) => {
        if (!tagMap.has(tag)) tagMap.set(tag, { ctrs: [], roas: [], spend: 0 });
        const t = tagMap.get(tag)!;
        t.ctrs.push(c.ctr);
        t.roas.push(c.roas);
        t.spend += c.spend;
      });
    });

    return [...tagMap.entries()]
      .map(([tag, data]) => {
        const avgCtr = data.ctrs.reduce((s, v) => s + v, 0) / data.ctrs.length;
        const avgRoas = data.roas.reduce((s, v) => s + v, 0) / data.roas.length;
        const performance: CreativeAnalysis['performance'] = avgRoas >= 1.5 ? 'excellent' : avgRoas >= 1.0 ? 'good' : avgRoas >= 0.8 ? 'average' : 'poor';
        return { tag, count: data.ctrs.length, avgCtr, avgRoas, totalSpend: data.spend, performance };
      })
      .sort((a, b) => b.avgRoas - a.avgRoas);
  },

  getTopPerformers: () => {
    return [...get().creatives].filter((c) => c.status === 'active').sort((a, b) => b.roas - a.roas).slice(0, 3);
  },

  getBottomPerformers: () => {
    return [...get().creatives].filter((c) => c.status === 'active').sort((a, b) => a.roas - b.roas).slice(0, 3);
  },
}));
