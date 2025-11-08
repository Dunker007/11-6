import { MissionRun, MissionLogEntry, MissionStatus, MissionStepRun } from './missionTypes';

export type MissionEventType =
  | 'mission:created'
  | 'mission:status-changed'
  | 'mission:progress-changed'
  | 'mission:log'
  | 'mission:step-status-changed';

export interface MissionEvent {
  missionId: string;
  type: MissionEventType;
  payload:
    | { mission: MissionRun }
    | { status: MissionStatus }
    | { progress: number }
    | { log: MissionLogEntry }
    | { step: MissionStepRun };
  timestamp: number;
}

type MissionEventListener = (event: MissionEvent) => void;

class MissionEventBus {
  private listeners: Set<MissionEventListener> = new Set();

  subscribe(listener: MissionEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: MissionEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[MissionEventBus] Listener error:', error);
      }
    }
  }
}

export const missionEventBus = new MissionEventBus();
