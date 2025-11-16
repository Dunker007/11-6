/**
 * ByteBotPanel.tsx
 * 
 * PURPOSE:
 * UI component for ByteBot automation integration. Provides interface for connecting
 * to ByteBot instances, executing automation tasks, and monitoring task status.
 * ByteBot is an automation service for executing commands and scripts remotely.
 * 
 * ARCHITECTURE:
 * React component that manages ByteBot operations:
 * - useByteBotStore: ByteBot state and operations
 * - Connection management
 * - Task execution and monitoring
 * - Configuration management
 * 
 * Features:
 * - ByteBot endpoint configuration
 * - Connection management
 * - Task execution
 * - Task status monitoring
 * - Task cancellation
 * 
 * CURRENT STATUS:
 * ✅ Connection management
 * ✅ Task execution
 * ✅ Task monitoring
 * ✅ Task cancellation
 * ✅ Configuration UI
 * 
 * DEPENDENCIES:
 * - useByteBotStore: ByteBot state and operations
 * - bytebotService: Core ByteBot API service
 * 
 * STATE MANAGEMENT:
 * - Local state: endpoint, command, UI state
 * - Uses Zustand store for ByteBot state
 * 
 * PERFORMANCE:
 * - Efficient task status updates
 * - Real-time task monitoring
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import ByteBotPanel from '@/components/Automation/ByteBotPanel';
 * 
 * function App() {
 *   return <ByteBotPanel />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/automation/bytebotStore.ts: ByteBot state management
 * - src/services/automation/bytebotService.ts: ByteBot API operations
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Add task history
 * - Add task scheduling
 * - Add task templates
 * - Add output streaming
 */
import { useState, useEffect } from 'react';
import { useByteBotStore } from '../../services/automation/bytebotStore';
import '../../styles/ByteBotPanel.css';

function ByteBotPanel() {
  const { config, tasks, isLoading, connect, executeTask, cancelTask } =
    useByteBotStore();
  const [endpoint, setEndpoint] = useState(config.endpoint);
  const [command, setCommand] = useState('');
  const [showConfig, setShowConfig] = useState(!config.enabled);

  useEffect(() => {
    setEndpoint(config.endpoint);
  }, [config.endpoint]);

  const handleConnect = async () => {
    const success = await connect(endpoint);
    if (success) {
      setShowConfig(false);
    }
  };

  const handleExecute = async () => {
    if (!command.trim()) return;
    const success = await executeTask(command);
    if (success) {
      setCommand('');
    }
  };

  const handleCancel = async (taskId: string) => {
    await cancelTask(taskId);
  };

  if (showConfig || !config.enabled) {
    return (
      <div className="bytebot-panel">
        <div className="config-section">
          <h3>ByteBot Configuration</h3>
          <p>Connect to your ByteBot instance</p>
          <div className="config-form">
            <label>
              Endpoint URL
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:8000"
                className="endpoint-input"
              />
            </label>
            <button
              onClick={handleConnect}
              className="connect-btn"
              disabled={!endpoint.trim() || isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bytebot-panel">
      <div className="panel-header">
        <h3>ByteBot Automation</h3>
        <button onClick={() => setShowConfig(true)} className="settings-btn">
          ⚙️
        </button>
      </div>

      <div className="task-input-section">
        <h4>Execute Task</h4>
        <div className="task-form">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter natural language command..."
            className="command-input"
            rows={3}
          />
          <button
            onClick={handleExecute}
            className="execute-btn"
            disabled={!command.trim() || isLoading}
          >
            {isLoading ? 'Executing...' : '▶️ Execute'}
          </button>
        </div>
      </div>

      <div className="tasks-section">
        <h4>Task History</h4>
        <div className="tasks-list">
          {tasks.length === 0 ? (
            <div className="empty-state">
              No tasks yet. Execute a command to get started.
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={`task-item ${task.status}`}>
                <div className="task-header">
                  <div className="task-command">{task.command}</div>
                  <div className={`task-status-badge ${task.status}`}>
                    {task.status === 'completed' && '✓'}
                    {task.status === 'running' && '⟳'}
                    {task.status === 'failed' && '✗'}
                    {task.status === 'pending' && '○'} {task.status}
                  </div>
                </div>
                {task.result && (
                  <div className="task-result">
                    <strong>Result:</strong>
                    <pre>{task.result}</pre>
                  </div>
                )}
                {task.error && (
                  <div className="task-error">
                    <strong>Error:</strong>
                    <pre>{task.error}</pre>
                  </div>
                )}
                <div className="task-meta">
                  <span>
                    Created: {new Date(task.createdAt).toLocaleString()}
                  </span>
                  {task.completedAt && (
                    <span>
                      Completed: {new Date(task.completedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                {task.status === 'running' && (
                  <button
                    onClick={() => handleCancel(task.id)}
                    className="cancel-task-btn"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ByteBotPanel;
