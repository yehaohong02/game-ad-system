import { create } from 'zustand';

type ViewMode = 'designer' | 'manager';

interface ManagerModeState {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
}

export const useManagerModeStore = create<ManagerModeState>((set, get) => ({
  mode: 'designer',
  setMode: (mode) => set({ mode }),
  toggleMode: () => set({ mode: get().mode === 'designer' ? 'manager' : 'designer' }),
}));
