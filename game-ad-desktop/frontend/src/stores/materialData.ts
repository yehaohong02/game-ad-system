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

export const useMaterialDataStore = create<MaterialDataState>((set, get) => ({
  data: materialDataJson as MaterialRecord[],
  fileName: null,
  updatedAt: null,
  setData: (data, fileName) => set({
    data,
    fileName: fileName || null,
    updatedAt: new Date().toLocaleString('zh-CN'),
  }),
  getData: () => get().data,
}));
