import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'http://localhost:8002/api/experiment';

export interface FeatureImportanceItem {
  feature: string;
  spearman_rho: number;
  pvalue: number;
  is_significant: boolean;
}

export interface FormulaBacktestItem {
  formula_id: string;
  formula_name: string;
  matched_count: number;
  matched_avg_roas: number;
  unmatched_avg_roas: number;
  lift: number;
  ttest_pvalue: number;
  is_significant: boolean;
}

export interface PredictabilityData {
  spearman_rho: number;
  spearman_pvalue: number;
  ndcg_at_5: number;
  ndcg_at_10: number;
  recommendation: string;
  details: string;
}

export interface CategorySummary {
  count: number;
  features: string[];
}

export interface ExperimentResult {
  sample_count: number;
  feature_count: number;
  feature_names: string[];
  category_summary: Record<string, CategorySummary>;
  feature_importance: FeatureImportanceItem[];
  model_coefficients: Record<string, number>;
  formula_backtest: {
    total_formulas: number;
    effective_formulas: number;
    results: FormulaBacktestItem[];
  };
  predictability: PredictabilityData;
}

interface ExperimentState {
  loading: boolean;
  result: ExperimentResult | null;
  recommendation: string | null;
  error: string | null;
  fileName: string | null;
  dataSource: 'default' | 'upload';
  runExperiment: () => Promise<void>;
  uploadExcel: (file: File) => Promise<void>;
  reset: () => void;
}

export const useExperimentStore = create<ExperimentState>((set) => ({
  loading: false,
  result: null,
  recommendation: null,
  error: null,
  fileName: null,
  dataSource: 'default',

  runExperiment: async () => {
    set({ loading: true, error: null, dataSource: 'default', fileName: null });
    try {
      const resp = await axios.post(`${API_BASE}/phase0?account_id=default`);
      const data = resp.data;
      if (data.status === 'completed') {
        set({
          loading: false,
          result: data.data,
          recommendation: data.recommendation,
        });
      } else {
        set({
          loading: false,
          error: data.message || '实验未完成',
          recommendation: data.recommendation || 'no-go',
        });
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.detail || err.message || '请求失败',
      });
    }
  },

  uploadExcel: async (file: File) => {
    set({ loading: true, error: null, dataSource: 'upload', fileName: file.name });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await axios.post(`${API_BASE}/phase0/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = resp.data;
      if (data.status === 'completed') {
        set({
          loading: false,
          result: data.data,
          recommendation: data.recommendation,
        });
      } else {
        set({
          loading: false,
          error: data.message || '实验未完成',
          recommendation: data.recommendation || 'no-go',
        });
      }
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.detail || err.message || '上传失败',
      });
    }
  },

  reset: () => set({ loading: false, result: null, recommendation: null, error: null, fileName: null, dataSource: 'default' }),
}));