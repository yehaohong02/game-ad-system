import { create } from 'zustand';
import type { MaterialRecord } from '../materialData';
import managerMaterialDataJson from '../../data/managerMaterialData.json';

export interface DesignerStats {
  name: string;
  materialCount: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgCpm: number;
  avgCpc: number;
  totalPlayCount: number;
  avgPlay2sRate: number;
  avgPlay6sRate: number;
  avgPlay25Rate: number;
  avgPlay50Rate: number;
  avgPlay75Rate: number;
  avgPlay100Rate: number;
  materials: MaterialRecord[];
  efficiencyScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  anomalyCount: number;
  // Designer grade: S / A / B / C
  grade: 'S' | 'A' | 'B' | 'C';
  // Primary media (highest spend)
  primaryMedia: string;
  // Material type classification
  materialType: '图片' | '视频' | '混合';
  imageCount: number;
  videoCount: number;
  // Representative materials (best CPC with spend>0)
  repMaterials: { materialId: string; media: string; cpc: number; ctr: number; spend: number }[];
  // Per-game breakdown
  gameBreakdown: { game: string; count: number; spend: number; avgCtr: number; avgCpm: number }[];
  // Per-media breakdown
  mediaBreakdown: { media: string; count: number; spend: number; avgCtr: number; avgCpm: number }[];
  // Top 5 best performing materials (by CTR)
  topMaterials: { materialId: string; spend: number; ctr: number; impressions: number; category: string }[];
  // Bottom 5 worst performing materials (by CTR, with spend > 0)
  bottomMaterials: { materialId: string; spend: number; ctr: number; impressions: number; category: string }[];
  // Spend distribution metrics
  spendWithPlay: number; // materials with playCount > 0
  avgPlayCount: number;
  totalPlay100: number;
  // CTR distribution
  highCtrCount: number; // ctr > 0.015
  lowCtrCount: number;  // ctr < 0.003
  highCpmCount: number; // cpm > 8
}

export interface TeamOverview {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  overallCpc: number;
  overallCtr: number;
  totalMaterials: number;
  designerCount: number;
}

