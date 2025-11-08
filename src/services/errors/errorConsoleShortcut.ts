/**
 * Error Console Keyboard Shortcut Handler
 * Manages global keyboard shortcuts for toggling the error console
 */

type ToggleCallback = () => void;

class ErrorConsoleShortcut {
  private static instance: ErrorConsoleShortcut;
  private toggleCallback: ToggleCallback | null = null;
  private isActive = false;

  private constructor() {}

  static getInstance(): ErrorConsoleShortcut {
    if (!ErrorConsoleShortcut.instance) {
      ErrorConsoleShortcut.instance = new ErrorConsoleShortcut();
    }
    return ErrorConsoleShortcut.instance;
  }

  /**
   * Activate the keyboard shortcut listener
   */
  activate(toggleCallback: ToggleCallback): void {
    this.toggleCallback = toggleCallback;
    
    if (!this.isActive) {
      window.addEventListener('keydown', this.handleKeyDown);
      this.isActive = true;
    }
  }

  /**
   * Deactivate the keyboard shortcut listener
   */
  deactivate(): void {
    if (this.isActive) {
      window.removeEventListener('keydown', this.handleKeyDown);
      this.isActive = false;
    }
    this.toggleCallback = null;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Ctrl+` or Cmd+` on Mac
    if ((event.ctrlKey || event.metaKey) && event.key === '`') {
      event.preventDefault();
      if (this.toggleCallback) {
        this.toggleCallback();
      }
    }

    // Alternative: Ctrl+Shift+E or Cmd+Shift+E
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
      event.preventDefault();
      if (this.toggleCallback) {
        this.toggleCallback();
      }
    }
  };
}

export const errorConsoleShortcut = ErrorConsoleShortcut.getInstance();

