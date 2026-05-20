import { create } from 'zustand';
import { aiApi } from '../services/api';
import type { Creative, Ranking } from './platformData';

// ---- Types ----

export interface Formula {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  popularity: string;
  caseStudy: string;
  duration: string;
  tags: string[];
  tip: string;
  source?: 'builtin' | 'platform';
  platformId?: string;
  platformName?: string;
  discoveredAt?: string; // ISO date string
}

export interface StructureItem {
  time: string;
  type: string;
  content: string;
}

export interface ScriptVersion {
  type: 'aggressive' | 'curious' | 'data';
  label: string;
  content: string;
}

export interface SeedanceCard {
  id: number;
  type: string;
  typeName: string;
  content: string;
  title: string;
  formula: string;
}

export interface HistoryItem {
  id: number;
  type: 'title' | 'scripts' | 'seedance';
  formula?: string;
  title?: string;
  content: any;
  time: string;
  gameDesc: string;
  platform: string;
}

interface WorkshopState {
  // Navigation
  page: 'home' | 'generate';
  selectedFormula: Formula | null;

  // Platform-discovered formulas
  discoveredFormulas: Formula[];

  // Generation state
  gameDesc: string;
  platform: string;
  gameType: string;
  loading: boolean;
  titles: string[];
  selectedTitle: string;
  scripts: Record<string, string>;
  seedanceCards: SeedanceCard[];
  error: string;

  // History
  history: HistoryItem[];

  // Actions
  setPage: (p: 'home' | 'generate') => void;
  selectFormula: (f: Formula) => void;
  setGameDesc: (d: string) => void;
  setPlatform: (p: string) => void;
  setGameType: (t: string) => void;
  setSelectedTitle: (t: string) => void;
  generateTitles: () => Promise<void>;
  generateScripts: () => Promise<void>;
  generateSeedance: (type: string) => Promise<void>;
  clearHistory: () => void;
  goToGenerate: () => void;
  goHome: () => void;
  syncFromPlatformData: (creatives: Creative[], rankings: Ranking[], platformId: string, platformName: string) => void;
}

// ---- Data ----

export const formulas: Formula[] = [
  { id: 'f1', name: '末世生存+建造经营', subtitle: '热门榜爆款公式', icon: '🔥', color: '#FF6B35', bg: 'rgba(255,107,53,0.1)', popularity: '18万/周', caseStudy: 'Whiteout Survival', duration: '1分7秒', tags: ['建造经营/模拟', '成就进步', '末世题材'], tip: '重点展示建造过程的爽快感' },
  { id: 'f2', name: '真人剧情+游戏混剪', subtitle: '热门榜爆款公式', icon: '🎬', color: '#00D9FF', bg: 'rgba(0,217,255,0.1)', popularity: '13万/周', caseStudy: 'Dark War:Survival', duration: '34秒', tags: ['真人', '剧情叙事', '混合'], tip: '真人与游戏切换流畅' },
  { id: 'f3', name: '解压治愈+放松逃离', subtitle: '热门榜爆款公式', icon: '🌿', color: '#7ED321', bg: 'rgba(126,211,33,0.1)', popularity: '15万/周', caseStudy: 'Big Farm Homestead', duration: '59秒', tags: ['解压治愈', '放松逃离'], tip: '突出逃离压力' },
  { id: 'f4', name: '突发事件+快速响应', subtitle: '飙升榜增长公式', icon: '⚡', color: '#FFD700', bg: 'rgba(255,215,0,0.1)', popularity: '待监控', caseStudy: '-', duration: '30-60秒', tags: ['技巧挑战', '逆境反击'], tip: '适合新活动快速起量' },
  { id: 'f5', name: '真人出镜+技巧展示', subtitle: '新创意榜霸表公式', icon: '🎯', color: '#FF006E', bg: 'rgba(255,0,110,0.1)', popularity: '8-13万/周', caseStudy: 'Mobile Legends', duration: '24秒', tags: ['真人', '技巧挑战'], tip: '真人增加信任感' },
  { id: 'f6', name: '新角色/新玩法首发', subtitle: '新创意榜测试公式', icon: '🆕', color: '#9B59B6', bg: 'rgba(155,89,182,0.1)', popularity: '11万/周', caseStudy: 'MONOPOLY GO!', duration: '1分24秒', tags: ['剧情叙事', '沉浸剧情'], tip: '适合版本更新' },
  { id: 'f7', name: '短平快+高频测试', subtitle: '新创意榜测试公式', icon: '⚡', color: '#FFBE0B', bg: 'rgba(255,190,11,0.1)', popularity: '13万/周', caseStudy: 'Hexa Diamonds', duration: '30秒', tags: ['解压治愈', '轻松上手'], tip: '3-5秒内出现第一个爽点' },
];

