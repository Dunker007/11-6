export interface ProgramExecution {
  id: string;
  command: string;
  workingDirectory?: string;
  status: 'running' | 'completed' | 'failed' | 'killed';
  startTime: Date;
  endTime?: Date;
  output: string[];
  error?: string;
  exitCode?: number;
}

export interface ProgramRunnerState {
  executions: ProgramExecution[];
  activeExecutions: Set<string>;
  currentDirectory: string;
  history: string[];
  historyIndex: number;
}

