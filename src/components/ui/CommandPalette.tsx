import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Command, Settings, Zap, Code, Bitcoin, TrendingUp, Lightbulb, Rocket, Activity, Clock, Star } from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import { fuzzySearchMultiField } from '@/utils/fuzzySearch';
import { commandHistoryService } from '@/services/command/commandHistoryService';
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
    // --- NAVIGATION ---
    {
      id: 'nav-overview',
      label: 'Go to Overview',
      description: 'Return to the main dashboard overview',
      icon: <Activity size={18} />,
      category: 'navigation',
      keywords: ['home', 'dashboard', 'main'],
      shortcut: 'G then O',
      action: () => {
        onNavigate?.('overview');
        onClose();
      },
    },
    {
      id: 'nav-intelligence',
      label: 'Go to AI Intelligence',
      description: 'View AI system status and metrics',
      icon: <Zap size={18} />,
      category: 'navigation',
      keywords: ['ai', 'intelligence', 'status'],
      shortcut: 'G then I',
      action: () => {
        onNavigate?.('intelligence');
        onClose();
      },
    },
    {
      id: 'nav-revenue',
      label: 'Go to Revenue Dashboard',
      description: 'View revenue and financial metrics',
      icon: <TrendingUp size={18} />,
      category: 'navigation',
      keywords: ['revenue', 'financial', 'money', 'stripe'],
      shortcut: 'G then R',
      action: () => {
        onNavigate?.('revenue');
        onClose();
      },
    },
    {
      id: 'nav-wealth',
      label: 'Go to Wealth Lab',
      description: 'Open personal finance and crypto management',
      icon: <Bitcoin size={18} />,
      category: 'navigation',
      keywords: ['wealth', 'finance', 'crypto', 'budget'],
      shortcut: 'G then W',
      action: () => {
        onNavigate?.('wealth');
        onClose();
      },
    },
    {
      id: 'nav-ideas',
      label: 'Go to Idea Lab',
      description: 'Brainstorm and plan new projects',
      icon: <Lightbulb size={18} />,
      category: 'navigation',
      keywords: ['idea', 'planning', 'brainstorm', 'canvas'],
      shortcut: 'G then L',
      action: () => {
        onNavigate?.('ideas');
        onClose();
      },
    },
    {
      id: 'nav-googleai',
      label: 'Go to Google AI Hub',
      description: 'Access Gemini and other Google AI tools',
      icon: <Code size={18} />,
      category: 'navigation',
      keywords: ['google', 'gemini', 'ai', 'studio'],
      shortcut: 'G then G',
      action: () => {
        onNavigate?.('googleai');
        onClose();
      },
    },
    {
      id: 'nav-agents',
      label: 'Go to AI Agents',
      description: 'Manage and interact with autonomous agents',
      icon: <Rocket size={18} />,
      category: 'navigation',
      keywords: ['agents', 'bots', 'automation'],
      shortcut: 'G then A',
      action: () => {
        onNavigate?.('agents');
        onClose();
      },
    },
    {
      id: 'nav-credentials',
      label: 'Manage Credentials',
      description: 'Securely manage API keys and secrets',
      icon: <Settings size={18} />,
      category: 'settings',
      keywords: ['credentials', 'keys', 'secrets', 'auth'],
      shortcut: 'G then C',
      action: () => {
        onNavigate?.('credentials');
        onClose();
      },
    },
    {
      id: 'nav-testing',
      label: 'Integration Tests',
      description: 'Run system integration tests',
      icon: <Activity size={18} />,
      category: 'settings',
      keywords: ['test', 'integration', 'debug'],
      shortcut: 'G then T',
      action: () => {
        onNavigate?.('testing');
        onClose();
      },
    },
    {
      id: 'nav-idle',
      label: 'Idle Computing',
      description: 'Manage idle resource monetization',
      icon: <Clock size={18} />,
      category: 'navigation',
      keywords: ['idle', 'mining', 'compute', 'golem'],
      shortcut: 'G then D',
      action: () => {
        onNavigate?.('idle');
        onClose();
      },
    },

    // --- ACTIONS ---
    {
      id: 'act-new-idea',
      label: 'Create New Idea',
      description: 'Start a new brainstorming session',
      icon: <Lightbulb size={18} />,
      category: 'actions',
      keywords: ['new', 'create', 'idea'],
      action: () => {
        onNavigate?.('ideas');
        // In a real app, this might also trigger a "New Idea" modal
        onClose();
      },
    },
    {
      id: 'act-run-tests',
      label: 'Run All Tests',
      description: 'Execute full integration test suite',
      icon: <Activity size={18} />,
      category: 'actions',
      keywords: ['run', 'test', 'suite'],
      action: () => {
        onNavigate?.('testing');
        // Could trigger test run
        onClose();
      },
    },
    {
      id: 'act-add-credential',
      label: 'Add New Credential',
      description: 'Securely store a new API key',
      icon: <Settings size={18} />,
      category: 'actions',
      keywords: ['add', 'key', 'credential'],
      action: () => {
        onNavigate?.('credentials');
        onClose();
      },
    },
  ], [onNavigate, onClose]);

  // Get recent and frequent commands
  const recentCommandIds = useMemo(() => commandHistoryService.getRecentCommands(5), []);
  const frequentCommandIds = useMemo(() => commandHistoryService.getFrequentCommands(5), []);

  // Filter commands based on search query with fuzzy matching
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      // When no search, show commands sorted by usage
      return [...commands].sort((a, b) => {
        const aBoost = commandHistoryService.getBoostScore(a.id);
        const bBoost = commandHistoryService.getBoostScore(b.id);
        return bBoost - aBoost;
      });
    }

    // Fuzzy search across multiple fields with weights
    const results = fuzzySearchMultiField(
      searchQuery,
      commands,
      [
        { getText: (cmd) => cmd.label, weight: 10 },
        { getText: (cmd) => cmd.description || '', weight: 5 },
        { getText: (cmd) => cmd.keywords?.join(' ') || '', weight: 3 },
      ],
      0 // No threshold, include all fuzzy matches
    );

    // Boost scores based on usage history
    const boostedResults = results.map((result) => {
      const historyBoost = commandHistoryService.getBoostScore(result.item.id);
      return {
        ...result,
        score: result.score + historyBoost,
      };
    });

    // Sort by boosted score
    boostedResults.sort((a, b) => b.score - a.score);

    return boostedResults.map((r) => r.item);
  }, [commands, searchQuery]);

  // Group commands by category (with special groups for recent/frequent when no search)
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};

    // Add recent commands group when no search
    if (!searchQuery.trim() && recentCommandIds.length > 0) {
      const recentCommands = recentCommandIds
        .map((id) => filteredCommands.find((cmd) => cmd.id === id))
        .filter((cmd): cmd is CommandItem => cmd !== undefined);

      if (recentCommands.length > 0) {
        groups['recent'] = recentCommands;
      }
    }

    // Add frequently used group when no search (if different from recent)
    if (!searchQuery.trim() && frequentCommandIds.length > 0) {
      const frequentCommands = frequentCommandIds
        .filter((id) => !recentCommandIds.includes(id)) // Exclude already shown in recent
        .map((id) => filteredCommands.find((cmd) => cmd.id === id))
        .filter((cmd): cmd is CommandItem => cmd !== undefined);

      if (frequentCommands.length > 0) {
        groups['frequent'] = frequentCommands;
      }
    }

    // Group remaining commands by category
    filteredCommands.forEach((cmd) => {
      // Skip if already in recent/frequent
      if (!searchQuery.trim()) {
        if (recentCommandIds.includes(cmd.id) || frequentCommandIds.includes(cmd.id)) {
          return;
        }
      }

      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands, recentCommandIds, frequentCommandIds, searchQuery]);

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
        const command = flatCommands[selectedIndex];
        commandHistoryService.recordCommand(command.id);
        command.action();
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
    // Record command usage
    commandHistoryService.recordCommand(command.id);
    // Execute command
    command.action();
  }, []);

  const categoryLabels: Record<string, string> = {
    recent: 'Recently Used',
    frequent: 'Frequently Used',
    navigation: 'Navigation',
    actions: 'Actions',
    files: 'Files',
    settings: 'Settings',
    workflows: 'Workflows',
  };

  // Icons for special categories
  const categoryIcons: Record<string, React.ReactNode> = {
    recent: <Clock size={14} />,
    frequent: <Star size={14} />,
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
                  {categoryIcons[category] && (
                    <span className="command-palette__group-icon">{categoryIcons[category]}</span>
                  )}
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

