import { create } from 'zustand';
import { platformApi } from '../services/api';
import * as XLSX from 'xlsx';
import { mockOverviewSummary, mockCategoryRecords } from '../data/platformMockData';
import { useMaterialDataStore, type MaterialRecord } from './materialData';

// ---- localStorage persistence helpers ----

const STORAGE_KEY_PREFIX = 'platform_data_';
const OVERVIEW_STORAGE_KEY = 'platform_data_overview';

function saveToStorage(key: string, data: any) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}
function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}

// ---- Platform → MaterialData bridge ----

// Accumulates all platform records by category for syncing
let _platformRecordsByCategory: Record<string, DataRecord[]> = {};

function toNumber(v: any): number {
  if (v === undefined || v === null || v === '-' || v === '') return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function convertToMaterialRecords(records: DataRecord[]): MaterialRecord[] {
  return records.map((r, i) => ({
    key: String(r['排行'] || r['排名'] || r['key'] || i),
    materialId: String(r['游戏名'] || r['产品名称'] || r['剧名'] || r['高频词'] || r['视频前3秒台词'] || ''),
    category: String(r._source || r['题材'] || r['标签'] || ''),
    spend: toNumber(r['素材数'] || r['投放素材数'] || r['关联素材数'] || r['热值']),
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpm: 0,
    cpc: 0,
    playCount: toNumber(r['投放天数'] || r['持续投放天数']),
    play2s: 0, play6s: 0, play25: 0, play50: 0, play75: 0, play100: 0,
    country: String(r['投放国家/地区Top1'] || r['预约国家地区'] || r['公司总部'] || ''),
    platform: String(r['投放媒体TOP1'] || r['投放媒体Top1'] || r['投放产品Top1'] || ''),
    status: String(r['排名变化'] || ''),
    // Preserve all original fields via index signature
    ...r,
  }));
}

function syncToMaterialData() {
  const allRecords = Object.values(_platformRecordsByCategory).flat();
  if (allRecords.length === 0) return;
  const platformConverted = convertToMaterialRecords(allRecords);
  // Merge: keep existing non-platform data, append platform data
  const existing = useMaterialDataStore.getState().data;
  const nonPlatform = existing.filter(d => !d._source && !d._category);
  useMaterialDataStore.getState().setData([...nonPlatform, ...platformConverted], 'platform_data_merged');
}

// ---- Types ----

export type Platform = string;

export interface PlatformConfig {
  id: string;
  name: string;
  url: string;
  selectors: Record<string, { selector: string; attribute?: string }>;
  created_at?: string;
}

export interface Creative {
  creative_id: string;
  platform: Platform;
  title: string;
  advertiser: string;
  impressions: number;
  creativeType: 'video' | 'image';
  thumbnail: string;
  videoUrl?: string;
  duration?: string;
  scraped_at: string;
}

export interface RankingEntry {
  rank: number;
  name: string;
  score: number;
}

export interface Ranking {
  ranking_type: string;
  ranking_date: string;
  entries: RankingEntry[];
}

export interface CrossValidation {
  matched: number;
  unmatched: number;
  suggestions: string[];
}

export interface SelectorSuggestion {
  field: string;
  selector: string;
  attribute: string;
  confidence: number;
}

export interface WizardState {
  name: string;
  url: string;
  username: string;
  password: string;
  selectorSuggestions: SelectorSuggestion[] | null;
  selectors: Record<string, { selector: string; attribute?: string }>;
  analyzing: boolean;
  loginStatus: 'idle' | 'logging-in' | 'success' | 'failed';
  error: string | null;
}

// ---- Scrape Strategy Types ----

export type ScrapeMethod = 'electron' | 'backend-proxy' | 'ai-extract' | 'direct-fetch' | 'mock';
export type DataSourceType = 'platform' | 'third-party' | 'manual' | 'auto-crawl';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  recordCount: number;
  icon: string;
  description: string;
  config?: Record<string, string>;
}

export interface CollectionTask {
  id: string;
  source: string;
  type: 'scheduled' | 'manual' | 'trigger';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  recordCount?: number;
  error?: string;
}

export interface ManualUpload {
  file: File | null;
  platform: string;
  category: string;
  notes: string;
}
export type ScrapeStatus = 'idle' | 'running' | 'success' | 'failed' | 'fallback';

export interface ScrapeAttempt {
  method: ScrapeMethod;
  status: ScrapeStatus;
  error?: string;
  duration?: number;
}

export interface ScrapeProgress {
  active: boolean;
  currentMethod: ScrapeMethod | null;
  attempts: ScrapeAttempt[];
  dataTypes: ('creatives' | 'rankings')[];
}

// ---- Download Types ----

export interface DownloadButton {
  text: string;
  selector: string;
  confidence: number;
  tagName: string;
}

export interface DownloadRecord {
  platformId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  downloadedAt: string;
  imported?: number;
  status?: 'pending' | 'importing' | 'done' | 'error';
  error?: string;
}

export interface ScannedPage {
  url: string;
  title: string;
  buttons: DownloadButton[];
}

// ---- Data Category Types ----

export interface DataCategory {
  id: string;
  name: string;
  icon: string;
  dir: string; // subdirectory filter: '国内', '国外', or '' for all
  files: string[]; // glob patterns to match file names
  columns: { key: string; title: string; width?: number; ellipsis?: boolean }[];
}

export interface DataRecord {
  [key: string]: any;
  _source?: string; // source file name
  _category?: string;
}

export interface OverviewSummary {
  totalFiles: number;
  totalRecords: number;
  categoryStats: { id: string; name: string; icon: string; fileCount: number; recordCount: number }[];
  topGames: { name: string; score: number; company: string; source: string }[];
  topCompanies: { name: string; count: number }[];
  topGenres: { name: string; count: number }[];
  topMedia: { name: string; count: number }[];
  topCountries: { name: string; count: number }[];
  topDramas: { name: string; score: number; country: string }[];
  insights: string[];
  // Extended analysis
  avgMaterialPerGame: number;
  longTermGames: { name: string; days: number; company: string }[];
  risingGames: { name: string; company: string; change: string }[];
  decliningGames: { name: string; company: string; change: string }[];
  crossRegionCompanies: { name: string; regions: string[]; gameCount: number }[];
  mediaStrategy: { media: string; gameCount: number; topGame: string }[];
  genreByRegion: { genre: string; domestic: number; overseas: number }[];
  reserveGames: { name: string; company: string; launchDate: string }[];
  dramaKeywords: { word: string; count: number }[];
  gameplayTypes: { name: string; count: number }[];
  publishingDays: { range: string; count: number }[];
  topOutboundCompanies: { name: string; overseasGames: number; topMarket: string }[];
  // Drama analysis
  dramaCountryDist: { country: string; count: number }[];
  dramaTagCloud: { tag: string; count: number }[];
  dramaTopProducts: { product: string; dramaCount: number }[];
  dramaDurationDist: { range: string; count: number }[];
}

interface PlatformDataState {
  // Platform selection
  platform: Platform;
  platforms: PlatformConfig[];
  platformsLoaded: boolean;

  // Data
  creatives: Creative[];
  rankings: Ranking[];
  crossValidation: CrossValidation | null;
  loading: boolean;

  // Scrape progress
  scrapeProgress: ScrapeProgress;

  // Smart download
  crawlPlatformId: string;
  downloadButtons: DownloadButton[];
  downloadRecords: DownloadRecord[];
  downloadDetecting: boolean;
  scannedPages: ScannedPage[];
  scanning: boolean;
  scanProgress: { page: number; maxPages: number; url: string; found: number } | null;
  setCrawlPlatformId: (id: string) => void;
  detectDownloadButtons: () => Promise<void>;
  clickDownloadButton: (selector: string) => Promise<void>;
  importDownloadedFile: (record: DownloadRecord) => Promise<void>;
  initDownloadListener: () => void;
  startAutoScan: () => Promise<void>;

  // Credentials
  savedCredentials: { username: string; password: string } | null;
  checkSavedCredentials: (siteKey: string) => Promise<void>;
  saveCredentials: (siteKey: string, username: string, password: string) => Promise<void>;
  autoLogin: (username: string, password: string) => Promise<void>;

  // Bookmarks
  bookmarks: { id: string; name: string; url: string; createdAt: string }[];
  fetchBookmarks: () => Promise<void>;
  addBookmark: (name: string, url: string) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;

  // Data categories
  dataCategories: DataCategory[];
  activeCategory: string;
  dataRecords: DataRecord[];
  dataLoading: boolean;
  setActiveCategory: (id: string) => void;
  loadCategoryData: (crawlDir: string, categoryId?: string) => Promise<void>;
  uploadDataFile: (file: File, categoryId: string) => Promise<void>;

  // Overview summary
  overviewSummary: OverviewSummary | null;
  overviewLoading: boolean;
  loadOverviewSummary: (crawlDir: string) => Promise<void>;

