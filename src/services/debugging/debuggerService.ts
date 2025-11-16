/**
 * debuggerService.ts
 * 
 * PURPOSE:
 * Service for Chrome DevTools Protocol (CDP) debugging operations.
 * Provides methods to connect to CDP, manage breakpoints, step through code,
 * inspect variables, and get call stack information.
 * 
 * ARCHITECTURE:
 * Renderer-side service that communicates with Electron main process via IPC:
 * - IPC calls to debugger handlers in main process
 * - CDP operations handled in main process
 * - Event-based updates for debugging state
 * 
 * Features:
 * - CDP connection management
 * - Breakpoint operations
 * - Step debugging (over, into, out)
 * - Variable inspection
 * - Call stack retrieval
 * - Expression evaluation
 * 
 * CURRENT STATUS:
 * ✅ CDP connection
 * ✅ Breakpoint management
 * ✅ Step debugging
 * ✅ Variable inspection
 * ✅ Call stack
 * 
 * DEPENDENCIES:
 * - Electron IPC: Communication with main process
 * - chrome-remote-interface: CDP client (in main process)
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { debuggerService } from '@/services/debugging/debuggerService';
 * 
 * await debuggerService.connect(9222);
 * await debuggerService.setBreakpoint('src/file.ts', 10);
 * await debuggerService.stepOver();
 * ```
 * 
 * RELATED FILES:
 * - electron/ipc/debuggerHandlers.ts: IPC handlers in main process
 * - src/components/Debugging/DebuggerPanel.tsx: Debugging UI
 */

export interface Breakpoint {
  id: string;
  filePath: string;
  line: number;
  column?: number;
  enabled: boolean;
  condition?: string;
}

export interface Variable {
  name: string;
  value: any;
  type: string;
  scope?: string;
}

export interface CallFrame {
  id: string;
  functionName: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  scopeChain: Array<{
    type: string;
    name?: string;
  }>;
}

class DebuggerService {
  private static instance: DebuggerService;
  private isConnected: boolean = false;
  private breakpoints: Map<string, Breakpoint> = new Map();
  private currentCallFrames: CallFrame[] = [];
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && (window as any).electron) {
      this.setupEventListeners();
    }
  }

  static getInstance(): DebuggerService {
    if (!DebuggerService.instance) {
      DebuggerService.instance = new DebuggerService();
    }
    return DebuggerService.instance;
  }

  private setupEventListeners() {
    // Listen for debugging events from main process
    // This would be set up via IPC event listeners
  }

  /**
   * Connect to CDP endpoint
   */
  async connect(port: number = 9222): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.connect(port);
      if (result.success) {
        this.isConnected = true;
        this.emit('connected', { port });
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Disconnect from CDP
   */
  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.disconnect();
      if (result.success) {
        this.isConnected = false;
        this.breakpoints.clear();
        this.currentCallFrames = [];
        this.emit('disconnected', {});
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Set a breakpoint
   */
  async setBreakpoint(
    filePath: string,
    line: number,
    column?: number
  ): Promise<{ success: boolean; breakpointId?: string; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.setBreakpoint(filePath, line, column);

      if (result.success && result.breakpointId) {
        const breakpoint: Breakpoint = {
          id: result.breakpointId,
          filePath,
          line,
          column,
          enabled: true,
        };
        this.breakpoints.set(result.breakpointId, breakpoint);
        this.emit('breakpointAdded', breakpoint);
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Remove a breakpoint
   */
  async removeBreakpoint(breakpointId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.removeBreakpoint(breakpointId);

      if (result.success) {
        const breakpoint = this.breakpoints.get(breakpointId);
        this.breakpoints.delete(breakpointId);
        if (breakpoint) {
          this.emit('breakpointRemoved', breakpoint);
        }
      }

      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all breakpoints
   */
  getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Step over
   */
  async stepOver(): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.stepOver();
      if (result.success) {
        this.emit('stepped', { type: 'over' });
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Step into
   */
  async stepInto(): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.stepInto();
      if (result.success) {
        this.emit('stepped', { type: 'into' });
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Step out
   */
  async stepOut(): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.stepOut();
      if (result.success) {
        this.emit('stepped', { type: 'out' });
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Resume execution
   */
  async resume(): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.resume();
      if (result.success) {
        this.emit('resumed', {});
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Pause execution
   */
  async pause(): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.pause();
      if (result.success) {
        this.emit('paused', {});
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get call stack
   */
  async getCallStack(): Promise<{ success: boolean; callFrames?: CallFrame[]; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      const result = await (window as any).debugger.getCallStack();
      if (result.success && result.callFrames) {
        this.currentCallFrames = result.callFrames;
      }
      return result;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get variables in scope
   */
  async getVariables(callFrameId: string): Promise<{ success: boolean; variables?: Variable[]; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      return await (window as any).debugger.getVariables(callFrameId);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Evaluate expression
   */
  async evaluate(expression: string, callFrameId?: string): Promise<{ success: boolean; result?: any; type?: string; error?: string }> {
    try {
      if (typeof window === 'undefined' || !(window as any).debugger) {
        return { success: false, error: 'Not in Electron environment' };
      }

      return await (window as any).debugger.evaluate(expression, callFrameId);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

export const debuggerService = DebuggerService.getInstance();