function computeDesignerStats(name: string, materials: MaterialRecord[]): DesignerStats {
  const materialCount = materials.length;
  const totalSpend = materials.reduce((sum, m) => sum + (m.spend || 0), 0);
  const totalImpressions = materials.reduce((sum, m) => sum + (m.impressions || 0), 0);
  const totalClicks = materials.reduce((sum, m) => sum + (m.clicks || 0), 0);
  const totalPlayCount = materials.reduce((sum, m) => sum + (m.playCount || 0), 0);

  // CTR: only average materials with actual CTR data (> 0)
  const ctrMaterials = materials.filter(m => (m.ctr || 0) > 0);
  const avgCtr = ctrMaterials.length > 0 ? ctrMaterials.reduce((sum, m) => sum + (m.ctr || 0), 0) / ctrMaterials.length : 0;
  // CPM: only average materials with actual CPM data (> 0)
  const cpmMaterials = materials.filter(m => (m.cpm || 0) > 0);
  const avgCpm = cpmMaterials.length > 0 ? cpmMaterials.reduce((sum, m) => sum + (m.cpm || 0), 0) / cpmMaterials.length : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 999;

  // Play rates: only average materials with actual play data
  const playMaterials = materials.filter(m => (m.playCount || 0) > 0);
  const avgPlayRate = (field: keyof MaterialRecord) =>
    playMaterials.length > 0
      ? playMaterials.reduce((sum, m) => sum + ((m[field] as number) / m.playCount), 0) / playMaterials.length
      : 0;
  const avgPlay2sRate = avgPlayRate('play2s');
  const avgPlay6sRate = avgPlayRate('play6s');
  const avgPlay25Rate = avgPlayRate('play25');
  const avgPlay50Rate = avgPlayRate('play50');
  const avgPlay75Rate = avgPlayRate('play75');
  const avgPlay100Rate = avgPlayRate('play100');

  // Efficiency score: 3 components (0-100)
  // 效率 = CTR%×20 + 完播率%×15 + (30−CPM)，各项有上下限
  const ctrScore = Math.min(avgCtr * 2000, 40);
  const completionScore = Math.min(avgPlay100Rate * 1500, 30);
  const cpmScore = Math.max(0, Math.min(30 - avgCpm, 30));
  const efficiencyScore = Math.round(ctrScore + completionScore + cpmScore);

  // Risk level: only flag materials with measurable engagement
  let anomalyCount = 0;
  for (const m of materials) {
    // CTR anomaly: only when material has actual clicks (measurable CTR)
    if (m.ctr > 10) anomalyCount++;
    if (m.clicks > 0 && m.ctr < 0.003) anomalyCount++;
    // CPC anomaly
    if (m.clicks > 0 && m.cpc > 50) anomalyCount++;
    // Spend with almost no impressions
    if (m.spend > 0 && m.impressions < 10) anomalyCount++;
  }

  const riskLevel: 'low' | 'medium' | 'high' =
    anomalyCount >= materialCount * 0.2 ? 'high' :
    anomalyCount >= materialCount * 0.05 ? 'medium' :
    'low';

  // totalClicks already computed above
  const totalPlay100 = materials.reduce((sum, m) => sum + (m.play100 || 0), 0);

  // Per-game breakdown
  const gameMap = new Map<string, { count: number; spend: number; ctrSum: number; cpmSum: number }>();
  for (const m of materials) {
    const game = (m as any).game || (m as any).category || 'Unknown';
    const entry = gameMap.get(game) || { count: 0, spend: 0, ctrSum: 0, cpmSum: 0 };
    entry.count++;
    entry.spend += m.spend || 0;
    entry.ctrSum += m.ctr || 0;
    entry.cpmSum += m.cpm || 0;
    gameMap.set(game, entry);
  }
  const gameBreakdown = Array.from(gameMap.entries()).map(([game, v]) => ({
    game,
    count: v.count,
    spend: v.spend,
    avgCtr: v.count > 0 ? v.ctrSum / v.count : 0,
    avgCpm: v.count > 0 ? v.cpmSum / v.count : 0,
  })).sort((a, b) => b.spend - a.spend);

  // Per-media breakdown
  const mediaMap = new Map<string, { count: number; spend: number; ctrSum: number; cpmSum: number }>();
  for (const m of materials) {
    const media = (m as any).media || 'Unknown';
    const entry = mediaMap.get(media) || { count: 0, spend: 0, ctrSum: 0, cpmSum: 0 };
    entry.count++;
    entry.spend += m.spend || 0;
    entry.ctrSum += m.ctr || 0;
    entry.cpmSum += m.cpm || 0;
    mediaMap.set(media, entry);
  }
  const mediaBreakdown = Array.from(mediaMap.entries()).map(([media, v]) => ({
    media,
    count: v.count,
    spend: v.spend,
    avgCtr: v.count > 0 ? v.ctrSum / v.count : 0,
    avgCpm: v.count > 0 ? v.cpmSum / v.count : 0,
  })).sort((a, b) => b.spend - a.spend);

  // Top 5 best performing materials (by CTR, with impressions > 0)
  const validMaterials = materials.filter(m => m.impressions > 0);
  const topMaterials = [...validMaterials]
    .sort((a, b) => (b.ctr || 0) - (a.ctr || 0))
    .slice(0, 5)
    .map(m => ({
      materialId: m.materialId,
      spend: m.spend || 0,
      ctr: m.ctr || 0,
      impressions: m.impressions || 0,
      category: (m as any).category || '',
    }));

  // Bottom 5 worst performing materials (by CTR, with spend > 0)
  const spendMaterials = materials.filter(m => m.spend > 0);
  const bottomMaterials = [...spendMaterials]
    .sort((a, b) => (a.ctr || 0) - (b.ctr || 0))
    .slice(0, 5)
    .map(m => ({
      materialId: m.materialId,
      spend: m.spend || 0,
      ctr: m.ctr || 0,
      impressions: m.impressions || 0,
      category: (m as any).category || '',
    }));

  // Spend distribution metrics
  const spendWithPlay = materials.filter(m => (m.playCount || 0) > 0).reduce((sum, m) => sum + (m.spend || 0), 0);
  const avgPlayCount = materialCount > 0 ? totalPlayCount / materialCount : 0;

  // CTR distribution
  const highCtrCount = materials.filter(m => (m.ctr || 0) > 0.015).length;
  const lowCtrCount = materials.filter(m => (m.ctr || 0) < 0.003).length;
  const highCpmCount = materials.filter(m => (m.cpm || 0) > 8).length;

  // Material type classification
  const imageCount = materials.filter(m => {
    const preview = (m as any).preview || '';
    return typeof preview === 'string' && (preview.endsWith('.jpg') || preview.endsWith('.png') || preview.endsWith('.jpeg') || preview.endsWith('.webp'));
  }).length;
  const videoCount = materials.filter(m => {
    const preview = (m as any).preview || '';
    if (typeof preview === 'string' && preview.endsWith('.mp4')) return true;
    const url = typeof preview === 'object' && preview?.url ? preview.url : '';
    return typeof url === 'string' && url.endsWith('.mp4');
  }).length;
  const materialType: '图片' | '视频' | '混合' =
    imageCount > 0 && videoCount === 0 ? '图片' :
    videoCount > 0 && imageCount === 0 ? '视频' : '混合';

  // Primary media (highest spend)
  const primaryMedia = mediaBreakdown.length > 0 ? mediaBreakdown[0].media : '未知';

  // Representative materials (top 3 by lowest CPC, with spend>0 and clicks>0)
  const repMaterials = [...materials]
    .filter(m => (m.spend || 0) > 0 && (m.clicks || 0) > 0)
    .sort((a, b) => (a.cpc || 0) - (b.cpc || 0))
    .slice(0, 3)
    .map(m => ({
      materialId: m.materialId,
      media: (m as any).media || '',
      cpc: m.cpc || 0,
      ctr: m.ctr || 0,
      spend: m.spend || 0,
    }));

  // Designer grade: based on CPC thresholds
  const grade: 'S' | 'A' | 'B' | 'C' =
    avgCpc < 0.30 ? 'S' :
    avgCpc < 0.70 ? 'A' :
    avgCpc < 1.00 ? 'B' : 'C';

  return {
    name,
    materialCount,
    totalSpend,
    totalImpressions,
    totalClicks,
    avgCtr,
    avgCpm,
    avgCpc,
    totalPlayCount,
    avgPlay2sRate,
    avgPlay6sRate,
    avgPlay25Rate,
    avgPlay50Rate,
    avgPlay75Rate,
    avgPlay100Rate,
    materials,
    efficiencyScore,
    riskLevel,
    anomalyCount,
    grade,
    primaryMedia,
    materialType,
    imageCount,
    videoCount,
    repMaterials,
    gameBreakdown,
    mediaBreakdown,
    topMaterials,
    bottomMaterials,
    spendWithPlay,
    avgPlayCount,
    totalPlay100,
    highCtrCount,
    lowCtrCount,
    highCpmCount,
  };
}