  // Data sources & collection
  dataSources: DataSource[];
  collectionTasks: CollectionTask[];
  dataSourceLoading: boolean;
  fetchDataSources: () => Promise<void>;
  syncDataSource: (sourceId: string) => Promise<void>;
  addManualCreatives: (creatives: Partial<Creative>[]) => Promise<void>;
  runCollectionTask: (sourceId: string) => Promise<void>;

  // Wizard
  addModalOpen: boolean;
  addModalStep: number;
  currentWizard: WizardState;

  // Actions
  setPlatform: (p: Platform) => void;
  fetchPlatforms: () => Promise<void>;
  fetchCreatives: () => Promise<void>;
  fetchRankings: () => Promise<void>;
  runCrossValidation: () => Promise<void>;

  // Wizard actions
  openAddModal: (prefill?: Partial<WizardState>) => void;
  closeAddModal: () => void;
  updateWizard: (fields: Partial<WizardState>) => void;
  setWizardStep: (step: number) => void;
  startBrowserFlow: () => Promise<void>;
  analyzeCurrentPage: () => Promise<void>;
  confirmSelectors: () => Promise<void>;
  scrapePlatform: (platformId?: string) => Promise<void>;
}

// ---- Mock Data (fallback) ----

const mockCreatives: Record<string, Creative[]> = {
  guangdada: [],
  adxray: [],
  reyun: [],
};

const mockRankings: Record<string, Ranking[]> = {
  guangdada: [],
  adxray: [],
  reyun: [],
};

const mockCrossValidation: Record<string, CrossValidation> = {
  guangdada: { matched: 0, unmatched: 0, suggestions: [] },
  adxray: { matched: 0, unmatched: 0, suggestions: [] },
  reyun: { matched: 0, unmatched: 0, suggestions: [] },
};

// ---- Data Sources Mock ----

const mockDataSources: DataSource[] = [];

const mockCollectionTasks: CollectionTask[] = [];

// ---- Data Category Definitions ----

const domesticColumns = [
  { key: '排行', title: '排行', width: 60 },
  { key: '游戏名', title: '游戏名', width: 160 },
  { key: '题材', title: '题材', width: 80 },
  { key: '玩法', title: '玩法', width: 80 },
  { key: '主投公司', title: '主投公司', width: 200, ellipsis: true },
  { key: '素材数', title: '素材数', width: 90 },
  { key: '投放媒体TOP1', title: '媒体TOP1', width: 110 },
  { key: '投放媒体TOP2', title: '媒体TOP2', width: 110 },
  { key: '投放媒体TOP3', title: '媒体TOP3', width: 110 },
  { key: '投放天数', title: '投放天数', width: 90 },
  { key: '排名变化', title: '排名变化', width: 90 },
];

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'overview', name: '数据总览', icon: '📊',
    dir: '', files: [],
    columns: [],
  },
  {
    id: 'domestic_heavy', name: '中重度买量总榜', icon: '🏠',
    dir: '国内', files: ['*中重度*'],
    columns: domesticColumns,
  },
  {
    id: 'domestic', name: '游戏买量总榜', icon: '🎮',
    dir: '国内', files: ['*游戏买量总榜*'],
    columns: domesticColumns,
  },
  {
    id: 'domestic_light', name: '轻度游戏买量总榜', icon: '🎯',
    dir: '国内', files: ['*轻度游戏*'],
    columns: domesticColumns,
  },
  {
    id: 'domestic_new', name: '国内新品', icon: '🆕',
    dir: '国内', files: ['*新品榜*'],
    columns: domesticColumns,
  },
  {
    id: 'domestic_reserve', name: '国内预约', icon: '📋',
    dir: '国内', files: ['*预约榜*'],
    columns: [
      { key: '排行', title: '排行', width: 60 },
      { key: '游戏名', title: '游戏名', width: 160 },
      { key: '题材', title: '题材', width: 80 },
      { key: '玩法', title: '玩法', width: 80 },
      { key: '主投公司', title: '主投公司', width: 200, ellipsis: true },
      { key: '素材数', title: '素材数', width: 90 },
      { key: '投放媒体TOP1', title: '媒体TOP1', width: 110 },
      { key: '投放媒体TOP2', title: '媒体TOP2', width: 110 },
      { key: '投放媒体TOP3', title: '媒体TOP3', width: 110 },
      { key: '预计上线时间', title: '预计上线', width: 110 },
    ],
  },
  {
    id: 'overseas', name: '海外买量', icon: '🌍',
    dir: '国外', files: ['*游戏买量总榜*'],
    columns: [
      { key: '排名', title: '排名', width: 60 },
      { key: '产品名称', title: '产品名称', width: 180, ellipsis: true },
      { key: '商店ID', title: '商店ID', width: 160, ellipsis: true },
      { key: '公司名称', title: '公司名称', width: 180, ellipsis: true },
      { key: '公司总部', title: '公司总部', width: 80 },
      { key: '投放素材数', title: '素材数', width: 90 },
      { key: '投放国家/地区Top1', title: '国家Top1', width: 100 },
      { key: '投放国家/地区Top2', title: '国家Top2', width: 100 },
      { key: '投放媒体Top1', title: '媒体Top1', width: 130 },
      { key: '投放媒体Top2', title: '媒体Top2', width: 130 },
      { key: '持续投放天数', title: '投放天数', width: 90 },
    ],
  },
  {
    id: 'overseas_reserve', name: '海外预约', icon: '📅',
    dir: '国外', files: ['*游戏预约榜*'],
    columns: [
      { key: '排名', title: '排名', width: 60 },
      { key: '产品名称', title: '产品名称', width: 180, ellipsis: true },
      { key: '商店ID', title: '商店ID', width: 160, ellipsis: true },
      { key: '公司名称', title: '公司名称', width: 180, ellipsis: true },
      { key: '公司总部', title: '公司总部', width: 80 },
      { key: '投放素材数', title: '素材数', width: 90 },
      { key: '预约国家地区', title: '预约国家', width: 200, ellipsis: true },
      { key: '首次发现时间', title: '首次发现', width: 110 },
      { key: '预计上线时间', title: '预计上线', width: 110 },
    ],
  },
  {
    id: 'overseas_out', name: '出海榜', icon: '✈️',
    dir: '国外', files: ['*出海榜*'],
    columns: [
      { key: '排名', title: '排名', width: 60 },
      { key: '产品名称', title: '产品名称', width: 180, ellipsis: true },
      { key: '商店ID', title: '商店ID', width: 160, ellipsis: true },
      { key: '公司名称', title: '公司名称', width: 180, ellipsis: true },
      { key: '公司总部', title: '公司总部', width: 80 },
      { key: '投放素材数', title: '素材数', width: 90 },
      { key: '投放国家/地区Top1', title: '国家Top1', width: 100 },
      { key: '投放国家/地区Top2', title: '国家Top2', width: 100 },
      { key: '投放媒体Top1', title: '媒体Top1', width: 130 },
      { key: '投放媒体Top2', title: '媒体Top2', width: 130 },
      { key: '持续投放天数', title: '投放天数', width: 90 },
    ],
  },
  {
    id: 'drama', name: '短剧投放', icon: '🎬',
    dir: '国外', files: ['*短剧榜_周榜*'],
    columns: [
      { key: '排名', title: '排名', width: 60 },
      { key: '剧名', title: '剧名', width: 200, ellipsis: true },
      { key: '国内剧名', title: '国内剧名', width: 160, ellipsis: true },
      { key: '标签', title: '标签', width: 150, ellipsis: true },
      { key: '投放素材数', title: '素材数', width: 90 },
      { key: '投放国家/地区Top1', title: '国家Top1', width: 100 },
      { key: '投放国家/地区Top2', title: '国家Top2', width: 100 },
      { key: '投放产品Top1', title: '产品Top1', width: 180, ellipsis: true },
      { key: '投放产品Top2', title: '产品Top2', width: 180, ellipsis: true },
      { key: '持续投放天数', title: '投放天数', width: 90 },
    ],
  },
  {
    id: 'drama_copy', name: '短剧文案', icon: '✍️',
    dir: '国外', files: ['*文案灵感*'],
    columns: [
      { key: '高频词', title: '高频词', width: 200 },
      { key: '关联文案数', title: '关联文案数', width: 150 },
    ],
  },
  {
    id: 'drama_hot', name: '短剧热榜', icon: '🔥',
    dir: '国外', files: ['*热榜*'],
    columns: [
      { key: '排名', title: '排名', width: 60 },
      { key: '剧名', title: '剧名', width: 200, ellipsis: true },
      { key: '国内剧名', title: '国内剧名', width: 160, ellipsis: true },
      { key: '标签', title: '标签', width: 120, ellipsis: true },
      { key: '版权方', title: '版权方', width: 140, ellipsis: true },
      { key: '发行方', title: '发行方', width: 140, ellipsis: true },
      { key: '承制方', title: '承制方', width: 140, ellipsis: true },
      { key: '投放产品Top1', title: '产品Top1', width: 180, ellipsis: true },
      { key: '投放产品Top2', title: '产品Top2', width: 180, ellipsis: true },
      { key: '投放产品Top3', title: '产品Top3', width: 180, ellipsis: true },
      { key: '热值', title: '热值', width: 100 },
      { key: '累计热值', title: '累计热值', width: 100 },
      { key: '标识', title: '标识', width: 80 },
    ],
  },
  {
    id: 'drama_golden', name: '黄金台词', icon: '💬',
    dir: '国外', files: ['*黄金*台词*'],
    columns: [
      { key: '排名', title: '排名', width: 60 },
      { key: '视频前3秒台词', title: '黄金台词', width: 300, ellipsis: true },
      { key: '关联素材数', title: '关联素材数', width: 110 },
      { key: '关联产品数', title: '关联产品数', width: 110 },
    ],
  },
];

