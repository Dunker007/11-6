import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Command, Settings, Zap, Code, Bitcoin, TrendingUp, Lightbulb, Rocket, Activity } from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import '../../styles/ui/CommandPalette.css';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  category: 'navigation' | 'actions' | 'files' | 'settings' | 'workflows';
  action: () => void;
  shortcut?: string;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

/**
 * Omni-search palette that surfaces navigation and action commands across the app.
 * Provides fuzzy search, keyboard navigation, and grouped results inside a modal.
 *
 * @param props - Visibility controls and navigation callback wiring.
 * @returns Modal-based command interface.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define available commands
  const commands: CommandItem[] = useMemo(() => [
    {
      id: 'nav-llm',
      label: 'Go to LLM Optimizer',
      description: 'Open LLM optimization panel',
      icon: <Zap size={18} />,
      category: 'navigation',
      keywords: ['llm', 'optimizer', 'models'],
      action: () => {
        onNavigate?.('llm');
        onClose();
      },
    },
    {
      id: 'nav-revenue',
      label: 'Go to Revenue Dashboard',
      description: 'View revenue and financial metrics',
      icon: <TrendingUp size={18} />,
      category: 'navigation',
      keywords: ['revenue', 'financial', 'money'],
      action: () => {
        onNavigate?.('revenue');
        onClose();
      },
    },
    {
      id: 'nav-crypto',
      label: 'Go to Crypto Lab',
      description: 'Open cryptocurrency trading interface',
      icon: <Bitcoin size={18} />,
      category: 'navigation',
      keywords: ['crypto', 'trading', 'bitcoin'],
      action: () => {
        onNavigate?.('crypto-lab');
        onClose();
      },
    },
    {
      id: 'nav-wealth',
      label: 'Go to Wealth Lab',
      description: 'Open personal finance management',
      icon: <TrendingUp size={18} />,
      category: 'navigation',
      keywords: ['wealth', 'finance', 'budget'],
      action: () => {
        onNavigate?.('wealth-lab');
        onClose();
      },
    },
    {
      id: 'nav-idea',
      label: 'Go to Idea Lab',
      description: 'Open idea planning workspace',
      icon: <Lightbulb size={18} />,
      category: 'navigation',
      keywords: ['idea', 'planning', 'brainstorm'],
      action: () => {
        onNavigate?.('idea-lab');
        onClose();
      },
    },
    {
      id: 'nav-editor',
      label: 'Go to Vibed Ed',
      description: 'Open code editor',
      icon: <Code size={18} />,
      category: 'navigation',
      keywords: ['editor', 'code', 'vibed'],
      action: () => {
        onNavigate?.('vibed-ed');
        onClose();
      },
    },
    {
      id: 'nav-workflows',
      label: 'Go to Workflows',
      description: 'Open workflow management',
      icon: <Rocket size={18} />,
      category: 'navigation',
      keywords: ['workflow', 'automation'],
      action: () => {
        onNavigate?.('workflows');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      label: 'Open Settings',
      description: 'Configure application settings',
      icon: <Settings size={18} />,
      category: 'settings',
      keywords: ['settings', 'config', 'preferences'],
      action: () => {
        onNavigate?.('settings');
        onClose();
      },
    },
    {
      id: 'nav-quick-labs',
      label: 'Go to Quick Labs',
      description: 'Open quick lab tools',
      icon: <Activity size={18} />,
      category: 'navigation',
      keywords: ['quick', 'labs', 'tools'],
      action: () => {
        onNavigate?.('quick-labs');
        onClose();
      },
    },
  ], [onNavigate, onClose]);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return commands;
    }

    const query = searchQuery.toLowerCase();
    return commands.filter((cmd) => {
      const matchesLabel = cmd.label.toLowerCase().includes(query);
      const matchesDescription = cmd.description?.toLowerCase().includes(query);
      const matchesKeywords = cmd.keywords?.some((kw) => kw.toLowerCase().includes(query));
      return matchesLabel || matchesDescription || matchesKeywords;
    });
  }, [commands, searchQuery]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Flatten grouped commands for navigation
  const flatCommands = useMemo(() => {
    return Object.values(groupedCommands).flat();
  }, [groupedCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && flatCommands.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, flatCommands.length]);

  /**
   * Handle keyboard shortcuts for navigating/activating commands within the palette.
   *
   * @param e - Keyboard event triggered while the palette has focus.
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatCommands.length) % flatCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatCommands[selectedIndex]) {
        flatCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [flatCommands, selectedIndex, onClose]);

  /**
   * Execute a command when it is clicked with the mouse.
   *
   * @param command - Selected command item to execute.
   */
  const handleCommandClick = useCallback((command: CommandItem) => {
    command.action();
  }, []);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    files: 'Files',
    settings: 'Settings',
    workflows: 'Workflows',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={false}
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="command-palette" onKeyDown={handleKeyDown}>
        <div className="command-palette__header">
          <div className="command-palette__icon">
            <Command size={20} />
          </div>
          <Input
            ref={inputRef}
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
            className="command-palette__input"
            autoFocus
          />
        </div>

        <div className="command-palette__body" ref={listRef}>
          {flatCommands.length === 0 ? (
            <div className="command-palette__empty">
              <p>No commands found</p>
              <span className="command-palette__empty-hint">Try a different search term</span>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category} className="command-palette__group">
                <div className="command-palette__group-header">
                  {categoryLabels[category] || category}
                </div>
                {categoryCommands.map((command) => {
                  const flatIndex = flatCommands.indexOf(command);
                  const isSelected = flatIndex === selectedIndex;
                  
                  return (
                    <div
                      key={command.id}
                      className={`command-palette__item ${isSelected ? 'command-palette__item--selected' : ''}`}
                      onClick={() => handleCommandClick(command)}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                    >
                      <div className="command-palette__item-icon">
                        {command.icon}
                      </div>
                      <div className="command-palette__item-content">
                        <div className="command-palette__item-label">{command.label}</div>
                        {command.description && (
                          <div className="command-palette__item-description">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <div className="command-palette__item-shortcut">
                          {command.shortcut}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette__footer">
          <div className="command-palette__hints">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> Navigate
            </span>
            <span>
              <kbd>Enter</kbd> Select
            </span>
            <span>
              <kbd>Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Hook to use command palette
/**
 * Small helper hook for toggling the global command palette from components.
 *
 * @returns Command palette state and control helpers.
 */
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
};

