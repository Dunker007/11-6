/**
 * Bolt.diy API Service
 * Handles communication with bolt.diy API for sending build packages
 */

import type { BoltBuildPackage } from '@/types/bolt';

interface BoltAPIResponse {
  success: boolean;
  buildId?: string;
  url?: string;
  error?: string;
  message?: string;
}

class BoltAPIService {
  private baseURL = 'https://api.bolt.diy'; // Placeholder - update with actual API URL
  private apiKey: string | null = null;

  /**
   * Set API key for bolt.diy
   */
  setAPIKey(key: string): void {
    this.apiKey = key;
    // Store in localStorage for persistence
    try {
      localStorage.setItem('bolt_diy_api_key', key);
    } catch (error) {
      console.warn('Failed to store API key:', error);
    }
  }

  /**
   * Get stored API key
   */
  getAPIKey(): string | null {
    if (this.apiKey) return this.apiKey;
    try {
      return localStorage.getItem('bolt_diy_api_key');
    } catch {
      return null;
    }
  }

  /**
   * Send build package to bolt.diy
   */
  async sendBuildPackage(buildPackage: BoltBuildPackage): Promise<BoltAPIResponse> {
    const apiKey = this.getAPIKey();
    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured. Please set your bolt.diy API key.',
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/builds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildPackage),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        buildId: data.buildId,
        url: data.url,
        message: data.message || 'Build package sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send build package',
      };
    }
  }

  /**
   * Check build status
   */
  async checkBuildStatus(buildId: string): Promise<{
    status: 'pending' | 'building' | 'completed' | 'failed';
    progress?: number;
    logs?: string[];
    url?: string;
  }> {
    const apiKey = this.getAPIKey();
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/builds/${buildId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: data.status,
        progress: data.progress,
        logs: data.logs,
        url: data.url,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to check build status'
      );
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = this.getAPIKey();
    if (!apiKey) {
      return {
        success: false,
        message: 'API key not configured',
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/health`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Connected to bolt.diy successfully',
        };
      } else {
        return {
          success: false,
          message: `Connection failed: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect',
      };
    }
  }
}

export const boltAPIService = new BoltAPIService();

