export interface Command {
  id: string;
  label: string;
  description?: string;
  category: CommandCategory;
  icon?: string;
  shortcut?: string;
  keywords?: string[]; // For fuzzy search
  action: () => void | Promise<void>;
}

export type CommandCategory =
  | 'navigation'
  | 'file'
  | 'ai'
  | 'settings'
  | 'quicklabs'
  | 'workflow'
  | 'other';

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  filteredCommands: Command[];
}

