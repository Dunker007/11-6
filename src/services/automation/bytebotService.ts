export interface ByteBotTask {
  id: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ByteBotConfig {
  endpoint: string;
  enabled: boolean;
}

export class ByteBotService {
  private static instance: ByteBotService;
  private config: ByteBotConfig = {
    endpoint: 'http://localhost:8000',
    enabled: false,
  };
  private tasks: ByteBotTask[] = [];

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): ByteBotService {
    if (!ByteBotService.instance) {
      ByteBotService.instance = new ByteBotService();
    }
    return ByteBotService.instance;
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('bytebot_config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load ByteBot config:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('bytebot_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save ByteBot config:', error);
    }
  }

  async connect(endpoint: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        this.config.endpoint = endpoint;
        this.config.enabled = true;
        this.saveConfig();
        return { success: true };
      }
      return { success: false, error: 'ByteBot server not responding' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async executeTask(command: string): Promise<{ success: boolean; taskId?: string; error?: string }> {
    if (!this.config.enabled) {
      return { success: false, error: 'ByteBot not enabled' };
    }

    const task: ByteBotTask = {
      id: crypto.randomUUID(),
      command,
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.push(task);

    try {
      task.status = 'running';
      const response = await fetch(`${this.config.endpoint}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (response.ok) {
        const result = await response.json();
        task.status = 'completed';
        task.result = result.output || result.message;
        task.completedAt = new Date();
        return { success: true, taskId: task.id };
      } else {
        task.status = 'failed';
        task.error = `HTTP ${response.status}`;
        task.completedAt = new Date();
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      task.status = 'failed';
      task.error = (error as Error).message;
      task.completedAt = new Date();
      return { success: false, error: (error as Error).message };
    }
  }

  getTasks(): ByteBotTask[] {
    return [...this.tasks].reverse(); // Most recent first
  }

  getTaskStatus(taskId: string): ByteBotTask | null {
    return this.tasks.find((t) => t.id === taskId) || null;
  }

  async cancelTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.status === 'running') {
      try {
        await fetch(`${this.config.endpoint}/api/tasks/${taskId}/cancel`, {
          method: 'POST',
        });
        task.status = 'failed';
        task.error = 'Cancelled by user';
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }

    return { success: false, error: 'Task is not running' };
  }

  getConfig(): ByteBotConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<ByteBotConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }
}

export const byteBotService = ByteBotService.getInstance();