export const structures: Record<string, StructureItem[]> = { ...loadSavedStructures(),
  f1: [{ time: '0-3秒', type: '黄金3秒', content: '末世场景冲击' }, { time: '3-15秒', type: '核心玩法', content: '基地建造' }, { time: '15-30秒', type: '情绪爆点', content: '成就展示' }, { time: '30秒+', type: 'CTA', content: '"建立你的避难所"' }],
  f2: [{ time: '0-3秒', type: '黄金3秒', content: '真人困境' }, { time: '3-15秒', type: '核心玩法', content: '游戏高光' }, { time: '15-30秒', type: '情绪爆点', content: '惊喜反转' }, { time: '结尾', type: 'CTA', content: '"开启你的传奇"' }],
  f3: [{ time: '0-3秒', type: '黄金3秒', content: '生活压力' }, { time: '3-15秒', type: '核心玩法', content: '治愈画面' }, { time: '15-30秒', type: '情绪爆点', content: '萌宠互动' }, { time: '结尾', type: 'CTA', content: '"远离压力"' }],
  f4: [{ time: '0-3秒', type: '黄金3秒', content: '紧急事件' }, { time: '3-15秒', type: '核心玩法', content: '快速应对' }, { time: '15-30秒', type: '情绪爆点', content: '反击胜利' }, { time: '结尾', type: 'CTA', content: '"你能应对吗？"' }],
  f5: [{ time: '0-3秒', type: '黄金3秒', content: '真人展示' }, { time: '3-15秒', type: '核心玩法', content: '技巧演示' }, { time: '15-30秒', type: '情绪爆点', content: '精彩击杀' }, { time: '结尾', type: 'CTA', content: '"你也能上分"' }],
  f6: [{ time: '0-3秒', type: '黄金3秒', content: '新角色亮相' }, { time: '3-15秒', type: '核心玩法', content: '技能展示' }, { time: '15-30秒', type: '情绪爆点', content: '玩家反应' }, { time: '结尾', type: 'CTA', content: '"立即体验"' }],
  f7: [{ time: '0-3秒', type: '黄金3秒', content: '核心玩法展现' }, { time: '3-10秒', type: '核心玩法', content: '快节奏剪辑' }, { time: '10-20秒', type: '情绪爆点', content: '爽点爆发' }, { time: '结尾', type: 'CTA', content: '"点击下载"' }],
};

// ---- Mock fallbacks ----

const mockTitles = [
  '这游戏建造太上头了，一玩就停不下来！',
  '末日来了你怕不怕？看看我的避难所！',
  '99%的人不知道，这样建造才能活到最后',
  '从零开始建造帝国，这成就感绝了！',
  '被丧尸追着跑？不存在的，看我基地！',
  '朋友说我建的基地像堡垒，你觉得呢？',
  '开局一块地，结局一座城！',
  '这游戏让我连续肝了三天三夜...',
  '建造+生存+策略，这才是真正的神作！',
];