function deriveDesigners(data: MaterialRecord[]): DesignerStats[] {
  // Filter out summary rows (materialId falsy or '合计')
  const validData = data.filter(r => r.materialId && r.materialId !== '合计');

  const grouped = new Map<string, MaterialRecord[]>();
  for (const record of validData) {
    const designer = (record.designer as string) || 'Unknown';
    if (!grouped.has(designer)) {
      grouped.set(designer, []);
    }
    grouped.get(designer)!.push(record);
  }

  const designers: DesignerStats[] = [];
  for (const [name, materials] of grouped) {
    designers.push(computeDesignerStats(name, materials));
  }

  // Sort by total spend descending
  designers.sort((a, b) => b.totalSpend - a.totalSpend);
  return designers;
}

export function computeTeamOverview(designers: DesignerStats[]): TeamOverview {
  const totalSpend = designers.reduce((s, d) => s + d.totalSpend, 0);
  const totalImpressions = designers.reduce((s, d) => s + d.totalImpressions, 0);
  const totalClicks = designers.reduce((s, d) => s + d.totalClicks, 0);
  const totalMaterials = designers.reduce((s, d) => s + d.materialCount, 0);
  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    overallCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    overallCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    totalMaterials,
    designerCount: designers.length,
  };
}

interface ManagerDataState {
  designers: DesignerStats[];
  managerMaterialData: MaterialRecord[];
  loading: boolean;
  selectedDesigner: string | null;
  setSelectedDesigner: (name: string | null) => void;
  setManagerMaterialData: (data: MaterialRecord[]) => void;
  refresh: () => void;
}

const MANAGER_STORAGE_KEY = 'managerMaterialDataStore';

function loadManagerFromStorage(): MaterialRecord[] | null {
  try {
    if (localStorage.getItem(MANAGER_STORAGE_KEY + '_cleared') === '1') {
      return null;
    }
    const raw = localStorage.getItem(MANAGER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (!first.designer || !first.media) {
          localStorage.removeItem(MANAGER_STORAGE_KEY);
          return null;
        }
        return parsed;
      }
    }
  } catch {}
  return null;
}

function saveManagerToStorage(data: MaterialRecord[]) {
  try {
    localStorage.setItem(MANAGER_STORAGE_KEY, JSON.stringify(data));
    localStorage.removeItem(MANAGER_STORAGE_KEY + '_cleared');
  } catch {}
}

const managerInitData = loadManagerFromStorage() || (managerMaterialDataJson as unknown as MaterialRecord[]);

export const useManagerDataStore = create<ManagerDataState>((set) => ({
  designers: deriveDesigners(managerInitData),
  managerMaterialData: managerInitData,
  loading: false,
  selectedDesigner: null,
  setSelectedDesigner: (name) => set({ selectedDesigner: name }),
  setManagerMaterialData: (data) => {
    saveManagerToStorage(data);
    set({ managerMaterialData: data, designers: deriveDesigners(data) });
  },
  refresh: () => {
    set({ loading: true });
    const ownData = useManagerDataStore.getState().managerMaterialData;
    if (ownData.length > 0) {
      set({ designers: deriveDesigners(ownData), loading: false });
    } else if (localStorage.getItem(MANAGER_STORAGE_KEY + '_cleared') === '1') {
      set({ loading: false });
    } else {
      const fallback = managerMaterialDataJson as unknown as MaterialRecord[];
      saveManagerToStorage(fallback);
      set({ designers: deriveDesigners(fallback), managerMaterialData: fallback, loading: false });
    }
  },
}));
