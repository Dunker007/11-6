/**
 * Command History Service
 * Tracks command usage frequency and recent commands for better command palette UX
 */

interface CommandHistoryEntry {
  commandId: string;
  timestamp: number;
  count: number;
}

interface CommandHistory {
  recent: CommandHistoryEntry[];
  frequency: Record<string, number>;
  lastUsed: Record<string, number>;
}

const STORAGE_KEY = 'vibed-command-history';
const MAX_RECENT = 10;
const MAX_FREQUENCY_ENTRIES = 50;

class CommandHistoryService {
  private history: CommandHistory;

  constructor() {
    this.history = this.loadHistory();
  }

  /**
   * Load command history from localStorage
   */
  private loadHistory(): CommandHistory {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          recent: parsed.recent || [],
          frequency: parsed.frequency || {},
          lastUsed: parsed.lastUsed || {},
        };
      }
    } catch (error) {
      console.error('Failed to load command history:', error);
    }

    return {
      recent: [],
      frequency: {},
      lastUsed: {},
    };
  }

  /**
   * Save command history to localStorage
   */
  private saveHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save command history:', error);
    }
  }

  /**
   * Record a command execution
   * @param commandId - Unique identifier for the command
   */
  recordCommand(commandId: string): void {
    const now = Date.now();

    // Update frequency
    this.history.frequency[commandId] = (this.history.frequency[commandId] || 0) + 1;

    // Update last used timestamp
    this.history.lastUsed[commandId] = now;

    // Update recent list
    const existingIndex = this.history.recent.findIndex(
      (entry) => entry.commandId === commandId
    );

    if (existingIndex !== -1) {
      // Move to front if already exists
      const entry = this.history.recent[existingIndex];
      entry.timestamp = now;
      entry.count++;
      this.history.recent.splice(existingIndex, 1);
      this.history.recent.unshift(entry);
    } else {
      // Add new entry
      this.history.recent.unshift({
        commandId,
        timestamp: now,
        count: 1,
      });
    }

    // Trim recent list
    if (this.history.recent.length > MAX_RECENT) {
      this.history.recent = this.history.recent.slice(0, MAX_RECENT);
    }

    // Trim frequency map if it gets too large
    const frequencyEntries = Object.entries(this.history.frequency);
    if (frequencyEntries.length > MAX_FREQUENCY_ENTRIES) {
      // Keep only the most frequently used commands
      const sorted = frequencyEntries.sort((a, b) => b[1] - a[1]);
      this.history.frequency = Object.fromEntries(sorted.slice(0, MAX_FREQUENCY_ENTRIES));
    }

    this.saveHistory();
  }

  /**
   * Get recent command IDs
   * @param limit - Maximum number of recent commands to return
   * @returns Array of command IDs
   */
  getRecentCommands(limit: number = MAX_RECENT): string[] {
    return this.history.recent.slice(0, limit).map((entry) => entry.commandId);
  }

  /**
   * Get command frequency
   * @param commandId - Command to check
   * @returns Number of times command has been executed
   */
  getCommandFrequency(commandId: string): number {
    return this.history.frequency[commandId] || 0;
  }

  /**
   * Get last used timestamp for command
   * @param commandId - Command to check
   * @returns Timestamp of last use, or 0 if never used
   */
  getLastUsed(commandId: string): number {
    return this.history.lastUsed[commandId] || 0;
  }

  /**
   * Get frequently used commands
   * @param limit - Maximum number to return
   * @returns Array of command IDs sorted by frequency
   */
  getFrequentCommands(limit: number = 10): string[] {
    return Object.entries(this.history.frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([commandId]) => commandId);
  }

  /**
   * Calculate boost score for a command based on usage history
   * Higher score = more frequently/recently used
   * @param commandId - Command to score
   * @returns Boost score (0-100)
   */
  getBoostScore(commandId: string): number {
    const frequency = this.getCommandFrequency(commandId);
    const lastUsed = this.getLastUsed(commandId);
    const now = Date.now();

    // Frequency score (0-50 points)
    const maxFrequency = Math.max(...Object.values(this.history.frequency), 1);
    const frequencyScore = (frequency / maxFrequency) * 50;

    // Recency score (0-50 points)
    // Commands used in last hour get full points, decaying over 30 days
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const thirtyDaysMs = 30 * dayMs;
    const timeSinceUse = now - lastUsed;

    let recencyScore = 0;
    if (timeSinceUse < hourMs) {
      recencyScore = 50;
    } else if (timeSinceUse < dayMs) {
      recencyScore = 40;
    } else if (timeSinceUse < 7 * dayMs) {
      recencyScore = 30;
    } else if (timeSinceUse < thirtyDaysMs) {
      recencyScore = 20 - (timeSinceUse / thirtyDaysMs) * 20;
    }

    return frequencyScore + recencyScore;
  }

  /**
   * Clear all command history
   */
  clearHistory(): void {
    this.history = {
      recent: [],
      frequency: {},
      lastUsed: {},
    };
    this.saveHistory();
  }

  /**
   * Export history for debugging
   */
  exportHistory(): CommandHistory {
    return { ...this.history };
  }
}

// Singleton instance
export const commandHistoryService = new CommandHistoryService();