const mockScripts: Record<string, string> = {
  aggressive: `标题：【这游戏建造太上头了，一玩就停不下来！】
开场钩子(0-3秒): 画面：末日废墟中，主角满身伤痕，身后丧尸大军压境。突然镜头一转，一座宏伟的基地从废墟中拔地而起！
主体内容(3-20秒): 快节奏展示：从一片荒地到建造城墙、布置陷阱、招募幸存者。每个建造瞬间配合爆炸音效和粒子特效。重点展示基地从破烂到宏伟的进化过程。
行动号召(最后3秒): "你的避难所，等你来建！点击下载，开启末日建造之旅！"
BGM风格: 史诗管弦乐+电子节拍，节奏紧凑，高潮迭起
视觉建议: {"colorScheme": "末日橙+钢铁灰", "keyElements": ["建造过程", "基地全貌", "丧尸围城"]}
创作建议: 前3秒必须有强烈视觉冲击，建造过程用加速+特效强化爽感
质量评分: 85/100
开场钩子: 20
情绪张力: 16
卖点突出: 17
CTA效果: 16
节奏流畅: 13
亮点金句: "末日不末日，看你的基地！"
优点:
* 开场冲击力强
* 建造过程展示充分
改进:
* 可以增加更多社交元素
* 结尾CTA可以更有紧迫感`,

  curious: `标题：【99%的人不知道，这样建造才能活到最后】
开场钩子(0-3秒): 神秘旁白："你有没有想过，为什么有些人能在末日活下来，而有些人第一天就..."画面突然黑屏，传来一声惨叫。
主体内容(3-20秒): 以"揭秘"方式展示：先展示普通玩家的破烂基地（被丧尸轻易攻破），再展示"高手"的精妙设计（多层防御、陷阱联动）。用对比手法制造好奇心。
行动号召(最后3秒): "想知道更多末日生存的秘密？下载游戏，成为那1%的幸存者！"
BGM风格: 悬疑氛围音+低沉鼓点，间歇性紧张音效
视觉建议: {"colorScheme": "暗黑+霓虹绿", "keyElements": ["对比画面", "秘密基地", "幸存者"]}
创作建议: 悬念感是核心，前3秒不要揭示答案，保持神秘感
质量评分: 82/100
开场钩子: 22
情绪张力: 17
卖点突出: 15
CTA效果: 14
节奏流畅: 12
亮点金句: "末日生存的秘密，只有1%的人知道！"
优点:
* 悬念感强，容易引发好奇
* 对比手法直观有效
改进:
* 节奏可以更快一些
* 可以加入更多"秘密"元素`,

  data: `标题：【从零开始建造帝国，这成就感绝了！】
开场钩子(0-3秒): 数据弹出：全球500万玩家，平均在线时长4.2小时，最高基地评分98.7分。画面聚焦在一个满级基地上。
主体内容(3-20秒): 数据驱动展示：Day 1 基地面积10㎡ → Day 7 面积150㎡ → Day 30 面积1200㎡。用数据增长曲线配合基地扩张画面。展示关键数据：防御值从50提升到9500，资源产出从100/小时到50000/小时。
行动号召(最后3秒): "全球500万玩家的选择！下载游戏，建造你的帝国！"
BGM风格: 科技感电子乐+数据流动音效
视觉建议: {"colorScheme": "科技蓝+数据绿", "keyElements": ["数据面板", "增长曲线", "基地鸟瞰"]}
创作建议: 数据要真实可信，不要过度夸张，用具体数字建立信任感
质量评分: 80/100
开场钩子: 18
情绪张力: 14
卖点突出: 18
CTA效果: 15
节奏流畅: 13
亮点金句: "数据不说谎，500万玩家的选择！"
优点:
* 数据说服力强
* 成长感直观
改进:
* 可以加入更多玩家证言
* 数据可视化可以更精美`,
};

// ---- API call helper ----

