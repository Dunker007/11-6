/**
 * OS Mode Manager
 * Manages the state of AI OS Mode toggle
 */

type OSModeListener = (isOSMode: boolean) => void;

class OSModeManager {
  private static instance: OSModeManager;
  private osMode: boolean = false;
  private listeners: Set<OSModeListener> = new Set();

  private constructor() {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('dlx-os-mode');
    if (saved !== null) {
      this.osMode = saved === 'true';
    }
  }

  static getInstance(): OSModeManager {
    if (!OSModeManager.instance) {
      OSModeManager.instance = new OSModeManager();
    }
    return OSModeManager.instance;
  }

  /**
   * Toggle OS Mode on/off
   */
  toggleOSMode(): void {
    this.osMode = !this.osMode;
    this.savePreference();
    this.notifyListeners();
  }

  /**
   * Set OS Mode explicitly
   */
  setOSMode(enabled: boolean): void {
    if (this.osMode !== enabled) {
      this.osMode = enabled;
      this.savePreference();
      this.notifyListeners();
    }
  }

  /**
   * Check if currently in OS Mode
   */
  isOSMode(): boolean {
    return this.osMode;
  }

  /**
   * Subscribe to OS Mode changes
   */
  subscribe(callback: OSModeListener): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Save preference to localStorage
   */
  private savePreference(): void {
    localStorage.setItem('dlx-os-mode', String(this.osMode));
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.osMode));
  }
}

export const osModeManager = OSModeManager.getInstance();