function matchFileToCategory(fileDir: string, fileName: string, category: DataCategory): boolean {
  if (!category.files.length) return false;
  // Check directory filter
  if (category.dir && !fileDir.includes(category.dir)) return false;
  return category.files.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
    return regex.test(fileName);
  });
}

const defaultWizard: WizardState = {
  name: '',
  url: '',
  username: '',
  password: '',
  selectorSuggestions: null,
  selectors: {},
  analyzing: false,
  loginStatus: 'idle',
  error: null,
};

// ---- Electron IPC helper ----

function getElectronAPI() {
  return (window as any).electronAPI?.platformData ?? null;
}

// ---- Store ----

export const usePlatformDataStore = create<PlatformDataState>((set, get) => ({
  platform: 'guangdada',
  platforms: [],
  platformsLoaded: false,

  creatives: [],
  rankings: [],
  crossValidation: null,
  loading: false,
  scrapeProgress: { active: false, currentMethod: null, attempts: [], dataTypes: [] },

  // --- Smart download ---
  crawlPlatformId: '',
  downloadButtons: [],
  downloadRecords: [],
  downloadDetecting: false,
  scannedPages: [],
  scanning: false,
  scanProgress: null,

  // Credentials
  savedCredentials: null,

  // Bookmarks
  bookmarks: [],

  // Data categories
  dataCategories: DATA_CATEGORIES,
  activeCategory: 'overview',
  dataRecords: [],
  dataLoading: false,

  // Overview - restore from localStorage, fallback to mock
  overviewSummary: loadFromStorage<OverviewSummary>(OVERVIEW_STORAGE_KEY) || mockOverviewSummary,
  overviewLoading: false,

  addModalOpen: false,
  addModalStep: 0,
  currentWizard: { ...defaultWizard },

  // --- Data sources ---
  dataSources: [],
  collectionTasks: [],
  dataSourceLoading: false,

  fetchDataSources: async () => {
    set({ dataSourceLoading: true });
    await new Promise((r) => setTimeout(r, 500));
    set({ dataSources: mockDataSources, collectionTasks: mockCollectionTasks, dataSourceLoading: false });
  },

  syncDataSource: async (sourceId: string) => {
    set((s) => ({
      dataSources: s.dataSources.map((ds) =>
        ds.id === sourceId ? { ...ds, status: 'syncing' as const } : ds
      ),
    }));
    await new Promise((r) => setTimeout(r, 2000));
    const newTask: CollectionTask = {
      id: `task-${Date.now()}`,
      source: get().dataSources.find((ds) => ds.id === sourceId)?.name ?? sourceId,
      type: 'manual',
      status: 'completed',
      startTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      endTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      recordCount: Math.floor(Math.random() * 50) + 10,
    };
    set((s) => ({
      dataSources: s.dataSources.map((ds) =>
        ds.id === sourceId
          ? { ...ds, status: 'connected' as const, lastSync: newTask.startTime, recordCount: ds.recordCount + (newTask.recordCount ?? 0) }
          : ds
      ),
      collectionTasks: [newTask, ...s.collectionTasks],
    }));
  },

  addManualCreatives: async (creatives: Partial<Creative>[]) => {
    set({ loading: true });
    await new Promise((r) => setTimeout(r, 800));
    const newCreatives: Creative[] = creatives.map((c, i) => ({
      creative_id: `manual_${Date.now()}_${i}`,
      platform: c.platform ?? 'manual',
      title: c.title ?? '手动上传素材',
      advertiser: c.advertiser ?? '手动补充',
      impressions: c.impressions ?? 0,
      creativeType: c.creativeType ?? 'image',
      thumbnail: c.thumbnail ?? 'https://placehold.co/120x90/1E293B/94A3B8?text=📤',
      videoUrl: c.videoUrl,
      duration: c.duration,
      scraped_at: new Date().toISOString().slice(0, 10),
    }));
    set((s) => ({
      creatives: [...s.creatives, ...newCreatives],
      loading: false,
      dataSources: s.dataSources.map((ds) =>
        ds.id === 'src-manual'
          ? { ...ds, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' '), recordCount: ds.recordCount + newCreatives.length }
          : ds
      ),
    }));
  },

  runCollectionTask: async (sourceId: string) => {
    const source = get().dataSources.find((ds) => ds.id === sourceId);
    if (!source) return;
    const newTask: CollectionTask = {
      id: `task-${Date.now()}`,
      source: source.name,
      type: 'trigger',
      status: 'running',
      startTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    set((s) => ({ collectionTasks: [newTask, ...s.collectionTasks] }));
    await new Promise((r) => setTimeout(r, 3000));
    const success = source.status !== 'error';
    set((s) => ({
      collectionTasks: s.collectionTasks.map((t) =>
        t.id === newTask.id
          ? {
              ...t,
              status: (success ? 'completed' : 'failed') as 'completed' | 'failed',
              endTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
              recordCount: success ? Math.floor(Math.random() * 100) + 20 : undefined,
              error: success ? undefined : '数据源连接失败，请检查配置',
            }
          : t
      ),
      dataSources: s.dataSources.map((ds) =>
        ds.id === sourceId
          ? { ...ds, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' '), status: (success ? 'connected' : 'error') as 'connected' | 'error' }
          : ds
      ),
    }));
  },

  // --- Smart download actions ---

  setCrawlPlatformId: (id: string) => set({ crawlPlatformId: id }),

  startAutoScan: async () => {
    const platformId = get().crawlPlatformId;
    if (!platformId) return;
    const electron = (window as any).electronAPI?.platformData;
    if (!electron?.autoScan) return;

    set({ scanning: true, scannedPages: [], scanProgress: null });

    // Register progress listener
    if (electron.onScanProgress) {
      electron.onScanProgress((data: { page: number; maxPages: number; url: string; found: number }) => {
        set({ scanProgress: data });
      });
    }

    try {
      const pages = await electron.autoScan(platformId, 10);
      set({ scannedPages: pages ?? [], scanning: false, scanProgress: null });
    } catch {
      set({ scannedPages: [], scanning: false, scanProgress: null });
    }
  },

  // --- Credential actions ---

  checkSavedCredentials: async (siteKey: string) => {
    const electron = (window as any).electronAPI?.platformData;
    if (!electron?.getCredentials) return;
    try {
      const creds = await electron.getCredentials(siteKey);
      set({ savedCredentials: creds });
    } catch {
      set({ savedCredentials: null });
    }
  },

  saveCredentials: async (siteKey: string, username: string, password: string) => {
    const electron = (window as any).electronAPI?.platformData;
    if (!electron?.saveCredentials) return;
    try {
      await electron.saveCredentials(siteKey, { username, password });
      set({ savedCredentials: { username, password } });
    } catch {}
  },

  autoLogin: async (username: string, password: string) => {
    const platformId = get().crawlPlatformId;
    if (!platformId) return;
    const electron = (window as any).electronAPI?.platformData;
    if (!electron?.autoLogin) return;
    try {
      await electron.autoLogin(platformId, { username, password });
    } catch {}
  },

  // --- Bookmark actions ---

  fetchBookmarks: async () => {
    const electron = (window as any).electronAPI?.platformData;
    if (!electron?.getBookmarks) return;
    try {
      const bms = await electron.getBookmarks();
      set({ bookmarks: bms ?? [] });
    } catch {}
  },

  addBookmark: async (name: string, url: string) => {
    const electron = (window as any).electronAPI?.platformData;
    if (!electron?.addBookmark) return;
    try {
      await electron.addBookmark(name, url);
      const bms = await electron.getBookmarks();
      set({ bookmarks: bms ?? [] });
    } catch {}
  },

  deleteBookmark: async (id: string) => {
    const electron = (window as any).electronAPI?.platformData;
    if (!electron?.deleteBookmark) return;
    try {
      await electron.deleteBookmark(id);
      const bms = await electron.getBookmarks();
      set({ bookmarks: bms ?? [] });
    } catch {}
  },

  // --- Data category actions ---

  setActiveCategory: (id: string) => {
    const mock = mockCategoryRecords[id] || [];
    set({ activeCategory: id, dataRecords: mock });
  },

  loadCategoryData: async (crawlDir: string, categoryId?: string) => {
    const catId = categoryId ?? get().activeCategory;
    const category = get().dataCategories.find(c => c.id === catId);
    if (!category) return;

    const electron = (window as any).electronAPI?.platformData;

    set({ activeCategory: catId });
    // Only show loading if no mock data exists for this category
    if (!mockCategoryRecords[catId]?.length) {
      set({ dataLoading: true });
    }
    try {
      let files: { name: string; path: string; size: number; dir: string }[];

      if (electron?.listCrawledFiles) {
        files = await electron.listCrawledFiles(crawlDir);
      } else {
        // Browser fallback: use backend API
        files = await platformApi.listLocalFiles(crawlDir) as unknown as any[];
      }

      const matched = files.filter(f => matchFileToCategory(f.dir, f.name, category));

      const allRecords: DataRecord[] = [];
      for (const file of matched) {
        try {
          let buffer: ArrayBuffer;
          if (electron?.readLocalFile) {
            const bytes: number[] = await electron.readLocalFile(file.path);
            buffer = new Uint8Array(bytes).buffer;
          } else {
            buffer = await platformApi.readLocalFile(file.path) as unknown as ArrayBuffer;
          }
          const wb = XLSX.read(buffer, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
          for (const row of jsonData) {
            allRecords.push({ ...row, _source: file.name, _category: catId });
          }
        } catch {}
      }
      // Use real data if found, otherwise mock data
      const records = allRecords.length > 0 ? allRecords : (mockCategoryRecords[catId] || []);
      set({ dataRecords: records, dataLoading: false });
      if (allRecords.length > 0) {
        saveToStorage(STORAGE_KEY_PREFIX + catId, allRecords);
        _platformRecordsByCategory[catId] = allRecords;
        syncToMaterialData();
      }
    } catch {
      const cached = loadFromStorage<DataRecord[]>(STORAGE_KEY_PREFIX + catId);
      const fallback = cached && cached.length > 0 ? cached : (mockCategoryRecords[catId] || []);
      set({ dataRecords: fallback, dataLoading: false });
    }
  },

  uploadDataFile: async (file: File, categoryId: string) => {
    set({ dataLoading: true });
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      const records: DataRecord[] = jsonData.map(row => ({
        ...row,
        _source: file.name,
        _category: categoryId,
      }));

      set((s) => ({
        dataRecords: categoryId === s.activeCategory ? records : s.dataRecords,
        dataLoading: false,
      }));
      saveToStorage(STORAGE_KEY_PREFIX + categoryId, records);
      _platformRecordsByCategory[categoryId] = records;
      syncToMaterialData();
    } catch {
      set({ dataLoading: false });
    }
  },

  loadOverviewSummary: async (crawlDir: string) => {
    const electron = (window as any).electronAPI?.platformData;

    // Don't show loading spinner if we already have data
    const hasData = get().overviewSummary !== null;
    if (!hasData) {
      set({ overviewLoading: true });
    }
    try {
      let files: { name: string; path: string; size: number; dir: string }[];

      if (electron?.listCrawledFiles) {
        files = await electron.listCrawledFiles(crawlDir);
      } else {
        // Browser fallback: use backend API
        files = await platformApi.listLocalFiles(crawlDir) as unknown as any[];
      }

      const categories = get().dataCategories.filter(c => c.id !== 'overview');

      // Load ALL records across all categories
      const allRecordsByCategory: Record<string, DataRecord[]> = {};
      const categoryFileCounts: Record<string, number> = {};

      for (const cat of categories) {
        const matched = files.filter(f => matchFileToCategory(f.dir, f.name, cat));
        categoryFileCounts[cat.id] = matched.length;
        allRecordsByCategory[cat.id] = [];

        for (const file of matched) {
          try {
            let buffer: ArrayBuffer;
            if (electron?.readLocalFile) {
              const bytes: number[] = await electron.readLocalFile(file.path);
              buffer = new Uint8Array(bytes).buffer;
            } else {
              buffer = await platformApi.readLocalFile(file.path) as unknown as ArrayBuffer;
            }
            const wb = XLSX.read(buffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
            for (const row of jsonData) {
              allRecordsByCategory[cat.id].push({ ...row, _source: file.name, _category: cat.id });
            }
          } catch {}
        }
      }

      // Build summary
      const totalRecords = Object.values(allRecordsByCategory).reduce((s, r) => s + r.length, 0);

      // If no real data found, use mock overview
      if (totalRecords === 0) {
        set({ overviewSummary: mockOverviewSummary, overviewLoading: false });
        return;
      }

      const categoryStats = categories.map(cat => ({
        id: cat.id, name: cat.name, icon: cat.icon,
        fileCount: categoryFileCounts[cat.id] ?? 0,
        recordCount: allRecordsByCategory[cat.id]?.length ?? 0,
      }));

      // Top games by 素材数 (domestic + overseas)
      const gameMap = new Map<string, { score: number; company: string; source: string }>();
      for (const [catId, records] of Object.entries(allRecordsByCategory)) {
        for (const r of records) {
          const name = r['游戏名'] || r['产品名称'] || '';
          if (!name) continue;
          const score = parseInt(String(r['素材数'] || r['投放素材数'] || '0').replace(/[^0-9]/g, '')) || 0;
          const company = r['主投公司'] || r['公司名称'] || '';
          const existing = gameMap.get(name);
          if (!existing || score > existing.score) {
            gameMap.set(name, { score, company, source: catId });
          }
        }
      }
      const topGames = [...gameMap.entries()]
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 20)
        .map(([name, v]) => ({ name, ...v }));

      // Top companies
      const companyMap = new Map<string, number>();
      for (const records of Object.values(allRecordsByCategory)) {
        for (const r of records) {
          const company = r['主投公司'] || r['公司名称'] || '';
          if (company) companyMap.set(company, (companyMap.get(company) ?? 0) + 1);
        }
      }
      const topCompanies = [...companyMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, count]) => ({ name, count }));

      // Top genres
      const genreMap = new Map<string, number>();
      for (const records of Object.values(allRecordsByCategory)) {
        for (const r of records) {
          const genre = r['题材'] || '';
          if (genre) genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
        }
      }
      const topGenres = [...genreMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Top media
      const mediaMap = new Map<string, number>();
      for (const records of Object.values(allRecordsByCategory)) {
        for (const r of records) {
          for (const key of ['投放媒体TOP1', '投放媒体TOP2', '投放媒体TOP3', '投放媒体Top1', '投放媒体Top2']) {
            const media = r[key] || '';
            if (media) mediaMap.set(media, (mediaMap.get(media) ?? 0) + 1);
          }
        }
      }
      const topMedia = [...mediaMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Top countries (overseas data)
      const countryMap = new Map<string, number>();
      for (const [catId, records] of Object.entries(allRecordsByCategory)) {
        if (!['overseas', 'overseas_out', 'overseas_reserve', 'drama'].includes(catId)) continue;
        for (const r of records) {
          for (const key of ['投放国家/地区Top1', '投放国家/地区Top2', '公司总部', '预约国家地区']) {
            const country = r[key] || '';
            if (country) countryMap.set(country, (countryMap.get(country) ?? 0) + 1);
          }
        }
      }
      const topCountries = [...countryMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Top dramas
      const dramaRecords = allRecordsByCategory['drama'] ?? [];
      const topDramas = dramaRecords
        .map(r => ({
          name: r['剧名'] || '',
          score: parseInt(String(r['投放素材数'] || '0').replace(/[^0-9]/g, '')) || 0,
          country: r['投放国家/地区Top1'] || '',
        }))
        .filter(d => d.name)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Average material per game
      const totalMaterial = [...gameMap.values()].reduce((s, g) => s + g.score, 0);
      const avgMaterialPerGame = gameMap.size > 0 ? Math.round(totalMaterial / gameMap.size) : 0;

      // Long-term advertising games (投放天数)
      const longTermGames: { name: string; days: number; company: string }[] = [];
      for (const records of Object.values(allRecordsByCategory)) {
        for (const r of records) {
          const name = r['游戏名'] || r['产品名称'] || '';
          const days = parseInt(String(r['投放天数'] || r['持续投放天数'] || '0').replace(/[^0-9]/g, '')) || 0;
          const company = r['主投公司'] || r['公司名称'] || '';
          if (name && days > 0) longTermGames.push({ name, days, company });
        }
      }
      longTermGames.sort((a, b) => b.days - a.days);

      // Ranking changes (rising / declining)
      const risingGames: { name: string; company: string; change: string }[] = [];
      const decliningGames: { name: string; company: string; change: string }[] = [];
      for (const records of Object.values(allRecordsByCategory)) {
        for (const r of records) {
          const name = r['游戏名'] || r['产品名称'] || '';
          const change = String(r['排名变化'] || '').trim();
          const company = r['主投公司'] || r['公司名称'] || '';
          if (!name || !change || change === '-') continue;
          if (change.includes('↑') || (parseInt(change) < 0)) {
            risingGames.push({ name, company, change });
          } else if (change.includes('↓') || (parseInt(change) > 0)) {
            decliningGames.push({ name, company, change });
          }
        }
      }

      // Cross-region companies (appear in both domestic and overseas)
      const companyRegions = new Map<string, Set<string>>();
      const companyGameCount = new Map<string, number>();
      for (const [catId, records] of Object.entries(allRecordsByCategory)) {
        const isDomestic = ['domestic', 'domestic_new', 'domestic_reserve'].includes(catId);
        const isOverseas = ['overseas', 'overseas_out', 'overseas_reserve'].includes(catId);
        if (!isDomestic && !isOverseas) continue;
        const region = isDomestic ? '国内' : '海外';
        for (const r of records) {
          const company = r['主投公司'] || r['公司名称'] || '';
          if (!company) continue;
          if (!companyRegions.has(company)) companyRegions.set(company, new Set());
          companyRegions.get(company)!.add(region);
          companyGameCount.set(company, (companyGameCount.get(company) ?? 0) + 1);
        }
      }
      const crossRegionCompanies = [...companyRegions.entries()]
        .filter(([, regions]) => regions.size > 1)
        .map(([name, regions]) => ({ name, regions: [...regions], gameCount: companyGameCount.get(name) ?? 0 }))
        .sort((a, b) => b.gameCount - a.gameCount)
        .slice(0, 10);

      // Media strategy analysis
      const mediaGameMap = new Map<string, { games: Set<string>; topGame: string; topScore: number }>();
      for (const records of Object.values(allRecordsByCategory)) {
        for (const r of records) {
          const gameName = r['游戏名'] || r['产品名称'] || '';
          const score = parseInt(String(r['素材数'] || r['投放素材数'] || '0').replace(/[^0-9]/g, '')) || 0;
          for (const key of ['投放媒体TOP1', '投放媒体TOP2', '投放媒体TOP3', '投放媒体Top1', '投放媒体Top2']) {
            const media = r[key] || '';
            if (!media || !gameName) continue;
            if (!mediaGameMap.has(media)) mediaGameMap.set(media, { games: new Set(), topGame: '', topScore: 0 });
            const entry = mediaGameMap.get(media)!;
            entry.games.add(gameName);
            if (score > entry.topScore) { entry.topScore = score; entry.topGame = gameName; }
          }
        }
      }
      const mediaStrategy = [...mediaGameMap.entries()]
        .map(([media, v]) => ({ media, gameCount: v.games.size, topGame: v.topGame }))
        .sort((a, b) => b.gameCount - a.gameCount)
        .slice(0, 8);

      // Genre by region (domestic vs overseas)
      const genreDomestic = new Map<string, number>();
      const genreOverseas = new Map<string, number>();
      for (const [catId, records] of Object.entries(allRecordsByCategory)) {
        const isDomestic = ['domestic', 'domestic_new', 'domestic_reserve'].includes(catId);
        const isOverseas = ['overseas', 'overseas_out', 'overseas_reserve'].includes(catId);
        if (!isDomestic && !isOverseas) continue;
        const target = isDomestic ? genreDomestic : genreOverseas;
        for (const r of records) {
          const genre = r['题材'] || '';
          if (genre) target.set(genre, (target.get(genre) ?? 0) + 1);
        }
      }
      const allGenres = new Set([...genreDomestic.keys(), ...genreOverseas.keys()]);
      const genreByRegion = [...allGenres]
        .map(genre => ({ genre, domestic: genreDomestic.get(genre) ?? 0, overseas: genreOverseas.get(genre) ?? 0 }))
        .sort((a, b) => (b.domestic + b.overseas) - (a.domestic + a.overseas))
        .slice(0, 10);

      // Reserve games
      const reserveRecords = [...(allRecordsByCategory['domestic_reserve'] ?? []), ...(allRecordsByCategory['overseas_reserve'] ?? [])];
      const reserveGames = reserveRecords
        .map(r => ({
          name: r['游戏名'] || r['产品名称'] || '',
          company: r['主投公司'] || r['公司名称'] || '',
          launchDate: r['预计上线时间'] || '',
        }))
        .filter(g => g.name)
        .sort((a, b) => (a.launchDate || 'z').localeCompare(b.launchDate || 'z'))
        .slice(0, 10);

      // Drama keywords
      const keywordMap = new Map<string, number>();
      for (const r of allRecordsByCategory['drama_copy'] ?? []) {
        const word = r['高频词'] || '';
        if (word) keywordMap.set(word, (keywordMap.get(word) ?? 0) + 1);
      }
      const dramaKeywords = [...keywordMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([word, count]) => ({ word, count }));

      // Drama country distribution
      const dramaCountryMap = new Map<string, number>();
      for (const r of allRecordsByCategory['drama'] ?? []) {
        for (const key of ['投放国家/地区Top1', '投放国家/地区Top2']) {
          const country = r[key] || '';
          if (country) dramaCountryMap.set(country, (dramaCountryMap.get(country) ?? 0) + 1);
        }
      }
      const dramaCountryDist = [...dramaCountryMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }));

      // Drama tag cloud
      const dramaTagMap = new Map<string, number>();
      for (const r of allRecordsByCategory['drama'] ?? []) {
        const tags = String(r['标签'] || '').split(/[,，、/|]/);
        for (const tag of tags) {
          const t = tag.trim();
          if (t) dramaTagMap.set(t, (dramaTagMap.get(t) ?? 0) + 1);
        }
      }
      const dramaTagCloud = [...dramaTagMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag, count]) => ({ tag, count }));

      // Drama top products (投放产品)
      const dramaProductMap = new Map<string, number>();
      for (const r of allRecordsByCategory['drama'] ?? []) {
        for (const key of ['投放产品Top1', '投放产品Top2']) {
          const product = r[key] || '';
          if (product) dramaProductMap.set(product, (dramaProductMap.get(product) ?? 0) + 1);
        }
      }
      const dramaTopProducts = [...dramaProductMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([product, dramaCount]) => ({ product, dramaCount }));

      // Drama duration (投放天数) distribution
      const dramaDayBuckets = { '1-7天': 0, '8-14天': 0, '15-30天': 0, '31-60天': 0, '60天+': 0 };
      for (const r of allRecordsByCategory['drama'] ?? []) {
        const days = parseInt(String(r['持续投放天数'] || '0').replace(/[^0-9]/g, '')) || 0;
        if (days <= 0) continue;
        if (days <= 7) dramaDayBuckets['1-7天']++;
        else if (days <= 14) dramaDayBuckets['8-14天']++;
        else if (days <= 30) dramaDayBuckets['15-30天']++;
        else if (days <= 60) dramaDayBuckets['31-60天']++;
        else dramaDayBuckets['60天+']++;
      }
      const dramaDurationDist = Object.entries(dramaDayBuckets).map(([range, count]) => ({ range, count }));

      // Gameplay types
      const gameplayMap = new Map<string, number>();
      for (const records of Object.values(allRecordsByCategory)) {
        for (const r of records) {
          const gameplay = r['玩法'] || '';
          if (gameplay) gameplayMap.set(gameplay, (gameplayMap.get(gameplay) ?? 0) + 1);
        }
      }
      const gameplayTypes = [...gameplayMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Publishing days distribution
      const dayBuckets = { '1-7天': 0, '8-14天': 0, '15-30天': 0, '31-60天': 0, '60天+': 0 };
      for (const records of Object.values(allRecordsByCategory)) {
        for (const r of records) {
          const days = parseInt(String(r['投放天数'] || r['持续投放天数'] || '0').replace(/[^0-9]/g, '')) || 0;
          if (days <= 0) continue;
          if (days <= 7) dayBuckets['1-7天']++;
          else if (days <= 14) dayBuckets['8-14天']++;
          else if (days <= 30) dayBuckets['15-30天']++;
          else if (days <= 60) dayBuckets['31-60天']++;
          else dayBuckets['60天+']++;
        }
      }
      const publishingDays = Object.entries(dayBuckets).map(([range, count]) => ({ range, count }));

      // Top outbound (出海) companies
      const outboundMap = new Map<string, { overseasGames: number; markets: Map<string, number> }>();
      for (const catId of ['overseas', 'overseas_out']) {
        for (const r of allRecordsByCategory[catId] ?? []) {
          const company = r['公司名称'] || '';
          if (!company) continue;
          if (!outboundMap.has(company)) outboundMap.set(company, { overseasGames: 0, markets: new Map() });
          const entry = outboundMap.get(company)!;
          entry.overseasGames++;
          const market = r['投放国家/地区Top1'] || '';
          if (market) entry.markets.set(market, (entry.markets.get(market) ?? 0) + 1);
        }
      }
      const topOutboundCompanies = [...outboundMap.entries()]
        .map(([name, v]) => ({
          name,
          overseasGames: v.overseasGames,
          topMarket: [...v.markets.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
        }))
        .sort((a, b) => b.overseasGames - a.overseasGames)
        .slice(0, 10);

      // Generate insights
      const insights: string[] = [];
      if (topGames.length > 0) {
        insights.push(`买量最猛的游戏是「${topGames[0].name}」，素材数达 ${topGames[0].score.toLocaleString()}，由 ${topGames[0].company || '未知公司'} 投放`);
      }
      if (topCompanies.length > 0) {
        insights.push(`投放公司最活跃的是「${topCompanies[0].name}」，涉及 ${topCompanies[0].count} 条数据记录`);
      }
      if (topGenres.length > 0) {
        const top3 = topGenres.slice(0, 3).map(g => g.name).join('、');
        insights.push(`热门题材集中在「${top3}」`);
      }
      if (topMedia.length > 0) {
        insights.push(`投放媒体首选「${topMedia[0].name}」，出现 ${topMedia[0].count} 次`);
      }
      if (topCountries.length > 0) {
        const top3 = topCountries.slice(0, 3).map(c => c.name).join('、');
        insights.push(`海外投放重点地区：${top3}`);
      }
      if (topDramas.length > 0) {
        insights.push(`短剧投放TOP1：「${topDramas[0].name}」，素材数 ${topDramas[0].score.toLocaleString()}`);
      }
      const domesticTotal = (allRecordsByCategory['domestic']?.length ?? 0) + (allRecordsByCategory['domestic_new']?.length ?? 0) + (allRecordsByCategory['domestic_reserve']?.length ?? 0);
      const overseasTotal = (allRecordsByCategory['overseas']?.length ?? 0) + (allRecordsByCategory['overseas_out']?.length ?? 0) + (allRecordsByCategory['overseas_reserve']?.length ?? 0);
      if (domesticTotal > 0 && overseasTotal > 0) {
        insights.push(`国内数据 ${domesticTotal} 条 vs 海外数据 ${overseasTotal} 条，${domesticTotal > overseasTotal ? '国内市场覆盖更全' : '海外市场数据更丰富'}`);
      }
      if (avgMaterialPerGame > 0) {
        insights.push(`平均每款游戏投放素材 ${avgMaterialPerGame.toLocaleString()} 组`);
      }
      if (longTermGames.length > 0) {
        insights.push(`持续投放最久的是「${longTermGames[0].name}」，已投放 ${longTermGames[0].days} 天`);
      }
      if (crossRegionCompanies.length > 0) {
        insights.push(`${crossRegionCompanies.length} 家公司同时布局国内和海外市场，其中「${crossRegionCompanies[0].name}」覆盖 ${crossRegionCompanies[0].gameCount} 款游戏`);
      }
      if (gameplayTypes.length > 0) {
        const top3 = gameplayTypes.slice(0, 3).map(g => g.name).join('、');
        insights.push(`玩法类型热门：${top3}`);
      }
      if (reserveGames.length > 0) {
        insights.push(`${reserveGames.length} 款预约游戏蓄势待发，关注「${reserveGames[0].name}」预计 ${reserveGames[0].launchDate || '近期'} 上线`);
      }
      if (topOutboundCompanies.length > 0) {
        insights.push(`出海最猛的公司是「${topOutboundCompanies[0].name}」，主攻 ${topOutboundCompanies[0].topMarket}，涉及 ${topOutboundCompanies[0].overseasGames} 款游戏`);
      }

      set({
        overviewSummary: {
          totalFiles: files.length,
          totalRecords,
          categoryStats,
          topGames,
          topCompanies,
          topGenres,
          topMedia,
          topCountries,
          topDramas,
          insights,
          avgMaterialPerGame,
          longTermGames,
          risingGames,
          decliningGames,
          crossRegionCompanies,
          mediaStrategy,
          genreByRegion,
          reserveGames,
          dramaKeywords,
          gameplayTypes,
          publishingDays,
          topOutboundCompanies,
          dramaCountryDist,
          dramaTagCloud,
          dramaTopProducts,
          dramaDurationDist,
        },
        overviewLoading: false,
      });
      saveToStorage(OVERVIEW_STORAGE_KEY, {
        totalFiles: files.length, totalRecords, categoryStats, topGames, topCompanies,
        topGenres, topMedia, topCountries, topDramas, insights, avgMaterialPerGame,
        longTermGames, risingGames, decliningGames, crossRegionCompanies, mediaStrategy,
        genreByRegion, reserveGames, dramaKeywords, gameplayTypes, publishingDays,
        topOutboundCompanies, dramaCountryDist, dramaTagCloud, dramaTopProducts, dramaDurationDist,
      });
      // Sync all category records to shared MaterialData store
      Object.assign(_platformRecordsByCategory, allRecordsByCategory);
      syncToMaterialData();
    } catch {
      // Fallback to mock data for preview
      set({ overviewSummary: mockOverviewSummary, overviewLoading: false });
      saveToStorage(OVERVIEW_STORAGE_KEY, mockOverviewSummary);
      // Also sync mock data to shared store
      for (const [catId, records] of Object.entries(mockCategoryRecords)) {
        _platformRecordsByCategory[catId] = records;
      }
      syncToMaterialData();
    }
  },

  detectDownloadButtons: async () => {
    set({ downloadDetecting: true });
    const platformId = get().crawlPlatformId || get().platform;
    const electron = (window as any).electronAPI?.platformData;
    if (!electron) {
      // Mock: simulate finding download buttons
      await new Promise((r) => setTimeout(r, 800));
      set({
        downloadButtons: [
          { text: '导出Excel', selector: '.export-btn', confidence: 0.95, tagName: 'button' },
          { text: '下载数据', selector: '#download-all', confidence: 0.88, tagName: 'a' },
        ],
        downloadDetecting: false,
      });
      return;
    }
    try {
      const res = await electron.detectDownloads(platformId);
      set({ downloadButtons: res?.buttons ?? [], downloadDetecting: false });
    } catch {
      set({ downloadButtons: [], downloadDetecting: false });
    }
  },

  clickDownloadButton: async (selector: string) => {
    const platformId = get().crawlPlatformId || get().platform;
    const electron = (window as any).electronAPI?.platformData;
    if (!electron) {
      // Mock: simulate download — 保存到本地，不自动导入
      const mockRecord: DownloadRecord = {
        platformId: platformId,
        filePath: `D:\\crawled\\${platformId}\\export_${Date.now()}.xlsx`,
        fileName: `${platformId}_export_${Date.now()}.xlsx`,
        fileSize: 1024 * 50 + Math.floor(Math.random() * 1024 * 100),
        downloadedAt: new Date().toISOString(),
        status: 'pending',
      };
      set((s) => ({ downloadRecords: [mockRecord, ...s.downloadRecords] }));
      return;
    }
    await electron.clickDownload(platformId, selector);
  },

  importDownloadedFile: async (record: DownloadRecord) => {
    // Mark as importing
    set((s) => ({
      downloadRecords: s.downloadRecords.map((r) =>
        r.filePath === record.filePath ? { ...r, status: 'importing' as const } : r
      ),
    }));

    try {
      // Read file via Electron IPC or fetch
      const electron = (window as any).electronAPI?.platformData;
      let fileBuffer: ArrayBuffer;

      if (electron?.readLocalFile && record.filePath && !record.filePath.startsWith('/mock')) {
        // In Electron, read file via IPC (fs.readFileSync in main process)
        const bytes: number[] = await electron.readLocalFile(record.filePath);
        fileBuffer = new Uint8Array(bytes).buffer;
      } else {
        // Mock data - generate sample Excel-like data
        const ws = XLSX.utils.aoa_to_sheet([
          ['广告主', '素材标题', '曝光量', '类型', '素材链接'],
          ['AdXray测试广告主1', '测试素材标题1', '150000', '视频', ''],
          ['AdXray测试广告主2', '测试素材标题2', '98000', '图片', ''],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        fileBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      }

      // Parse with SheetJS
      const wb = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      // Map columns to Creative structure
      const columnMapping: Record<string, string> = {
        '广告主': 'advertiser', 'advertiser': 'advertiser', 'Advertiser': 'advertiser', '广告主名称': 'advertiser',
        '素材标题': 'title', 'title': 'title', 'Title': 'title', '素材名称': 'title', '广告标题': 'title',
        '曝光量': 'impressions', 'impressions': 'impressions', 'Impressions': 'impressions', '展示次数': 'impressions', '展示量': 'impressions',
        '类型': 'creativeType', 'type': 'creativeType', 'Type': 'creativeType', '素材类型': 'creativeType',
        '素材链接': 'thumbnail', 'url': 'thumbnail', 'URL': 'thumbnail', '图片链接': 'thumbnail', '素材URL': 'thumbnail',
        '视频链接': 'videoUrl', 'videoUrl': 'videoUrl', '视频URL': 'videoUrl',
      };

      const platformId = get().crawlPlatformId || get().platform;
      const creatives: Creative[] = jsonData.map((row, i) => {
        const mapped: Record<string, any> = {};
        for (const [colName, value] of Object.entries(row)) {
          const fieldName = columnMapping[colName];
          if (fieldName) mapped[fieldName] = value;
        }
        const typeStr = String(mapped.creativeType ?? '视频').toLowerCase();
        return {
          creative_id: `import_${Date.now()}_${i}`,
          platform: platformId,
          title: String(mapped.title ?? '-'),
          advertiser: String(mapped.advertiser ?? '未知'),
          impressions: parseInt(String(mapped.impressions ?? '0').replace(/[^0-9]/g, '')) || 0,
          creativeType: (typeStr.includes('视频') || typeStr.includes('video') ? 'video' : 'image') as 'video' | 'image',
          thumbnail: String(mapped.thumbnail ?? ''),
          videoUrl: mapped.videoUrl ? String(mapped.videoUrl) : undefined,
          scraped_at: new Date().toISOString().slice(0, 10),
        };
      });

      // Store to backend
      if (creatives.length > 0) {
        try {
          await platformApi.storeScrapedData({
            platform_id: platformId,
            data_type: 'creatives',
            data: creatives,
          });
        } catch {
          // Backend store failed, but data is still available locally
        }
        // Add to local creatives
        set((s) => ({ creatives: [...creatives, ...s.creatives] }));
      }

      // Mark as done
      set((s) => ({
        downloadRecords: s.downloadRecords.map((r) =>
          r.filePath === record.filePath
            ? { ...r, status: 'done' as const, imported: creatives.length }
            : r
        ),
      }));
    } catch (err: any) {
      set((s) => ({
        downloadRecords: s.downloadRecords.map((r) =>
          r.filePath === record.filePath
            ? { ...r, status: 'error' as const, error: err?.message ?? '解析失败' }
            : r
        ),
      }));
    }
  },

  initDownloadListener: () => {
    const electron = (window as any).electronAPI?.platformData;
    if (!electron?.onDownloadComplete) return;
    electron.onDownloadComplete((record: DownloadRecord) => {
      // 下载完成，保存到列表，等用户确认后再导入
      const withStatus = { ...record, status: 'pending' as const };
      set((s) => ({ downloadRecords: [withStatus, ...s.downloadRecords] }));
    });
  },

  // --- Platform selection ---

  setPlatform: (p) => {
    set({ platform: p, creatives: [], rankings: [], crossValidation: null });
  },

  // --- Fetch saved platform configs from backend ---

  fetchPlatforms: async () => {
    try {
      const res: any = await platformApi.getConfigs();
      const configs: PlatformConfig[] = res?.data ?? res ?? [];
      if (configs.length > 0) {
        set({ platforms: configs, platformsLoaded: true });
      } else {
        // Fallback defaults
        set({
          platforms: [
            { id: 'guangdada', name: '广大大', url: '', selectors: {}, created_at: '' },
            { id: 'adxray', name: 'AdXRay', url: '', selectors: {}, created_at: '' },
          ],
          platformsLoaded: true,
        });
      }
    } catch {
      set({
        platforms: [
          { id: 'guangdada', name: '广大大', url: '', selectors: {}, created_at: '' },
          { id: 'adxray', name: 'AdXRay', url: '', selectors: {}, created_at: '' },
        ],
        platformsLoaded: true,
      });
    }
  },

  // --- Fetch creatives (API with mock fallback) ---

  fetchCreatives: async () => {
    set({ loading: true });
    try {
      const platform = get().platform;
      const res: any = await platformApi.getCreatives(platform);
      const data: Creative[] = res?.data ?? res ?? [];
      if (data.length > 0) {
        set({ creatives: data });
      } else {
        // fallback to mock
        await new Promise((r) => setTimeout(r, 300));
        set({ creatives: mockCreatives[platform] ?? [] });
      }
    } catch {
      const platform = get().platform;
      await new Promise((r) => setTimeout(r, 300));
      set({ creatives: mockCreatives[platform] ?? [] });
    } finally {
      set({ loading: false });
    }
  },

  // --- Fetch rankings (API with mock fallback) ---

  fetchRankings: async () => {
    set({ loading: true });
    try {
      const platform = get().platform;
      const res: any = await platformApi.getRankings(platform);
      const data: Ranking[] = res?.data ?? res ?? [];
      if (data.length > 0) {
        set({ rankings: data });
      } else {
        await new Promise((r) => setTimeout(r, 300));
        set({ rankings: mockRankings[platform] ?? [] });
      }
    } catch {
      const platform = get().platform;
      await new Promise((r) => setTimeout(r, 300));
      set({ rankings: mockRankings[platform] ?? [] });
    } finally {
      set({ loading: false });
    }
  },

  // --- Cross validation (API with mock fallback) ---

  runCrossValidation: async () => {
    set({ loading: true });
    try {
      const res: any = await platformApi.crossValidate();
      const data: CrossValidation = res?.data ?? res;
      if (data && typeof data.matched === 'number') {
        set({ crossValidation: data });
      } else {
        await new Promise((r) => setTimeout(r, 500));
        const platform = get().platform;
        set({ crossValidation: mockCrossValidation[platform] ?? null });
      }
    } catch {
      const platform = get().platform;
      await new Promise((r) => setTimeout(r, 500));
      set({ crossValidation: mockCrossValidation[platform] ?? null });
    } finally {
      set({ loading: false });
    }
  },

  // --- Wizard actions ---

  openAddModal: (prefill?: Partial<WizardState>) => {
    set({ addModalOpen: true, addModalStep: 0, currentWizard: { ...defaultWizard, ...prefill } });
  },

  closeAddModal: () => {
    set({ addModalOpen: false, addModalStep: 0, currentWizard: { ...defaultWizard } });
  },

  updateWizard: (fields) => {
    set((state) => ({ currentWizard: { ...state.currentWizard, ...fields } }));
  },

  setWizardStep: (step) => {
    set({ addModalStep: step });
  },

  // Step 2: Open browser and login via Electron IPC
  startBrowserFlow: async () => {
    const { currentWizard } = get();
    set((s) => ({ currentWizard: { ...s.currentWizard, loginStatus: 'logging-in', error: null } }));

    const electron = getElectronAPI();
    if (!electron) {
      // Dev mode without Electron - simulate success
      await new Promise((r) => setTimeout(r, 1500));
      set((s) => ({ currentWizard: { ...s.currentWizard, loginStatus: 'success' } }));
      return;
    }

    try {
      const tempId = `temp_${Date.now()}`;
      await electron.openPlatform(tempId, currentWizard.url);

      if (currentWizard.username && currentWizard.password) {
        await electron.autoLogin(tempId, {
          username: currentWizard.username,
          password: currentWizard.password,
        });
      }

      set((s) => ({
        currentWizard: { ...s.currentWizard, loginStatus: 'success' },
      }));
    } catch (err: any) {
      set((s) => ({
        currentWizard: { ...s.currentWizard, loginStatus: 'failed', error: err?.message ?? '登录失败' },
      }));
    }
  },

  // Step 3: Analyze page HTML with AI
  analyzeCurrentPage: async () => {
    set((s) => ({ currentWizard: { ...s.currentWizard, analyzing: true, error: null } }));

    const electron = getElectronAPI();

    try {
      let html = '';
      let url = get().currentWizard.url;

      if (electron) {
        html = await electron.extractHtml(`temp_${Date.now()}`);
      }

      if (!html) {
        // Fallback: send minimal html for demo
        html = '<html><body>demo</body></html>';
      }

      const res: any = await platformApi.analyzePage({ html, url });
      const suggestions: SelectorSuggestion[] = res?.data?.fields
        ? Object.entries(res.data.fields).map(([field, info]: [string, any]) => ({
            field,
            selector: info.selector ?? info,
            attribute: info.attribute ?? 'textContent',
            confidence: res.data.confidence ?? 0.8,
          }))
        : [];

      // Pre-fill selectors from AI suggestions
      const selectors: Record<string, { selector: string; attribute?: string }> = {};
      suggestions.forEach((s) => {
        selectors[s.field] = { selector: s.selector, attribute: s.attribute };
      });

      set((s) => ({
        currentWizard: {
          ...s.currentWizard,
          selectorSuggestions: suggestions,
          selectors,
          analyzing: false,
        },
      }));
    } catch (err: any) {
      // Fallback mock suggestions
      const mockSuggestions: SelectorSuggestion[] = [
        { field: 'title', selector: '.creative-title', attribute: 'textContent', confidence: 0.92 },
        { field: 'thumbnail', selector: '.creative-thumb img', attribute: 'src', confidence: 0.88 },
        { field: 'advertiser', selector: '.advertiser-name', attribute: 'textContent', confidence: 0.85 },
        { field: 'impressions', selector: '.impression-count', attribute: 'textContent', confidence: 0.78 },
      ];
      const selectors: Record<string, { selector: string; attribute?: string }> = {};
      mockSuggestions.forEach((s) => {
        selectors[s.field] = { selector: s.selector, attribute: s.attribute };
      });
      set((s) => ({
        currentWizard: {
          ...s.currentWizard,
          selectorSuggestions: mockSuggestions,
          selectors,
          analyzing: false,
        },
      }));
    }
  },

  // Step 3: Confirm and save selectors
  confirmSelectors: async () => {
    const { currentWizard } = get();
    const config: PlatformConfig = {
      id: `platform_${Date.now()}`,
      name: currentWizard.name,
      url: currentWizard.url,
      selectors: currentWizard.selectors,
    };

    try {
      // Save to backend
      await platformApi.saveConfig(config);

      // Also save to Electron if available
      const electron = getElectronAPI();
      if (electron) {
        await electron.savePlatform(config);
        if (currentWizard.username && currentWizard.password) {
          await electron.saveCredentials(config.id, {
            username: currentWizard.username,
            password: currentWizard.password,
          });
        }
      }

      // Add to local platforms list
      set((state) => ({
        platforms: [...state.platforms, config],
        addModalStep: 3,
      }));
    } catch {
      // Still add locally even if API fails
      set((state) => ({
        platforms: [...state.platforms, config],
        addModalStep: 3,
      }));
    }
  },

  // Trigger immediate scrape with multi-strategy fallback
  scrapePlatform: async (platformId?: string) => {
    const targetId = platformId ?? get().platform;
    const config = get().platforms.find((p) => p.id === targetId);
    const url = config?.url || '';
    const electron = getElectronAPI();

    const attempts: ScrapeAttempt[] = [];
    const dataTypes: ('creatives' | 'rankings')[] = ['creatives', 'rankings'];

    set({
      loading: true,
      scrapeProgress: { active: true, currentMethod: null, attempts: [], dataTypes },
    });

    const tryMethod = async (method: ScrapeMethod): Promise<{ creatives: Creative[]; rankings: Ranking[] } | null> => {
      const start = Date.now();
      set((s) => ({ scrapeProgress: { ...s.scrapeProgress, currentMethod: method } }));

      try {
        let result: { creatives: Creative[]; rankings: Ranking[] } | null = null;

        switch (method) {
          case 'electron': {
            if (!electron || !config?.url) throw new Error('Electron 不可用或平台未配置 URL');
            await electron.openPlatform(targetId, url);
            const scrapedItems: any[] = [];
            for (const [field, sel] of Object.entries(config.selectors)) {
              const results = await electron.runSelector(targetId, sel.selector, sel.attribute);
              scrapedItems.push({ field, results });
            }
            await electron.closePlatform(targetId);
            if (scrapedItems.length === 0) throw new Error('选择器未匹配到数据');
            // Parse electron results into creatives
            result = parseScrapedItems(scrapedItems, targetId);
            break;
          }

          case 'backend-proxy': {
            const res: any = await platformApi.scrapeProxy({ platform_id: targetId, url });
            const data = res?.data ?? res;
            if (!data?.creatives?.length && !data?.rankings?.length) throw new Error('后端代理未返回数据');
            result = {
              creatives: data.creatives ?? [],
              rankings: data.rankings ?? [],
            };
            break;
          }

          case 'ai-extract': {
            const res: any = await platformApi.analyzePage({ html: '', url, mode: 'full-extract' });
            const data = res?.data ?? res;
            if (!data?.creatives?.length && !data?.rankings?.length) throw new Error('AI 提取未返回数据');
            result = {
              creatives: data.creatives ?? [],
              rankings: data.rankings ?? [],
            };
            break;
          }

          case 'direct-fetch': {
            const res: any = await platformApi.directFetch({ url, platform_id: targetId });
            const data = res?.data ?? res;
            if (!data?.creatives?.length && !data?.rankings?.length) throw new Error('直接抓取未返回数据');
            result = {
              creatives: data.creatives ?? [],
              rankings: data.rankings ?? [],
            };
            break;
          }

          case 'mock': {
            await new Promise((r) => setTimeout(r, 500));
            result = {
              creatives: mockCreatives[targetId] ?? [],
              rankings: mockRankings[targetId] ?? [],
            };
            if (!result.creatives.length && !result.rankings.length) throw new Error('无可用的模拟数据');
            break;
          }
        }

        const duration = Date.now() - start;
        attempts.push({ method, status: 'success', duration });
        set((s) => ({ scrapeProgress: { ...s.scrapeProgress, attempts: [...attempts] } }));
        return result;
      } catch (err: any) {
        const duration = Date.now() - start;
        attempts.push({ method, status: 'failed', error: err?.message ?? '未知错误', duration });
        set((s) => ({ scrapeProgress: { ...s.scrapeProgress, attempts: [...attempts] } }));
        return null;
      }
    };

    // Strategy chain: electron → backend-proxy → ai-extract → direct-fetch → mock
    const strategies: ScrapeMethod[] = url
      ? ['electron', 'backend-proxy', 'ai-extract', 'direct-fetch', 'mock']
      : ['backend-proxy', 'ai-extract', 'direct-fetch', 'mock'];

    let result: { creatives: Creative[]; rankings: Ranking[] } | null = null;

    for (const method of strategies) {
      result = await tryMethod(method);
      if (result) break;
      // Mark fallback for next attempt
      if (attempts.length > 0) {
        attempts[attempts.length - 1].status = 'fallback';
      }
    }

    // Apply results
    if (result) {
      if (result.creatives.length > 0) {
        set({ creatives: result.creatives });
      }
      if (result.rankings.length > 0) {
        set({ rankings: result.rankings });
      }
      // Store via API for persistence
      try {
        await platformApi.storeScrapedData({
          platform_id: targetId,
          data_type: 'creatives',
          data: result.creatives,
        });
        await platformApi.storeScrapedData({
          platform_id: targetId,
          data_type: 'rankings',
          data: result.rankings,
        });
      } catch {}
    }

    set({
      loading: false,
      scrapeProgress: {
        active: false,
        currentMethod: null,
        attempts: [...attempts],
        dataTypes,
      },
    });
  },
}));

