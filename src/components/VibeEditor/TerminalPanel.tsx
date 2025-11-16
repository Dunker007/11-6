/**
 * TerminalPanel.tsx
 * 
 * Integrated terminal panel component using xterm.js.
 * Supports multiple terminal tabs and command execution.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useTerminalStore } from '@/services/terminal/terminalStore';
import { terminalService, type TerminalOutput } from '@/services/terminal/terminalService';
import { useProjectStore } from '@/services/project/projectStore';
import TechIcon from '../Icons/TechIcon';
import { Terminal as TerminalIcon, X, Plus, Trash2, ChevronDown } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import '@/styles/TerminalPanel.css';

interface TerminalPanelProps {
  isVisible: boolean;
  onToggle?: () => void;
}

function TerminalPanel({ isVisible, onToggle }: TerminalPanelProps) {
  const { sessions, activeSessionId, createSession, deleteSession, setActiveSession, addToHistory } = useTerminalStore();
  const { activeProject } = useProjectStore();
  const activeProjectRoot = activeProject?.rootPath;
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const currentCommandRef = useRef<string>('');
  const executionIdRef = useRef<string>('');

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || !isVisible) return;

    const term = new Terminal({
      theme: {
        background: '#0a0e1a',
        foreground: '#ffffff',
        cursor: '#00d4ff',
        selection: 'rgba(0, 212, 255, 0.3)',
        black: '#000000',
        red: '#ff4444',
        green: '#00ff88',
        yellow: '#ffaa00',
        blue: '#4488ff',
        magenta: '#ff44ff',
        cyan: '#00d4ff',
        white: '#ffffff',
        brightBlack: '#666666',
        brightRed: '#ff6666',
        brightGreen: '#66ffaa',
        brightYellow: '#ffcc66',
        brightBlue: '#6699ff',
        brightMagenta: '#ff66ff',
        brightCyan: '#66ccff',
        brightWhite: '#ffffff',
      },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    // Create default session if none exists
    if (sessions.length === 0) {
      createSession('Terminal 1', activeProjectRoot || undefined);
    }

    // Set up terminal input handler
    term.onData((data) => {
      if (data === '\r') {
        // Enter pressed - execute command
        const command = currentCommandRef.current.trim();
        if (command && activeSessionId) {
          executeCommand(command);
          addToHistory(activeSessionId, command);
          setHistoryIndex(-1);
        }
        currentCommandRef.current = '';
        term.write('\r\n');
      } else if (data === '\x7f') {
        // Backspace
        if (currentCommandRef.current.length > 0) {
          currentCommandRef.current = currentCommandRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\x1b[A') {
        // Arrow up - history
        if (activeSessionId) {
          const history = useTerminalStore.getState().getHistory(activeSessionId);
          if (history.length > 0) {
            const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIndex);
            currentCommandRef.current = history[newIndex];
            term.write('\r\x1b[K' + history[newIndex]);
          }
        }
      } else if (data === '\x1b[B') {
        // Arrow down - history
        if (historyIndex >= 0) {
          const history = activeSessionId ? useTerminalStore.getState().getHistory(activeSessionId) : [];
          const newIndex = historyIndex + 1;
          if (newIndex < history.length) {
            setHistoryIndex(newIndex);
            currentCommandRef.current = history[newIndex];
            term.write('\r\x1b[K' + history[newIndex]);
          } else {
            setHistoryIndex(-1);
            currentCommandRef.current = '';
            term.write('\r\x1b[K');
          }
        }
      } else if (data >= ' ') {
        // Regular character input
        currentCommandRef.current += data;
        term.write(data);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [isVisible, activeSessionId]);

  // Set up output listeners when session changes
  useEffect(() => {
    if (!activeSessionId || !terminalInstanceRef.current) return;

    const term = terminalInstanceRef.current;

    const outputCleanup = terminalService.onOutput(activeSessionId, (output: TerminalOutput) => {
      term.write(output.data);
    });

    const completeCleanup = terminalService.onComplete(activeSessionId, (result) => {
      if (result.exitCode !== undefined) {
        term.write(`\r\n[Process exited with code ${result.exitCode}]\r\n`);
      }
      // Write prompt
      const cwd = activeProjectRoot || '~';
      term.write(`\x1b[32m${cwd}\x1b[0m $ `);
    });

    const errorCleanup = terminalService.onError(activeSessionId, (error) => {
      term.write(`\r\n\x1b[31mError: ${error.error}\x1b[0m\r\n`);
    });

    // Write initial prompt
    const cwd = activeProjectRoot || '~';
    term.write(`\x1b[32m${cwd}\x1b[0m $ `);

    return () => {
      outputCleanup();
      completeCleanup();
      errorCleanup();
    };
  }, [activeSessionId, activeProjectRoot]);

  const executeCommand = useCallback(async (command: string) => {
    if (!activeSessionId || !terminalInstanceRef.current) return;

    const term = terminalInstanceRef.current;
    
    try {
      const result = await terminalService.executeCommand(
        command,
        activeProjectRoot || undefined,
        activeSessionId
      );

      if (result.success && result.executionId) {
        executionIdRef.current = result.executionId;
      } else {
        term.write(`\r\n\x1b[31mError: ${result.error || 'Failed to execute command'}\x1b[0m\r\n`);
        const cwd = activeProjectRoot || '~';
        term.write(`\x1b[32m${cwd}\x1b[0m $ `);
      }
    } catch (error) {
      term.write(`\r\n\x1b[31mError: ${(error as Error).message}\x1b[0m\r\n`);
      const cwd = activeProjectRoot || '~';
      term.write(`\x1b[32m${cwd}\x1b[0m $ `);
    }
  }, [activeSessionId, activeProjectRoot]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim() && activeSessionId) {
      executeCommand(commandInput.trim());
      addToHistory(activeSessionId, commandInput.trim());
      setCommandInput('');
      setHistoryIndex(-1);
    }
  };

  const handleNewSession = () => {
    createSession(`Terminal ${sessions.length + 1}`, activeProjectRoot || undefined);
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
  };

  if (!isVisible) return null;

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <div className="terminal-tabs">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`terminal-tab ${activeSessionId === session.id ? 'active' : ''}`}
              onClick={() => setActiveSession(session.id)}
            >
              <TechIcon icon={TerminalIcon} size={14} glow="none" />
              <span>{session.name}</span>
              {sessions.length > 1 && (
                <button
                  className="tab-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                >
                  <TechIcon icon={X} size={12} glow="none" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="terminal-actions">
          <button
            className="terminal-action-btn"
            onClick={handleNewSession}
            title="New Terminal"
          >
            <TechIcon icon={Plus} size={16} glow="cyan" />
          </button>
          {onToggle && (
            <button
              className="terminal-action-btn"
              onClick={onToggle}
              title="Toggle Terminal"
            >
              <TechIcon icon={ChevronDown} size={16} glow="none" />
            </button>
          )}
        </div>
      </div>
      
      <div className="terminal-content">
        <div ref={terminalRef} className="terminal-container" />
      </div>
    </div>
  );
}

export default TerminalPanel;

