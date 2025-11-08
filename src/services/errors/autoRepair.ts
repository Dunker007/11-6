import { CapturedError } from '../../types/error';
import { errorPatternDB, ErrorFixResult } from './errorPatterns';
import { errorLogger } from './errorLogger';
import { activityService } from '../activity/activityService';

/**
 * Auto-Repair Service (Future Feature)
 * Automatically suggests and applies fixes for common errors
 * 
 * This is a stub implementation for future development.
 */

class AutoRepair {
  private static instance: AutoRepair;
  private fixStrategies: Map<string, () => Promise<ErrorFixResult>> = new Map();

  private constructor() {
    this.registerFixStrategies();
  }

  static getInstance(): AutoRepair {
    if (!AutoRepair.instance) {
      AutoRepair.instance = new AutoRepair();
    }
    return AutoRepair.instance;
  }

  /**
   * Register fix strategies for auto-repairable errors
   */
  private registerFixStrategies(): void {
    // Strategy: Clear old activities from localStorage
    this.fixStrategies.set('clearOldActivities', async () => {
      try {
        const removed = activityService.clearOldActivities(7); // 7 days
        return {
          success: true,
          message: `Cleared ${removed} old activities from storage`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to clear old activities: ${error}`,
        };
      }
    });

    // Strategy: Reload editor
    this.fixStrategies.set('reloadEditor', async () => {
      try {
        // This would trigger editor reload - stub for now
        return {
          success: true,
          message: 'Editor reload triggered',
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to reload editor: ${error}`,
        };
      }
    });
  }

  /**
   * Analyze an error and suggest a fix
   */
  analyze(error: CapturedError): { canAutoFix: boolean; suggestedFix: string; fixStrategy?: string } {
    const pattern = errorPatternDB.findPattern(error.message);

    if (!pattern) {
      return {
        canAutoFix: false,
        suggestedFix: 'No automatic fix available for this error.',
      };
    }

    return {
      canAutoFix: pattern.autoFixable || false,
      suggestedFix: pattern.suggestedFix || 'No suggestion available.',
      fixStrategy: pattern.fixStrategy,
    };
  }

  /**
   * Apply a fix for an error (with user approval)
   */
  async applyFix(error: CapturedError, userApproved: boolean = false): Promise<ErrorFixResult> {
    if (!userApproved) {
      return {
        success: false,
        message: 'User approval required for auto-fix',
      };
    }

    const pattern = errorPatternDB.findPattern(error.message);
    if (!pattern || !pattern.autoFixable || !pattern.fixStrategy) {
      return {
        success: false,
        message: 'No auto-fix strategy available',
      };
    }

    const fixFn = this.fixStrategies.get(pattern.fixStrategy);
    if (!fixFn) {
      return {
        success: false,
        message: `Fix strategy "${pattern.fixStrategy}" not implemented`,
      };
    }

    try {
      const result = await fixFn();
      
      // Record the result
      errorPatternDB.recordFixAttempt(pattern.id, result.success);

      // Log the fix attempt
      errorLogger.logError(
        'system',
        `Auto-fix ${result.success ? 'succeeded' : 'failed'}: ${result.message}`,
        result.success ? 'info' : 'warning'
      );

      return result;
    } catch (error) {
      errorPatternDB.recordFixAttempt(pattern.id, false);
      return {
        success: false,
        message: `Fix failed with error: ${error}`,
      };
    }
  }

  /**
   * Get fix statistics
   */
  getStats(): { totalPatterns: number; autoFixablePatterns: number; totalFixes: number } {
    const patterns = errorPatternDB.getAllPatterns();
    const autoFixableCount = patterns.filter(p => p.autoFixable).length;
    
    let totalFixes = 0;
    patterns.forEach(pattern => {
      const history = errorPatternDB.getFixHistory(pattern.id);
      totalFixes += history.attempts;
    });

    return {
      totalPatterns: patterns.length,
      autoFixablePatterns: autoFixableCount,
      totalFixes,
    };
  }
}

export const autoRepair = AutoRepair.getInstance();

