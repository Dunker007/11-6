/**
 * keyboardShortcutsService.ts
 * Keyboard shortcuts manager for productivity and accessibility.
 */

import { logger } from '../logging/loggerService';

export interface Shortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'cmd' | 'alt' | 'shift')[];
  action: string;
  description: string;
  category: 'navigation' | 'content' | 'general' | 'custom';
  enabled: boolean;
  global?: boolean;
}

export interface ShortcutGroup {
  category: string;
  shortcuts: Shortcut[];
}

export interface KeyBinding {
  key: string;
  modifiers: string[];
  action: () => void | Promise<void>;
}

class KeyboardShortcutsService {
  private shortcuts: Shortcut[] = [];
  private bindings = new Map<string, () => void | Promise<void>>();
  private listeners: ((e: KeyboardEvent) => void)[] = [];
  private enabled: boolean = true;

  registerShortcut(
    key: string,
    modifiers: Shortcut['modifiers'],
    action: string,
    description: string,
    category: Shortcut['category'],
    handler: () => void | Promise<void>
  ): Shortcut {
    const shortcut: Shortcut = {
      id: crypto.randomUUID(),
      key,
      modifiers,
      action,
      description,
      category,
      enabled: true,
      global: false,
    };

    this.shortcuts.push(shortcut);

    const bindingKey = this.createBindingKey(key, modifiers);
    this.bindings.set(bindingKey, handler);

    logger.info('Shortcut registered', { id: shortcut.id, key, action });

    return shortcut;
  }

  unregisterShortcut(shortcutId: string): boolean {
    const index = this.shortcuts.findIndex(s => s.id === shortcutId);

    if (index === -1) {
      return false;
    }

    const shortcut = this.shortcuts[index];
    const bindingKey = this.createBindingKey(shortcut.key, shortcut.modifiers);

    this.bindings.delete(bindingKey);
    this.shortcuts.splice(index, 1);

    logger.info('Shortcut unregistered', { id: shortcutId });

    return true;
  }

  private createBindingKey(key: string, modifiers: string[]): string {
    const sortedModifiers = [...modifiers].sort().join('+');
    return sortedModifiers ? `${sortedModifiers}+${key}` : key;
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (!this.enabled) {
      return;
    }

    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.metaKey) modifiers.push('cmd');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    const key = event.key.toLowerCase();
    const bindingKey = this.createBindingKey(key, modifiers);

    const handler = this.bindings.get(bindingKey);

    if (handler) {
      event.preventDefault();
      handler();
      logger.info('Shortcut triggered', { key: bindingKey });
    }
  }

  enableShortcuts(): void {
    this.enabled = true;
    logger.info('Keyboard shortcuts enabled');
  }

  disableShortcuts(): void {
    this.enabled = false;
    logger.info('Keyboard shortcuts disabled');
  }

  toggleShortcut(shortcutId: string, enabled: boolean): boolean {
    const shortcut = this.shortcuts.find(s => s.id === shortcutId);

    if (!shortcut) {
      return false;
    }

    shortcut.enabled = enabled;
    logger.info('Shortcut toggled', { id: shortcutId, enabled });

    return true;
  }

  getShortcuts(category?: string): Shortcut[] {
    if (category) {
      return this.shortcuts.filter(s => s.category === category);
    }
    return this.shortcuts;
  }

  getShortcutGroups(): ShortcutGroup[] {
    const groups = new Map<string, Shortcut[]>();

    this.shortcuts.forEach(shortcut => {
      if (!groups.has(shortcut.category)) {
        groups.set(shortcut.category, []);
      }
      groups.get(shortcut.category)!.push(shortcut);
    });

    return Array.from(groups.entries()).map(([category, shortcuts]) => ({
      category,
      shortcuts,
    }));
  }

  formatShortcut(shortcut: Shortcut): string {
    const modifiers = shortcut.modifiers.map(m => {
      switch (m) {
        case 'ctrl':
          return 'Ctrl';
        case 'cmd':
          return '⌘';
        case 'alt':
          return 'Alt';
        case 'shift':
          return 'Shift';
        default:
          return m;
      }
    });

    return [...modifiers, shortcut.key.toUpperCase()].join('+');
  }

  searchShortcuts(query: string): Shortcut[] {
    const lowerQuery = query.toLowerCase();

    return this.shortcuts.filter(s => {
      const actionMatch = s.action.toLowerCase().includes(lowerQuery);
      const descMatch = s.description.toLowerCase().includes(lowerQuery);
      const keyMatch = s.key.toLowerCase().includes(lowerQuery);

      return actionMatch || descMatch || keyMatch;
    });
  }

  initializeDefaultShortcuts(): void {
    // Navigation shortcuts
    this.registerShortcut('d', ['cmd'], 'go-to-dashboard', 'Navigate to dashboard', 'navigation', () => {
      logger.info('Navigate to dashboard');
    });

    this.registerShortcut('c', ['cmd'], 'go-to-content', 'Navigate to content', 'navigation', () => {
      logger.info('Navigate to content');
    });

    this.registerShortcut('r', ['cmd'], 'go-to-revenue', 'Navigate to revenue', 'navigation', () => {
      logger.info('Navigate to revenue');
    });

    // Content shortcuts
    this.registerShortcut('n', ['cmd'], 'new-content', 'Create new content', 'content', () => {
      logger.info('Create new content');
    });

    this.registerShortcut('s', ['cmd'], 'save-content', 'Save current content', 'content', () => {
      logger.info('Save content');
    });

    this.registerShortcut('p', ['cmd', 'shift'], 'publish-content', 'Publish content', 'content', () => {
      logger.info('Publish content');
    });

    // General shortcuts
    this.registerShortcut('k', ['cmd'], 'open-command-palette', 'Open command palette', 'general', () => {
      logger.info('Open command palette');
    });

    this.registerShortcut('/', ['cmd'], 'search', 'Global search', 'general', () => {
      logger.info('Open search');
    });

    this.registerShortcut(',', ['cmd'], 'open-settings', 'Open settings', 'general', () => {
      logger.info('Open settings');
    });

    this.registerShortcut('?', ['shift'], 'show-shortcuts', 'Show keyboard shortcuts', 'general', () => {
      logger.info('Show shortcuts help');
    });

    logger.info('Default shortcuts initialized', { count: this.shortcuts.length });
  }

  exportShortcuts(): string {
    return JSON.stringify(
      this.shortcuts.map(s => ({
        key: s.key,
        modifiers: s.modifiers,
        action: s.action,
        description: s.description,
        category: s.category,
      })),
      null,
      2
    );
  }

  quickTest() {
    this.initializeDefaultShortcuts();

    // Simulate key press
    const mockEvent = {
      key: 'k',
      ctrlKey: false,
      metaKey: true,
      altKey: false,
      shiftKey: false,
      preventDefault: () => {},
    } as KeyboardEvent;

    this.handleKeyPress(mockEvent);

    const navigationShortcuts = this.getShortcuts('navigation');
    const searchResults = this.searchShortcuts('content');

    return {
      totalShortcuts: this.shortcuts.length,
      groups: this.getShortcutGroups().map(g => ({
        category: g.category,
        count: g.shortcuts.length,
      })),
      navigationShortcuts: navigationShortcuts.map(s => ({
        formatted: this.formatShortcut(s),
        action: s.action,
      })),
      searchResults: searchResults.length,
      enabled: this.enabled,
    };
  }
}

export const keyboardShortcutsService = new KeyboardShortcutsService();
if (typeof window !== 'undefined') (window as any).testKeyboardShortcuts = () => keyboardShortcutsService.quickTest();