// ---- Parse scraped items from Electron into structured data ----

function parseScrapedItems(items: any[], platformId: string): { creatives: Creative[]; rankings: Ranking[] } {
  const creatives: Creative[] = [];
  const rankings: Ranking[] = [];

  // Try to map field results to Creative structure
  const fieldMap = new Map<string, any[]>();
  items.forEach((item) => fieldMap.set(item.field, item.results ?? []));

  const titles = fieldMap.get('title') ?? fieldMap.get('titles') ?? [];
  const thumbs = fieldMap.get('thumbnail') ?? fieldMap.get('image') ?? [];
  const advertisers = fieldMap.get('advertiser') ?? fieldMap.get('brand') ?? [];
  const impressions = fieldMap.get('impressions') ?? fieldMap.get('views') ?? [];
  const videos = fieldMap.get('video') ?? fieldMap.get('videoUrl') ?? [];
  const durations = fieldMap.get('duration') ?? [];

  const maxLen = Math.max(titles.length, thumbs.length, advertisers.length, 1);
  for (let i = 0; i < maxLen; i++) {
    if (!titles[i] && !thumbs[i] && !advertisers[i]) continue;
    creatives.push({
      creative_id: `${platformId}_scraped_${i}`,
      platform: platformId,
      title: titles[i] ?? '-',
      advertiser: advertisers[i] ?? '未知',
      impressions: parseInt(String(impressions[i] ?? '0').replace(/[^0-9]/g, '')) || 0,
      creativeType: videos[i] ? 'video' : 'image',
      thumbnail: thumbs[i] ?? '',
      videoUrl: videos[i] ?? undefined,
      duration: durations[i] ?? undefined,
      scraped_at: new Date().toISOString().slice(0, 10),
    });
  }

  // Try to parse rankings
  const rankData = fieldMap.get('ranking') ?? fieldMap.get('rankings') ?? [];
  if (rankData.length > 0) {
    const entries: RankingEntry[] = rankData.map((r: any, i: number) => ({
      rank: i + 1,
      name: r.name ?? r.title ?? String(r),
      score: r.score ?? r.value ?? 0,
    }));
    rankings.push({
      ranking_type: '综合排行',
      ranking_date: new Date().toISOString().slice(0, 10),
      entries,
    });
  }

  return { creatives, rankings };
}
