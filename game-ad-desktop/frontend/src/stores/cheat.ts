import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'http://localhost:8002/api/cheat';

// ─── 类型定义 ───

export interface DimensionMeta {
  key: string;
  name: string;
  desc: string;
  weight: number;
}

export interface ScoreResult {
  scores: Record<string, number>;
  composite: number;
  bucket: string;
  bucket_label: string;
  rubric_version: number;
  formula: string;
  dimensions: Record<string, { name: string; desc: string; weight: number; score: number }>;
}

export interface Prediction {
  id: string;
  material_id: string;
  created_at: string;
  status: string;
  header: any;
  input_snapshot: any;
  prediction: {
    bucket: string;
    probability_distribution: Record<string, number>;
    center_estimate_w: number;
    one_line_reason: string;
  };
  score_result: ScoreResult;
  reasoning_factors: any[];
  anchor_comparison: any[];
  counterfactual_scenarios: string[];
  critical_hypothesis: string;
  retro: any;
  publish_info?: any;
}

export interface CheatStatus {
  state: {
    schema_version: string;
    content_form: string;
    platform: string;
    rubric_version: number;
    calibration_samples: number;
    confidence: string;
  };
  buffer: { count: number; days: number; color: string };
  predictions: { total: number; predicted: number; published: number; retro_done: number };
  retro: { total: number; avg_error: number; direction_accuracy: number };
  pending_retros: any[];
  candidates: number;
  bump_trigger: { should_bump: boolean; reason: string };
}

export interface BiasAnalysis {
  status: string;
  sample_count: number;
  avg_signed_error: number;
  std_error: number;
  bias_direction: string;
  distribution: { under: number; over: number; accurate: number };
  dimension_correlation: Record<string, number>;
  recommendation: string;
}

export interface BumpProposal {
  status: string;
  current_formula: string;
  proposed_formula: string;
  weight_changes: Record<string, { old: number; new: number }>;
  rank_consistency: number;
  passes_threshold: boolean;
}

// ─── Store ───

interface CheatState {
  loading: boolean;
  error: string | null;
  status: CheatStatus | null;
  dimensions: DimensionMeta[];
  predictions: Prediction[];
  currentScore: ScoreResult | null;
  biasAnalysis: BiasAnalysis | null;
  bumpProposal: BumpProposal | null;
  scoreCurve: any;

  fetchStatus: () => Promise<void>;
  initProject: (form?: string, platform?: string, cadence?: number) => Promise<void>;
  fetchDimensions: () => Promise<void>;
  scoreContent: (materialId: string, scriptText: string, scores: Record<string, number>) => Promise<ScoreResult>;
  createPrediction: (data: any) => Promise<void>;
  fetchPredictions: () => Promise<void>;
  markPublished: (predId: string, url?: string, platform?: string) => Promise<void>;
  doRetro: (data: any) => Promise<void>;
  analyzeBias: () => Promise<void>;
  triggerBump: (auto?: boolean) => Promise<void>;
  fetchScoreCurve: () => Promise<void>;
  reset: () => void;
}

export const useCheatStore = create<CheatState>((set, get) => ({
  loading: false,
  error: null,
  status: null,
  dimensions: [],
  predictions: [],
  currentScore: null,
  biasAnalysis: null,
  bumpProposal: null,
  scoreCurve: null,

  fetchStatus: async () => {
    try {
      const resp = await axios.get(`${API_BASE}/status`);
      set({ status: resp.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  initProject: async (form = 'opinion-video', platform = 'douyin', cadence = 3) => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${API_BASE}/init`, { content_form: form, platform, cadence_days: cadence });
      await get().fetchStatus();
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.detail || err.message });
    }
  },

  fetchDimensions: async () => {
    try {
      const resp = await axios.get(`${API_BASE}/dimensions`);
      set({ dimensions: resp.data.dimensions });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  scoreContent: async (materialId, scriptText, scores) => {
    set({ loading: true, error: null });
    try {
      const resp = await axios.post(`${API_BASE}/score`, { material_id: materialId, script_text: scriptText, scores });
      const result = resp.data.result;
      set({ currentScore: result, loading: false });
      return result;
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.detail || err.message });
      throw err;
    }
  },

  createPrediction: async (data) => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${API_BASE}/predict`, data);
      await get().fetchPredictions();
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.detail || err.message });
    }
  },

  fetchPredictions: async () => {
    try {
      const resp = await axios.get(`${API_BASE}/predictions`);
      set({ predictions: resp.data.predictions });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  markPublished: async (predId, url = '', platform = '') => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${API_BASE}/publish`, { pred_id: predId, url, platform });
      await get().fetchPredictions();
      await get().fetchStatus();
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.detail || err.message });
    }
  },

  doRetro: async (data) => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${API_BASE}/retro`, data);
      await get().fetchPredictions();
      await get().fetchStatus();
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.detail || err.message });
    }
  },

  analyzeBias: async () => {
    set({ loading: true, error: null });
    try {
      const resp = await axios.get(`${API_BASE}/bias`);
      set({ biasAnalysis: resp.data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.detail || err.message });
    }
  },

  triggerBump: async (auto = true) => {
    set({ loading: true, error: null });
    try {
      const resp = await axios.post(`${API_BASE}/bump`, { auto });
      set({ bumpProposal: resp.data.proposal, loading: false });
      await get().fetchStatus();
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.detail || err.message });
    }
  },

  fetchScoreCurve: async () => {
    try {
      const resp = await axios.get(`${API_BASE}/score-curve`);
      set({ scoreCurve: resp.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  reset: () => set({
    loading: false, error: null, status: null, dimensions: [],
    predictions: [], currentScore: null, biasAnalysis: null, bumpProposal: null, scoreCurve: null,
  }),
}));