async function callAI(prompt: string): Promise<string> {
  try {
    const res: any = await aiApi.chat({ message: prompt, expert: 'creative' });
    return res?.data?.response ?? res?.response ?? res?.data ?? '';
  } catch {
    return '';
  }
}

// ---- Persistence helpers ----

const FORMULAS_KEY = 'workshop_formulas';
const STRUCTURES_KEY = 'workshop_structures';
const SYNC_HASH_KEY = 'workshop_sync_hash';

function loadSavedFormulas(): Formula[] {
  try {
    const saved = localStorage.getItem(FORMULAS_KEY);
    if (saved) {
      const parsed: Formula[] = JSON.parse(saved);
      // Remove reyun-platform formulas
      const cleaned = parsed.filter((f) => f.platformId !== 'reyun');
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(FORMULAS_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
  } catch {}
  // First load: seed with built-in formulas (dated as 2024-01-01 so they appear in "更早")
  return formulas.map((f) => ({ ...f, discoveredAt: '2024-01-01T00:00:00.000Z' }));
}

function loadSavedStructures(): Record<string, StructureItem[]> {
  try {
    const saved = localStorage.getItem(STRUCTURES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Remove reyun-platform structures
      const cleaned: Record<string, StructureItem[]> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (!k.startsWith('pf_reyun_')) cleaned[k] = v as StructureItem[];
      }
      return cleaned;
    }
  } catch {}
  return {};
}

function saveFormulas(list: Formula[]) {
  localStorage.setItem(FORMULAS_KEY, JSON.stringify(list));
}

function saveStructures(structs: Record<string, StructureItem[]>) {
  localStorage.setItem(STRUCTURES_KEY, JSON.stringify(structs));
}

function getSyncHash(creatives: Creative[], rankings: Ranking[]): string {
  // Clean up stale reyun sync hash
  localStorage.removeItem(`${SYNC_HASH_KEY}_reyun`);
  const c = creatives.map((x) => x.creative_id).join(',');
  const r = rankings.flatMap((x) => x.entries).map((x) => `${x.name}:${x.score}`).join(',');
  return `${c}|${r}`;
}

// ---- Store ----

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  page: 'home',
  selectedFormula: null,
  discoveredFormulas: loadSavedFormulas(),

  gameDesc: '',
  platform: '抖音',
  gameType: '',
  loading: false,
  titles: [],
  selectedTitle: '',
  scripts: {},
  seedanceCards: [],
  error: '',

  history: JSON.parse(localStorage.getItem('workshop_history') || '[]'),

  setPage: (p) => set({ page: p }),
  setGameDesc: (d) => set({ gameDesc: d }),
  setPlatform: (p) => set({ platform: p }),
  setGameType: (t) => set({ gameType: t }),
  setSelectedTitle: (t) => set({ selectedTitle: t }),

  selectFormula: (f) => set({ selectedFormula: f }),

  goToGenerate: () => set({
    page: 'generate',
    titles: [],
    scripts: {},
    seedanceCards: [],
    selectedTitle: '',
    error: '',
  }),

  goHome: () => set({ page: 'home' }),

  generateTitles: async () => {
    const { gameDesc, platform, selectedFormula, gameType } = get();
    if (!gameDesc.trim()) return;

    set({ loading: true, error: '', titles: [], selectedTitle: '' });

    const gameTypeText = gameType ? `，游戏类型：${gameType}` : '';
    const formulaName = selectedFormula?.name ?? '通用';
    const prompt = `生成9个短视频广告标题。游戏：${gameDesc}，平台：${platform}，创意公式：${formulaName}${gameTypeText}。要求：15-30字，口语化，有冲击力，适合买量投放。直接输出9个标题，每行一个，不要编号：`;

    try {
      const content = await callAI(prompt);
      if (content) {
        const parsed = content.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 5 && l.length < 100).slice(0, 9);
        if (parsed.length > 0) {
          set({ titles: parsed, loading: false });
          return;
        }
      }
    } catch {}

    // Fallback mock
    await new Promise((r) => setTimeout(r, 800));
    set({ titles: mockTitles, loading: false });
  },

  generateScripts: async () => {
    const { gameDesc, platform, selectedFormula, selectedTitle, gameType } = get();
    if (!selectedTitle || !selectedFormula) return;

    set({ loading: true, error: '', scripts: {} });

    const struct = structures[selectedFormula.id] ?? [];
    const structText = struct.map((s) => `${s.time}|${s.type}|${s.content}`).join('\n');
    const gameTypeText = gameType ? `，游戏类型：${gameType}` : '';

    const prompt = `请为以下短视频广告生成3个版本的完整脚本（激进版、猎奇版、数据版）。

游戏：${gameDesc}${gameTypeText}
平台：${platform}
公式：${selectedFormula.name}
标题：${selectedTitle}
结构：${structText}

每个版本必须严格按照以下格式输出：

标题：【xxx】
开场钩子(0-3秒): xxx
主体内容(3-20秒): xxx
行动号召(最后3秒): xxx
BGM风格: xxx
视觉建议: {"colorScheme": "xxx", "keyElements": ["xxx","xxx","xxx"]}
创作建议: xxx
质量评分: xx/100
开场钩子: xx
情绪张力: xx
卖点突出: xx
CTA效果: xx
节奏流畅: xx
亮点金句: "一句精炼的、有冲击力的营销口号"
优点:
* xxx
* xxx
改进:
* xxx
* xxx

注意:
- 激进版：节奏更快，冲突更强，情绪更激烈
- 猎奇版：制造悬念，好奇心驱动
- 数据版：突出数字、成就、排行榜

###激进版###
[完整脚本]

###猎奇版###
[完整脚本]

###数据版###
[完整脚本]`;

    try {
      const content = await callAI(prompt);
      if (content) {
        const aggressive = content.match(/###\s*激进版\s*###\s*([\s\S]*?)(?=###\s*猎奇版\s*###|###\s*数据版\s*###|$)/)?.[1]?.trim() || '';
        const curious = content.match(/###\s*猎奇版\s*###\s*([\s\S]*?)(?=###\s*数据版\s*###|$)/)?.[1]?.trim() || '';
        const data = content.match(/###\s*数据版\s*###\s*([\s\S]*?)$/)?.[1]?.trim() || '';

        if (aggressive || curious || data) {
          const scripts = { aggressive, curious, data };
          set({ scripts, loading: false });

          // Save to history
          const item: HistoryItem = {
            id: Date.now(),
            type: 'scripts',
            formula: selectedFormula.name,
            title: selectedTitle,
            content: scripts,
            time: new Date().toLocaleString(),
            gameDesc,
            platform,
          };
          const newHistory = [item, ...get().history].slice(0, 50);
          set({ history: newHistory });
          localStorage.setItem('workshop_history', JSON.stringify(newHistory));
          return;
        }
      }
    } catch {}

    // Fallback mock
    await new Promise((r) => setTimeout(r, 1200));
    set({ scripts: mockScripts, loading: false });
  },

  generateSeedance: async (type: string) => {
    const { gameDesc, platform, selectedFormula, selectedTitle, scripts, gameType } = get();
    const base = scripts[type];
    if (!base || !selectedFormula) return;

    set({ loading: true, error: '' });

    const gameTypeText = gameType ? `，游戏类型：${gameType}` : '';
    const versionLabel = type === 'aggressive' ? '激进版' : type === 'curious' ? '猎奇版' : '数据版';

    const prompt = `基于以下${versionLabel}脚本，生成Seedance2.0视频提示词，30-45秒，节奏要快。

原脚本：
${base}

游戏：${gameDesc}${gameTypeText}
平台：${platform}

请生成完整的视频分镜提示词，包含：场景设定、角色描述、分镜脚本（0-4秒、4-9秒、9-16秒、16-22秒、22-30秒）、视觉风格、镜头运动。格式化输出。`;

    try {
      const content = await callAI(prompt);
      if (content) {
        const card: SeedanceCard = {
          id: Date.now(),
          type,
          typeName: versionLabel,
          content,
          title: selectedTitle,
          formula: selectedFormula.name,
        };
        set((s) => ({ seedanceCards: [...s.seedanceCards, card], loading: false }));
        return;
      }
    } catch {}

    // Fallback
    await new Promise((r) => setTimeout(r, 1000));
    const card: SeedanceCard = {
      id: Date.now(),
      type,
      typeName: versionLabel,
      title: selectedTitle,
      formula: selectedFormula.name,
      content: `【${versionLabel} Seedance2.0 视频提示词】

🎨 多角色形象 & 场景设定
@图片1：主角形象 —— 高级装备+冷峻表情
@图片2：副官/助手角色 —— 战术装备+专业表情
@图片3：对手/敌人形象 —— 被击败/震惊表情
@场景：游戏核心场景 —— 震撼视觉效果

-------------------------------------------------------
【游戏买量视频脚本 - ${versionLabel}】
时长：24-30秒 | 输出比例：9:16 | 适用平台：${platform}

【分镜1】0-4秒 · 对立开场
画面：震撼场景，主角登场，制造冲突
文案：用一句话制造好奇心

【分镜2】4-9秒 · 核心展示
画面：展示游戏核心玩法，重点突出
文案：解释为什么这个游戏好玩

【分镜3】9-16秒 · 高潮爆发
画面：最精彩的战斗/建造/互动瞬间
文案：强化情绪，制造紧迫感

【分镜4】16-22秒 · 社交背书
画面：玩家互动/排行榜/成就展示
文案：用数据和社交证明

【分镜5】22-30秒 · 下载引导
画面：福利展示+下载引导
文案：限时福利，立即下载！`,
    };
    set((s) => ({ seedanceCards: [...s.seedanceCards, card], loading: false }));
  },

  clearHistory: () => {
    set({ history: [] });
    localStorage.removeItem('workshop_history');
  },

  syncFromPlatformData: (creatives, rankings, platformId, platformName) => {
    // Skip if data hasn't changed
    const hash = getSyncHash(creatives, rankings);
    const hashKey = `${SYNC_HASH_KEY}_${platformId}`;
    if (localStorage.getItem(hashKey) === hash) return;
    localStorage.setItem(hashKey, hash);

    const existing = get().discoveredFormulas;
    const existingIds = new Set(existing.map((f) => f.id));
    const newFormulas: Formula[] = [];

    // Game theme keywords → formula name parts
    interface ThemeMatch {
      keywords: RegExp;
      theme: string;       // e.g. "赛车竞速"
      hook: string;        // 0-3秒 黄金3秒
      core: string;        // 3-15秒 核心玩法
      climax: string;      // 15-30秒 情绪爆点
      cta: string;         // CTA
      gameTypes: string[]; // 适用游戏类型
      tip: string;         // 制作要点
      icon: string;
      color: string;
    }

    const themeRules: ThemeMatch[] = [
      {
        keywords: /赛车|竞速|driv|car|racing|漂移|速度/i,
        theme: '赛车竞速+极速漂移',
        hook: '极速漂移特写',
        core: '赛道竞速实况',
        climax: '极限超车瞬间',
        cta: '"体验极速快感"',
        gameTypes: ['赛车竞速', '模拟驾驶', '休闲驾驶'],
        tip: '前3秒用极速画面制造视觉冲击，重点展示漂移和超车的爽快感',
        icon: '🏎️',
        color: '#FF6B35',
      },
      {
        keywords: /MOBA|moba|英雄|legend|对战|竞技|5v5|团战|league/i,
        theme: 'MOBA竞技+团战高光',
        hook: '团战高光瞬间',
        core: '英雄技能连招',
        climax: '五杀超神时刻',
        cta: '"召集队友开黑"',
        gameTypes: ['MOBA', '竞技对战', '团队竞技'],
        tip: '前3秒展示最精彩的团战画面，重点突出操作流畅度和技能特效',
        icon: '⚔️',
        color: '#00D9FF',
      },
      {
        keywords: /生存|surviv|末日|丧尸|僵尸|废墟|荒野/i,
        theme: '末世生存+建造经营',
        hook: '末世场景冲击',
        core: '基地建造过程',
        climax: '成就展示',
        cta: '"建立你的避难所"',
        gameTypes: ['建造经营/模拟', '成就进步', '末世题材'],
        tip: '重点展示建造过程的爽快感，前3秒用末世废墟制造紧张感',
        icon: '🔥',
        color: '#FF6B35',
      },
      {
        keywords: /农场|farm|田园|homestead|治愈|种地|牧场|模拟经营/i,
        theme: '田园治愈+模拟经营',
        hook: '田园生活向往',
        core: '农场经营展示',
        climax: '收获满足瞬间',
        cta: '"远离压力，回归田园"',
        gameTypes: ['模拟经营', '休闲治愈', '农场养成'],
        tip: '突出田园生活的治愈感，用丰收画面制造满足感',
        icon: '🌿',
        color: '#7ED321',
      },
      {
        keywords: /三消|消消|match|宝石|方块|消除|puzzle|解谜/i,
        theme: '三消解压+连锁爽感',
        hook: '大规模消除特效',
        core: '连锁消除展示',
        climax: '全屏爆破高潮',
        cta: '"挑战你的极限"',
        gameTypes: ['三消益智', '休闲解压', '消除游戏'],
        tip: '前3秒必须出现大规模消除特效，重点展示连锁反应的爽感',
        icon: '💎',
        color: '#9B59B6',
      },
      {
        keywords: /卡牌|card|策略|strategy|阵容|布阵|放置|idle/i,
        theme: '卡牌策略+阵容搭配',
        hook: '强力阵容展示',
        core: '策略布阵过程',
        climax: '碾压对手胜利',
        cta: '"组建你的最强阵容"',
        gameTypes: ['卡牌策略', '放置挂机', '策略对战'],
        tip: '展示阵容搭配的策略性，用碾压式胜利制造爽感',
        icon: '🃏',
        color: '#FF006E',
      },
      {
        keywords: /射击|shot|枪战|fps|吃鸡|battle|royale|使命|枪械/i,
        theme: '枪战射击+吃鸡高光',
        hook: '枪战爆头瞬间',
        core: '激烈对枪过程',
        climax: '吃鸡胜利时刻',
        cta: '"战到最后一个"',
        gameTypes: ['射击游戏', '吃鸡/大逃杀', 'FPS/TPS'],
        tip: '前3秒用爆头或精彩击杀吸引注意力，节奏要快',
        icon: '🎯',
        color: '#FF006E',
      },
      {
        keywords: /角色扮演|rpg|冒险|adventure|开放世界|quest|地下城|dungeon/i,
        theme: 'RPG冒险+开放世界',
        hook: 'Boss战震撼场面',
        core: '探索冒险过程',
        climax: '史诗战斗胜利',
        cta: '"开启你的冒险"',
        gameTypes: ['RPG', '冒险游戏', '开放世界'],
        tip: '展示世界观的宏大感，Boss战要有视觉冲击力',
        icon: '🗡️',
        color: '#F59E0B',
      },
      {
        keywords: /真人|real|kol|出镜|解说|博主|演员/i,
        theme: '真人剧情+游戏混剪',
        hook: '真人困境/反应',
        core: '游戏高光混剪',
        climax: '惊喜反转',
        cta: '"开启你的传奇"',
        gameTypes: ['全品类适用', '真人向', '剧情向'],
        tip: '真人与游戏切换要流畅，真人部分制造代入感',
        icon: '🎬',
        color: '#00D9FF',
      },
      {
        keywords: /解压|relax|舒适|满足|asmr|切割|挤压|整理/i,
        theme: '解压治愈+满足体验',
        hook: '解压场景吸引力',
        core: '解压过程展示',
        climax: '完美完成满足',
        cta: '"释放你的压力"',
        gameTypes: ['解压游戏', '休闲治愈', 'ASMR'],
        tip: '重点展示解压过程的满足感，音效和视觉要配合',
        icon: '😌',
        color: '#7ED321',
      },
    ];

    // Group creatives by best-matching theme
    type ThemeGroup = {
      rule: ThemeMatch;
      creatives: Creative[];
      advertisers: Set<string>;
      totalImpressions: number;
    };
    const themeGroups = new Map<string, ThemeGroup>();

    // Also track unmatched creatives for fallback
    const unmatched: Creative[] = [];

    creatives.forEach((c) => {
      const searchText = `${c.title} ${c.advertiser} ${c.platform || ''}`;
      let matched = false;

      for (const rule of themeRules) {
        if (rule.keywords.test(searchText)) {
          const key = rule.theme;
          if (!themeGroups.has(key)) {
            themeGroups.set(key, { rule, creatives: [], advertisers: new Set(), totalImpressions: 0 });
          }
          const group = themeGroups.get(key)!;
          group.creatives.push(c);
          group.advertisers.add(c.advertiser);
          group.totalImpressions += c.impressions;
          matched = true;
          break; // only first match
        }
      }

      if (!matched) unmatched.push(c);
    });

    // Build formulas from matched themes (need at least 2 creatives)
    const sortedGroups = [...themeGroups.values()]
      .filter((g) => g.creatives.length >= 2)
      .sort((a, b) => b.totalImpressions - a.totalImpressions)
      .slice(0, 5); // max 5 formulas per platform

    sortedGroups.forEach((group, i) => {
      const formulaId = `pf_${platformId}_theme_${i}`;
      if (existingIds.has(formulaId)) return;

      const { rule } = group;
      const durations = group.creatives.filter((c) => c.duration).map((c) => parseInt(c.duration!) || 0);
      const avgDurationSec = durations.length > 0
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : 30;

      const topAdv = [...group.advertisers].slice(0, 3).join('、');
      const rankEntry = rankings.flatMap((r) => r.entries).find((e) => group.advertisers.has(e.name));
      const popularity = rankEntry
        ? `${(rankEntry.score / 10000).toFixed(1)}万/周`
        : `${(group.totalImpressions / 10000).toFixed(1)}万曝光`;

      // Determine ranking subtitle
      const rankType = rankings.find((r) => r.entries.some((e) => group.advertisers.has(e.name)));
      const subtitle = rankType ? `${rankType.ranking_type}爆款公式` : `${platformName}平台热门公式`;

      const formula: Formula = {
        id: formulaId,
        name: rule.theme,
        subtitle,
        icon: rule.icon,
        color: rule.color,
        bg: `${rule.color}15`,
        popularity,
        caseStudy: topAdv,
        duration: `${avgDurationSec}秒`,
        tags: [...rule.gameTypes, platformName],
        tip: rule.tip,
        source: 'platform',
        platformId,
        platformName,
        discoveredAt: new Date().toISOString(),
      };

      newFormulas.push(formula);

      structures[formulaId] = [
        { time: '0-3秒', type: '黄金3秒', content: rule.hook },
        { time: '3-15秒', type: '核心玩法', content: rule.core },
        { time: '15-30秒', type: '情绪爆点', content: rule.climax },
        { time: '30秒+', type: 'CTA', content: rule.cta },
      ];
    });

    if (newFormulas.length > 0) {
      const updated = [...existing, ...newFormulas];
      set({ discoveredFormulas: updated });
      saveFormulas(updated);
      saveStructures(structures);
    }
  },
}));
