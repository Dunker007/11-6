import { create } from 'zustand';
import { MissionRun, MissionLogEntry, MissionStatus, MissionStepRun } from './missionTypes';

interface MissionStore {
  missions: Record<string, MissionRun>;
  missionOrder: string[];
  addMission: (mission: MissionRun) => void;
  updateMissionStatus: (missionId: string, status: MissionStatus) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  updateStep: (missionId: string, step: MissionStepRun) => void;
  appendLog: (missionId: string, log: MissionLogEntry) => void;
}

export const useMissionStore = create<MissionStore>((set) => ({
  missions: {},
  missionOrder: [],
  addMission: (mission) =>
    set((state) => ({
      missions: { ...state.missions, [mission.id]: mission },
      missionOrder: [mission.id, ...state.missionOrder],
    })),
  updateMissionStatus: (missionId, status) =>
    set((state) => {
      const mission = state.missions[missionId];
      if (!mission) return state;
      return {
        missions: {
          ...state.missions,
          [missionId]: {
            ...mission,
            status,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  updateMissionProgress: (missionId, progress) =>
    set((state) => {
      const mission = state.missions[missionId];
      if (!mission) return state;
      return {
        missions: {
          ...state.missions,
          [missionId]: {
            ...mission,
            progress,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  updateStep: (missionId, step) =>
    set((state) => {
      const mission = state.missions[missionId];
      if (!mission) return state;
      const phases = mission.phases.map((phase) => {
        if (!phase.steps.some((existing) => existing.id === step.id)) {
          return phase;
        }
        return {
          ...phase,
          steps: phase.steps.map((existing) =>
            existing.id === step.id ? { ...existing, ...step, status: step.status } : existing
          ),
        };
      });
      return {
        missions: {
          ...state.missions,
          [missionId]: {
            ...mission,
            phases,
            updatedAt: Date.now(),
          },
        },
      };
    }),
  appendLog: (missionId, log) =>
    set((state) => {
      const mission = state.missions[missionId];
      if (!mission) return state;
      return {
        missions: {
          ...state.missions,
          [missionId]: {
            ...mission,
            logs: [log, ...mission.logs],
            updatedAt: Date.now(),
          },
        },
      };
    }),
}));
