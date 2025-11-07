import { useState, useEffect, useRef } from 'react';
import { programService } from '../../services/program/programService';
import { useProjectStore } from '../../services/project/projectStore';
import type { ProgramExecution } from '@/types/program';
import '../../styles/ProgramRunner.css';

function ProgramRunner() {
  const { activeProject } = useProjectStore();
  const [command, setCommand] = useState('');
  const [executions, setExecutions] = useState<ProgramExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = programService.subscribe((execs) => {
      setExecutions(execs);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [executions]);

  const handleExecute = async () => {
    if (!command.trim()) return;

    try {
      const workingDirectory = activeProject?.rootPath;
      const execution = await programService.execute(command.trim(), workingDirectory);
      
      if (execution) {
        setSelectedExecution(execution.id);
        setHistory((prev) => {
          const newHistory = [...prev];
          if (newHistory[newHistory.length - 1] !== command.trim()) {
            newHistory.push(command.trim());
          }
          return newHistory.slice(-50); // Keep last 50 commands
        });
        setHistoryIndex(-1);
        setCommand('');
      }
    } catch (error) {
      console.error('Execution error:', error);
    }
  };

  const handleKill = async (executionId: string) => {
    await programService.kill(executionId);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(history[newIndex]);
        }
      }
    }
  };

  const selectedExec = selectedExecution 
    ? executions.find((e) => e.id === selectedExecution)
    : executions[executions.length - 1];

  const activeExecutions = executions.filter((e) => e.status === 'running');

  return (
    <div className="program-runner">
      <div className="runner-header">
        <h2>Program Runner</h2>
        <p>Execute commands and run programs</p>
      </div>

      <div className="runner-content">
        <div className="command-input-section">
          <div className="command-input-wrapper">
            <input
              type="text"
              className="command-input"
              placeholder="Enter command... (e.g., npm install, python script.py)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button 
              className="execute-btn"
              onClick={handleExecute}
              disabled={!command.trim()}
            >
              Run
            </button>
          </div>
          {activeProject && (
            <div className="working-directory">
              <span>Working directory: {activeProject.rootPath || 'N/A'}</span>
            </div>
          )}
        </div>

        <div className="executions-panel">
          <div className="executions-sidebar">
            <div className="sidebar-header">
              <h3>Executions</h3>
              {activeExecutions.length > 0 && (
                <span className="active-badge">{activeExecutions.length} running</span>
              )}
            </div>
            <div className="executions-list">
              {executions.length === 0 ? (
                <div className="empty-state">No executions yet</div>
              ) : (
                executions.slice().reverse().map((exec) => (
                  <div
                    key={exec.id}
                    className={`execution-item ${selectedExecution === exec.id ? 'selected' : ''} ${exec.status}`}
                    onClick={() => setSelectedExecution(exec.id)}
                  >
                    <div className="execution-header">
                      <span className="execution-command">{exec.command}</span>
                      {exec.status === 'running' && (
                        <button
                          className="kill-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKill(exec.id);
                          }}
                        >
                          Kill
                        </button>
                      )}
                    </div>
                    <div className="execution-meta">
                      <span className={`status-badge ${exec.status}`}>{exec.status}</span>
                      <span className="execution-time">
                        {exec.startTime.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="output-panel">
            {selectedExec ? (
              <>
                <div className="output-header">
                  <div>
                    <span className="output-command">{selectedExec.command}</span>
                    <span className={`output-status ${selectedExec.status}`}>
                      {selectedExec.status}
                    </span>
                    {selectedExec.exitCode !== undefined && (
                      <span className="exit-code">Exit: {selectedExec.exitCode}</span>
                    )}
                  </div>
                </div>
                <div className="output-content">
                  {selectedExec.output.length === 0 ? (
                    <div className="no-output">No output yet...</div>
                  ) : (
                    selectedExec.output.map((line, index) => (
                      <div key={index} className="output-line">
                        {line}
                      </div>
                    ))
                  )}
                  {selectedExec.error && (
                    <div className="error-output">{selectedExec.error}</div>
                  )}
                  {selectedExec.status === 'running' && (
                    <div className="running-indicator">Running...</div>
                  )}
                  <div ref={outputEndRef} />
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>Select an execution to view output</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgramRunner;

