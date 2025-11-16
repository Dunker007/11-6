import { create } from 'zustand';

type SplitDirection = 'vertical' | 'horizontal';

interface SettingsState {
  enableHotkeys: boolean;
  formatOnApply: boolean;
  defaultSplit: SplitDirection;
  setEnableHotkeys: (v: boolean) => void;
  setFormatOnApply: (v: boolean) => void;
  setDefaultSplit: (v: SplitDirection) => void;
}

const KEY = 'vibed-settings';

function load(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function save(state: SettingsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      enableHotkeys: state.enableHotkeys,
      formatOnApply: state.formatOnApply,
      defaultSplit: state.defaultSplit,
    }));
  } catch {
    // ignore
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = load();
  const initialState: SettingsState = {
    enableHotkeys: initial.enableHotkeys ?? true,
    formatOnApply: initial.formatOnApply ?? true,
    defaultSplit: initial.defaultSplit ?? 'vertical',
    setEnableHotkeys: (v) => set((s) => { const ns = { ...s, enableHotkeys: v }; save(ns); return ns; }),
    setFormatOnApply: (v) => set((s) => { const ns = { ...s, formatOnApply: v }; save(ns); return ns; }),
    setDefaultSplit: (v) => set((s) => { const ns = { ...s, defaultSplit: v }; save(ns); return ns; }),
  };
  return initialState;
});


