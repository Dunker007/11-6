import type { EdStatus, ItorStatus } from '@/types/agents';

/**
 * Agent Asset Loader
 * Loads agent images with fallback to placeholders
 * Ready for asset swap when images are provided
 */

/**
 * Load Ed asset for a given status
 * Returns asset path if available, null if placeholder should be used
 */
export function loadEdAsset(status: EdStatus): string | null {
  try {
    // Try to load asset
    // const assetPath = `${ED_ASSET_BASE}/${status}.png`;
    
    // In production, we'd check if the file exists
    // For now, return null to use placeholder
    // When images are added, this will return the path
    return null; // Placeholder mode
    
    // Uncomment when assets are ready:
    // return assetPath;
  } catch (error) {
    console.warn(`Failed to load Ed asset for status: ${status}`, error);
    return null;
  }
}

/**
 * Load Itor asset for a given status
 * Returns asset path if available, null if placeholder should be used
 */
export function loadItorAsset(status: ItorStatus): string | null {
  try {
    // Try to load asset
    // const assetPath = `${ITOR_ASSET_BASE}/${status}.png`;
    
    // In production, we'd check if the file exists
    // For now, return null to use placeholder
    // When images are added, this will return the path
    return null; // Placeholder mode
    
    // Uncomment when assets are ready:
    // return assetPath;
  } catch (error) {
    console.warn(`Failed to load Itor asset for status: ${status}`, error);
    return null;
  }
}

/**
 * Preload all agent assets for smooth transitions
 */
export async function preloadAgentAssets(): Promise<void> {
  const edStatuses: EdStatus[] = ['idle', 'thinking', 'coding', 'refining', 'success', 'error'];
  const itorStatuses: ItorStatus[] = ['idle', 'scanning', 'reviewing', 'alert', 'approved', 'error'];

  const preloadPromises: Promise<void>[] = [];

  edStatuses.forEach(status => {
    const path = loadEdAsset(status);
    if (path) {
      const img = new Image();
      preloadPromises.push(
        new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if asset fails
          img.src = path;
        })
      );
    }
  });

  itorStatuses.forEach(status => {
    const path = loadItorAsset(status);
    if (path) {
      const img = new Image();
      preloadPromises.push(
        new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if asset fails
          img.src = path;
        })
      );
    }
  });

  await Promise.all(preloadPromises);
}

