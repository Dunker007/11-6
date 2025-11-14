import React, { useState, useEffect } from 'react';
import { logger } from '@/services/logging/loggerService';
import type { LogEntry, LogLevel } from '@/types/logger';
import { ChevronDown, Trash2, Info, AlertTriangle, XCircle, Bug } from 'lucide-react';
import '../../styles/DeveloperConsole.css';

const LogLevelIcon = ({ level }: { level: LogLevel }) => {
  switch (level) {
    case 'info':
      return <Info size={16} className="log-icon info" />;
    case 'warn':
      return <AlertTriangle size={16} className="log-icon warn" />;
    case 'error':
      return <XCircle size={16} className="log-icon error" />;
    case 'debug':
      return <Bug size={16} className="log-icon debug" />;
    default:
      return null;
  }
};

const DeveloperConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLog) => {
      setLogs((prevLogs) => [...prevLogs, newLog]);
    });
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter(
    (log) => filter === 'all' || log.level === filter
  );

  const toggleExpand = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  return (
    <div className="developer-console">
      <header className="console-header">
        <h3>Developer Console</h3>
        <div className="console-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
            <Trash2 size={16} />
            Clear
          </Button>
        </div>
      </header>
      <div className="console-body">
        {filteredLogs.map((log) => (
          <div key={log.id} className={`log-entry ${log.level}`}>
            <div className="log-header" onClick={() => toggleExpand(log.id)}>
              <LogLevelIcon level={log.level} />
              <span className="log-message">{log.message}</span>
              <span className="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              {log.context && <ChevronDown size={16} className={`chevron ${expandedLog === log.id ? 'expanded' : ''}`} />}
            </div>
            {expandedLog === log.id && log.context && (
              <pre className="log-context">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="empty-log">No logs to display for this filter.</div>
        )}
      </div>
    </div>
  );
};

// Simple Button for the console - to avoid circular deps if Button has logging
const Button: React.FC<any> = ({ children, ...props }) => <button {...props}>{children}</button>;


export default DeveloperConsole;
