import { create } from 'zustand';
import { useMaterialDataStore, MaterialRecord } from '../materialData';

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
  avgPlay100Rate: number;
  materials: MaterialRecord[];
  efficiencyScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  anomalyCount: number;
}

function computeDesignerStats(name: string, materials: MaterialRecord[]): DesignerStats {
  const materialCount = materials.length;
  const totalSpend = materials.reduce((sum, m) => sum + (m.spend || 0), 0);
  const totalImpressions = materials.reduce((sum, m) => sum + (m.impressions || 0), 0);
  const totalClicks = materials.reduce((sum, m) => sum + (m.clicks || 0), 0);
  const totalPlayCount = materials.reduce((sum, m) => sum + (m.playCount || 0), 0);

  const avgCtr = materialCount > 0 ? materials.reduce((sum, m) => sum + (m.ctr || 0), 0) / materialCount : 0;
  const avgCpm = materialCount > 0 ? materials.reduce((sum, m) => sum + (m.cpm || 0), 0) / materialCount : 0;
  const avgCpc = materialCount > 0 ? materials.reduce((sum, m) => sum + (m.cpc || 0), 0) / materialCount : 0;

  const avgPlay2sRate = materialCount > 0
    ? materials.reduce((sum, m) => sum + (m.playCount > 0 ? m.play2s / m.playCount : 0), 0) / materialCount
    : 0;
  const avgPlay6sRate = materialCount > 0
    ? materials.reduce((sum, m) => sum + (m.playCount > 0 ? m.play6s / m.playCount : 0), 0) / materialCount
    : 0;
  const avgPlay100Rate = materialCount > 0
    ? materials.reduce((sum, m) => sum + (m.playCount > 0 ? m.play100 / m.playCount : 0), 0) / materialCount
    : 0;

  // Efficiency score: 3 components (0-100)
  // CTR score (weight 40): closeness to 0.015 target
  const ctrTarget = 0.015;
  const ctrScore = (1 - Math.min(Math.abs(avgCtr - ctrTarget) / ctrTarget, 1)) * 40;
  // Completion score (weight 30): play100/playCount closeness to 0.05 target
  const completionTarget = 0.05;
  const completionScore = (1 - Math.min(Math.abs(avgPlay100Rate - completionTarget) / completionTarget, 1)) * 30;
  // Cost efficiency score (weight 30): lower CPM is better, target CPM = $8
  const cpmTarget = 8;
  const costScore = (1 - Math.min(Math.abs(avgCpm - cpmTarget) / cpmTarget, 1)) * 30;
  const efficiencyScore = Math.round(ctrScore + completionScore + costScore);

  // Risk level based on anomaly indicators
  let anomalyCount = 0;
  for (const m of materials) {
    if (m.ctr > 10 || m.ctr < 0.01) anomalyCount++;
    if (m.cpc > 50 || (m.cpc < 0.001 && m.clicks > 0)) anomalyCount++;
    if (m.spend > 0 && m.impressions < 10) anomalyCount++;
  }

  const riskLevel: 'low' | 'medium' | 'high' =
    anomalyCount >= materialCount * 0.3 ? 'high' :
    anomalyCount >= materialCount * 0.1 ? 'medium' :
    'low';

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
    avgPlay100Rate,
    materials,
    efficiencyScore,
    riskLevel,
    anomalyCount,
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

interface ManagerDataState {
  designers: DesignerStats[];
  loading: boolean;
  selectedDesigner: string | null;
  setSelectedDesigner: (name: string | null) => void;
  refresh: () => void;
}

export const useManagerDataStore = create<ManagerDataState>((set) => ({
  designers: [],
  loading: false,
  selectedDesigner: null,
  setSelectedDesigner: (name) => set({ selectedDesigner: name }),
  refresh: () => {
    const data = useMaterialDataStore.getState().data;
    set({ loading: true });
    const designers = deriveDesigners(data);
    set({ designers, loading: false });
  },
}));

// Subscribe to materialData store changes to auto-refresh
useMaterialDataStore.subscribe((state) => {
  const designers = deriveDesigners(state.data);
  useManagerDataStore.setState({ designers, loading: false });
});
