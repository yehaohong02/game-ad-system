import { create } from 'zustand';
import materialDataJson from '../data/materialData.json';

export interface MaterialRecord {
  key: string;
  materialId: string;
  category: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  playCount: number;
  play2s: number;
  play6s: number;
  play25: number;
  play50: number;
  play75: number;
  play100: number;
  preview?: string;
  country?: string;
  platform?: string;
  status?: string;
  installs?: number;
  cpi?: number;
  roas?: number;
  isSummary?: boolean;
  [key: string]: any;
}

interface MaterialDataState {
  data: MaterialRecord[];
  fileName: string | null;
  updatedAt: string | null;
  setData: (data: MaterialRecord[], fileName?: string) => void;
  getData: () => MaterialRecord[];
}

const STORAGE_KEY = 'materialDataStore';

function loadFromStorage(): MaterialRecord[] | null {
  try {
    if (localStorage.getItem(STORAGE_KEY + '_cleared') === '1') {
      return null;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (first.designer && first.media) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return parsed;
      }
    }
  } catch {}
  return null;
}

function saveToStorage(data: MaterialRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.removeItem(STORAGE_KEY + '_cleared');
  } catch {}
}

const initialData = loadFromStorage() || (materialDataJson as MaterialRecord[]);

export const useMaterialDataStore = create<MaterialDataState>((set, get) => ({
  data: initialData,
  fileName: null,
  updatedAt: null,
  setData: (data, fileName) => {
    saveToStorage(data);
    set({
      data,
      fileName: fileName || null,
      updatedAt: new Date().toLocaleString('zh-CN'),
    });
  },
  getData: () => get().data,
}));
