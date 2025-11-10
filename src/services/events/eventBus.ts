/**
 * Event Bus Service
 * 
 * Centralized event system for cross-tab communication.
 * Allows components to emit and subscribe to events without direct coupling.
 */

export type EventType =
  // Idea Lab events
  | 'idea:created'
  | 'idea:updated'
  | 'idea:deleted'
  | 'idea:status-changed'
  // Crypto Lab events
  | 'crypto:trade-executed'
  | 'crypto:profit-threshold'
  | 'crypto:withdrawal-recorded'
  | 'crypto:position-opened'
  | 'crypto:position-closed'
  // Wealth Lab events
  | 'wealth:net-worth-updated'
  | 'wealth:budget-threshold'
  | 'wealth:account-connected'
  // Revenue events
  | 'revenue:income-added'
  | 'revenue:expense-added'
  | 'revenue:threshold-breached'
  // LLM events
  | 'llm:model-changed'
  | 'llm:cost-threshold'
  | 'llm:provider-status-changed'
  // Project/VibedEd events
  | 'project:created'
  | 'project:completed'
  | 'project:deployed'
  | 'project:build-failed'
  // System events
  | 'system:error'
  | 'system:health-alert'
  | 'workflow:started'
  | 'workflow:completed'
  | 'workflow:failed'
  | 'system:notification';

export interface EventPayload {
  [key: string]: any;
}

export type EventHandler = (payload: EventPayload) => void;

class EventBus {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event type.
   * 
   * Registers a handler function that will be called whenever the specified event is emitted.
   * Returns an unsubscribe function that can be called to remove the handler.
   * 
   * @param eventType - The event type to listen for (e.g., 'idea:created', 'workflow:completed')
   * @param handler - The callback function to execute when the event fires. Receives the event payload.
   * @returns An unsubscribe function that removes the handler when called
   * 
   * @example
   * ```typescript
   * const unsubscribe = eventBus.on('idea:created', (payload) => {
   *   console.log('New idea created:', payload);
   * });
   * 
   * // Later, to unsubscribe:
   * unsubscribe();
   * ```
   */
  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to an event type for one-time execution only.
   * 
   * The handler will be automatically unsubscribed after the first event is received.
   * Useful for one-time operations like initialization or cleanup.
   * 
   * @param eventType - The event type to listen for
   * @param handler - The callback function to execute when the event fires
   * 
   * @example
   * ```typescript
   * eventBus.once('workflow:completed', (payload) => {
   *   console.log('Workflow completed:', payload.workflowId);
   *   // Handler is automatically removed after this call
   * });
   * ```
   */
  once(eventType: EventType, handler: EventHandler): void {
    const wrappedHandler: EventHandler = (payload) => {
      handler(payload);
      this.off(eventType, wrappedHandler);
    };
    this.on(eventType, wrappedHandler);
  }

  /**
   * Unsubscribe from an event type.
   * 
   * Removes a specific handler or all handlers for the specified event type.
   * 
   * @param eventType - The event type to unsubscribe from
   * @param handler - Optional specific handler to remove. If not provided, removes all handlers for this event type
   * 
   * @example
   * ```typescript
   * // Remove a specific handler
   * eventBus.off('idea:created', myHandler);
   * 
   * // Remove all handlers for an event type
   * eventBus.off('idea:created');
   * ```
   */
  off(eventType: EventType, handler?: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      if (handler) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      } else {
        // Remove all handlers for this event type
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Emit an event to all registered handlers.
   * 
   * Triggers all handlers subscribed to the specified event type with the provided payload.
   * Errors in handlers are caught and logged but do not prevent other handlers from executing.
   * 
   * @param eventType - The event type to emit
   * @param payload - The data to pass to handlers (default: empty object)
   * 
   * @example
   * ```typescript
   * eventBus.emit('idea:created', {
   *   ideaId: 'idea_123',
   *   title: 'New Feature',
   *   timestamp: new Date()
   * });
   * ```
   */
  emit(eventType: EventType, payload: EventPayload = {}): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get all registered event types.
   * 
   * @returns An array of all event types that have at least one registered handler
   * 
   * @example
   * ```typescript
   * const eventTypes = eventBus.getEventTypes();
   * console.log(`Active event types: ${eventTypes.join(', ')}`);
   * ```
   */
  getEventTypes(): EventType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get the number of handlers registered for a specific event type.
   * 
   * @param eventType - The event type to check
   * @returns The number of handlers registered for this event type, or 0 if none
   * 
   * @example
   * ```typescript
   * const count = eventBus.getHandlerCount('idea:created');
   * console.log(`${count} handlers listening for idea:created`);
   * ```
   */
  getHandlerCount(eventType: EventType): number {
    return this.handlers.get(eventType)?.size || 0;
  }

  /**
   * Clear all event handlers (useful for testing or cleanup).
   * 
   * Removes all registered handlers for all event types. Use with caution as this
   * will break all event subscriptions throughout the application.
   * 
   * @example
   * ```typescript
   * // In tests, clean up before each test
   * beforeEach(() => {
   *   eventBus.clear();
   * });
   * ```
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();

