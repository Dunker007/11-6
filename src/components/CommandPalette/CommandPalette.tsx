import { useState, useEffect, useRef, useMemo } from 'react';
import { commandService } from '../../services/command/commandService';
import type { Command } from '@/types/command';
import '../../styles/CommandPalette.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandExecute?: () => void;
}

function CommandPalette({ isOpen, onClose, onCommandExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    return commandService.search(query);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  const executeCommand = async (command: Command) => {
    try {
      await command.action();
      onCommandExecute?.();
      onClose();
    } catch (error) {
      console.error('Command execution error:', error);
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      navigation: 'Navigation',
      file: 'File',
      ai: 'AI',
      settings: 'Settings',
      quicklabs: 'Quick Labs',
      workflow: 'Workflow',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="command-palette-results">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="command-group">
                <div className="command-group-header">{getCategoryLabel(category)}</div>
                {commands.map((command) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <div
                      key={command.id}
                      className={`command-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => executeCommand(command)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="command-item-content">
                        {command.icon && <span className="command-icon">{command.icon}</span>}
                        <div className="command-info">
                          <div className="command-label">{command.label}</div>
                          {command.description && (
                            <div className="command-description">{command.description}</div>
                          )}
                        </div>
                        {command.shortcut && (
                          <div className="command-shortcut">{command.shortcut}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-hints">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;

