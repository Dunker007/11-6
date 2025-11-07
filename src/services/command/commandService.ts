import type { Command, CommandCategory } from '@/types/command';

class CommandService {
  private static instance: CommandService;
  private commands: Map<string, Command> = new Map();
  private listeners: Set<(commands: Command[]) => void> = new Set();

  static getInstance(): CommandService {
    if (!CommandService.instance) {
      CommandService.instance = new CommandService();
    }
    return CommandService.instance;
  }

  register(command: Command): void {
    this.commands.set(command.id, command);
    this.notifyListeners();
  }

  unregister(id: string): void {
    this.commands.delete(id);
    this.notifyListeners();
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(category: CommandCategory): Command[] {
    return this.getAllCommands().filter((cmd) => cmd.category === category);
  }

  search(query: string): Command[] {
    if (!query.trim()) {
      return this.getAllCommands();
    }

    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/);

    return this.getAllCommands()
      .map((cmd) => {
        const score = this.calculateScore(cmd, queryWords, lowerQuery);
        return { cmd, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);
  }

  private calculateScore(cmd: Command, queryWords: string[], query: string): number {
    let score = 0;

    // Exact label match
    if (cmd.label.toLowerCase().includes(query)) {
      score += 100;
    }

    // Word matches in label
    queryWords.forEach((word) => {
      if (cmd.label.toLowerCase().includes(word)) {
        score += 50;
      }
    });

    // Description match
    if (cmd.description?.toLowerCase().includes(query)) {
      score += 30;
    }

    // Keyword matches
    cmd.keywords?.forEach((keyword) => {
      if (keyword.toLowerCase().includes(query)) {
        score += 20;
      }
      queryWords.forEach((word) => {
        if (keyword.toLowerCase().includes(word)) {
          score += 10;
        }
      });
    });

    // Category match
    if (cmd.category.toLowerCase().includes(query)) {
      score += 15;
    }

    return score;
  }

  subscribe(listener: (commands: Command[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const commands = this.getAllCommands();
    this.listeners.forEach((listener) => listener(commands));
  }
}

export const commandService = CommandService.getInstance();

