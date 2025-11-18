/**
 * securityService.ts
 *
 * PURPOSE:
 * Security hardening and best practices implementation
 */

import CryptoJS from 'crypto-js';

export const securityService = {
  /**
   * Encrypt data with AES-256
   */
  encrypt(data: string, key?: string): string {
    const encryptionKey = key || this.getEncryptionKey();
    return CryptoJS.AES.encrypt(data, encryptionKey).toString();
  },

  /**
   * Decrypt data
   */
  decrypt(encryptedData: string, key?: string): string {
    const encryptionKey = key || this.getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  },

  /**
   * Get or generate encryption key
   */
  getEncryptionKey(): string {
    let key = localStorage.getItem('dlx-encryption-key');

    if (!key) {
      // Generate new key
      key = CryptoJS.lib.WordArray.random(256 / 8).toString();
      localStorage.setItem('dlx-encryption-key', key);
    }

    return key;
  },

  /**
   * Sanitize user input (prevent XSS)
   */
  sanitizeInput(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  /**
   * Validate API key format
   */
  validateAPIKey(key: string, service: string): boolean {
    const patterns: Record<string, RegExp> = {
      stripe: /^sk_(?:test|live)_[a-zA-Z0-9]{24,}$/,
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      // Add more service patterns
    };

    const pattern = patterns[service.toLowerCase()];
    return pattern ? pattern.test(key) : key.length > 10;
  },

  /**
   * Check for sensitive data in strings
   */
  containsSensitiveData(text: string): boolean {
    const sensitivePatterns = [
      /\b\d{16}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /sk_(?:test|live)_[a-zA-Z0-9]+/, // API keys
      /password\s*[:=]\s*\S+/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(text));
  },

  /**
   * Generate security score
   */
  getSecurityScore(): number {
    let score = 100;

    // Check encryption
    if (!localStorage.getItem('dlx-encryption-key')) {
      score -= 20;
    }

    // Check for plaintext credentials
    const credentials = localStorage.getItem('credentials');
    if (credentials && !credentials.includes('encrypted')) {
      score -= 30;
    }

    // Check HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      score -= 25;
    }

    // Check for updates
    const lastUpdate = localStorage.getItem('last-security-check');
    if (!lastUpdate || Date.now() - parseInt(lastUpdate) > 7 * 24 * 60 * 60 * 1000) {
      score -= 15;
    }

    return Math.max(0, score);
  },

  /**
   * Get security recommendations
   */
  getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];
    const score = this.getSecurityScore();

    if (score < 100) {
      if (!localStorage.getItem('dlx-encryption-key')) {
        recommendations.push('Enable encryption for sensitive data');
      }

      if (window.location.protocol !== 'https:') {
        recommendations.push('Use HTTPS for secure connections');
      }

      recommendations.push('Rotate your API keys regularly (every 90 days)');
      recommendations.push('Review third-party integrations');
      recommendations.push('Enable two-factor authentication where available');
    }

    return recommendations;
  },

  /**
   * Rate limiting check
   */
  checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const rateLimitKey = `rate-limit-${key}`;
    const now = Date.now();

    const requests = JSON.parse(localStorage.getItem(rateLimitKey) || '[]');
    const recentRequests = requests.filter((time: number) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    recentRequests.push(now);
    localStorage.setItem(rateLimitKey, JSON.stringify(recentRequests));
    return true;
  },
};
