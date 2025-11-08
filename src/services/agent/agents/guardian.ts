// src/services/agent/agents/guardian.ts
import { agentService } from '../agentService';
import { errorLogger } from '../../errors/errorLogger';
import { notificationService } from '../../notification/notificationService';
import { ICON_MAP } from '../../../components/Icons/IconSet';

class GuardianAgent {
  private agentId = 'guardian';
  private unsubscribe: (() => void) | null = null;

  start() {
    if (this.unsubscribe) {
      console.warn('Guardian agent is already running.');
      return;
    }

    agentService.updateAgentStatus(this.agentId, 'running');
    agentService.addAgentLog(this.agentId, 'Guardian activated. Monitoring system health.');

    this.unsubscribe = errorLogger.subscribe(() => {
      // Defer the reaction to the next tick to break out of any ongoing render cycles.
      // This prevents a feedback loop where React's own warnings about rendering
      // would cause state updates that trigger more warnings.
      setTimeout(() => {
        const stats = errorLogger.getStats();
        const errorCount = stats.bySeverity.critical + stats.bySeverity.error;

        if (errorCount > (agentService.getAgent(this.agentId)?.logs.length || 1) - 1) {
          const errors = errorLogger.getErrors();
          const mostRecentError = errors[0]; // Get the most recent error from the start of the array
          if (mostRecentError) {
            const logMessage = `[${mostRecentError.severity.toUpperCase()}] New error detected: ${mostRecentError.message}`;
            agentService.updateAgentStatus(this.agentId, 'error');
            agentService.addAgentLog(this.agentId, logMessage);
            
            // Send a notification
            notificationService.error(
              'Guardian Alert',
              `A new ${mostRecentError.severity} error was detected.`,
              ICON_MAP.shield
            );

            // Reset to 'running' after a delay to signify it's still monitoring
            setTimeout(() => agentService.updateAgentStatus(this.agentId, 'running'), 5000);
          }
        }
      }, 0);
    });
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      agentService.updateAgentStatus(this.agentId, 'idle');
      agentService.addAgentLog(this.agentId, 'Guardian deactivated.');
    }
  }
}

export const guardianAgent = new GuardianAgent();
