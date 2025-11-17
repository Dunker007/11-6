/**
 * commandPaletteService.ts
 * Command palette for quick actions and navigation (Cmd+K style).
 */

import { logger } from '../logging/loggerService';

export interface Command {
  id: string;
  name: string;
  description: string;
  category: 'navigation' | 'action' | 'search' | 'settings';
  shortcut?: string;
  icon?: string;
  keywords: string[];
  action: () => void | Promise<void>;
}

export interface CommandGroup {
  name: string;
  commands: Command[];
}

export interface CommandHistory {
  commandId: string;
  timestamp: Date;
}

class CommandPaletteService {
  private commands: Command[] = [];
  private history: CommandHistory[] = [];
  private isOpen: boolean = false;

  registerCommand(command: Command): void {
    this.commands.push(command);
    logger.info('Command registered', { id: command.id, name: command.name });
  }

  registerCommands(commands: Command[]): void {
    commands.forEach(cmd => this.registerCommand(cmd));
  }

  unregisterCommand(commandId: string): void {
    this.commands = this.commands.filter(cmd => cmd.id !== commandId);
    logger.info('Command unregistered', { id: commandId });
  }

  search(query: string): Command[] {
    const lowerQuery = query.toLowerCase();

    return this.commands.filter(cmd => {
      const nameMatch = cmd.name.toLowerCase().includes(lowerQuery);
      const descMatch = cmd.description.toLowerCase().includes(lowerQuery);
      const keywordMatch = cmd.keywords.some(k => k.toLowerCase().includes(lowerQuery));

      return nameMatch || descMatch || keywordMatch;
    }).sort((a, b) => {
      // Prioritize name matches
      const aNameMatch = a.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
      const bNameMatch = b.name.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
      return bNameMatch - aNameMatch;
    });
  }

  getCommandsByCategory(category: string): Command[] {
    return this.commands.filter(cmd => cmd.category === category);
  }

  getCommandGroups(): CommandGroup[] {
    const categories: Record<string, Command[]> = {};

    this.commands.forEach(cmd => {
      if (!categories[cmd.category]) {
        categories[cmd.category] = [];
      }
      categories[cmd.category].push(cmd);
    });

    return Object.entries(categories).map(([name, commands]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      commands,
    }));
  }

  async executeCommand(commandId: string): Promise<void> {
    const command = this.commands.find(cmd => cmd.id === commandId);

    if (!command) {
      logger.error('Command not found', { commandId });
      return;
    }

    logger.info('Executing command', { id: commandId, name: command.name });

    try {
      await command.action();

      this.history.push({
        commandId,
        timestamp: new Date(),
      });

      logger.info('Command executed successfully', { id: commandId });
    } catch (error) {
      logger.error('Command execution failed', { commandId, error });
      throw error;
    }
  }

  getRecentCommands(limit: number = 5): Command[] {
    const recentIds = this.history
      .slice(-limit)
      .reverse()
      .map(h => h.commandId);

    const uniqueIds = [...new Set(recentIds)];

    return uniqueIds
      .map(id => this.commands.find(cmd => cmd.id === id))
      .filter((cmd): cmd is Command => cmd !== undefined);
  }

  getPopularCommands(limit: number = 5): Command[] {
    const commandCounts = new Map<string, number>();

    this.history.forEach(h => {
      commandCounts.set(h.commandId, (commandCounts.get(h.commandId) || 0) + 1);
    });

    const sorted = Array.from(commandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted
      .map(([id]) => this.commands.find(cmd => cmd.id === id))
      .filter((cmd): cmd is Command => cmd !== undefined);
  }

  open(): void {
    this.isOpen = true;
    logger.info('Command palette opened');
  }

  close(): void {
    this.isOpen = false;
    logger.info('Command palette closed');
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    logger.info('Command palette toggled', { isOpen: this.isOpen });
  }

  getState(): boolean {
    return this.isOpen;
  }

  initializeDefaultCommands(): void {
    const defaultCommands: Command[] = [
      {
        id: 'nav-dashboard',
        name: 'Go to Dashboard',
        description: 'Navigate to the main dashboard',
        category: 'navigation',
        shortcut: 'Cmd+D',
        icon: '📊',
        keywords: ['home', 'main', 'overview'],
        action: async () => {
          logger.info('Navigating to dashboard');
        },
      },
      {
        id: 'nav-content',
        name: 'Go to Content',
        description: 'View all content',
        category: 'navigation',
        shortcut: 'Cmd+C',
        icon: '📝',
        keywords: ['posts', 'articles', 'blog'],
        action: async () => {
          logger.info('Navigating to content');
        },
      },
      {
        id: 'nav-revenue',
        name: 'Go to Revenue',
        description: 'View revenue analytics',
        category: 'navigation',
        shortcut: 'Cmd+R',
        icon: '💰',
        keywords: ['money', 'earnings', 'analytics'],
        action: async () => {
          logger.info('Navigating to revenue');
        },
      },
      {
        id: 'action-new-content',
        name: 'Create New Content',
        description: 'Start creating new content',
        category: 'action',
        shortcut: 'Cmd+N',
        icon: '➕',
        keywords: ['new', 'create', 'post'],
        action: async () => {
          logger.info('Creating new content');
        },
      },
      {
        id: 'action-publish',
        name: 'Publish Content',
        description: 'Publish content to platforms',
        category: 'action',
        icon: '🚀',
        keywords: ['publish', 'deploy', 'release'],
        action: async () => {
          logger.info('Publishing content');
        },
      },
      {
        id: 'search-content',
        name: 'Search Content',
        description: 'Search all your content',
        category: 'search',
        shortcut: 'Cmd+/',
        icon: '🔍',
        keywords: ['find', 'search', 'query'],
        action: async () => {
          logger.info('Opening search');
        },
      },
      {
        id: 'settings-profile',
        name: 'Edit Profile',
        description: 'Update your profile settings',
        category: 'settings',
        icon: '⚙️',
        keywords: ['settings', 'profile', 'account'],
        action: async () => {
          logger.info('Opening profile settings');
        },
      },
    ];

    this.registerCommands(defaultCommands);
    logger.info('Default commands initialized', { count: defaultCommands.length });
  }

  quickTest() {
    this.initializeDefaultCommands();

    // Test search
    const dashboardResults = this.search('dashboard');
    const contentResults = this.search('content');

    // Test execution
    this.executeCommand('nav-dashboard');
    this.executeCommand('action-new-content');
    this.executeCommand('nav-dashboard');

    return {
      totalCommands: this.commands.length,
      commandGroups: this.getCommandGroups(),
      searchResults: { dashboard: dashboardResults, content: contentResults },
      recentCommands: this.getRecentCommands(),
      popularCommands: this.getPopularCommands(),
    };
  }
}

export const commandPaletteService = new CommandPaletteService();
if (typeof window !== 'undefined') (window as any).testCommandPalette = () => commandPaletteService.quickTest();
