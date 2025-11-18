/**
 * Encryption Service
 *
 * PURPOSE:
 * Provides secure AES-256-GCM encryption for sensitive data.
 * Uses Web Crypto API for browser-native cryptography.
 *
 * SECURITY:
 * - AES-256-GCM (authenticated encryption)
 * - PBKDF2 key derivation (100,000 iterations)
 * - Random IV per encryption
 * - Random salt for key derivation
 * - No hardcoded keys
 *
 * USAGE:
 * ```typescript
 * import { encryptionService } from '@/services/security/encryptionService';
 *
 * // Encrypt
 * const encrypted = await encryptionService.encrypt('my secret data');
 * // Returns: base64-encoded JSON with { iv, salt, data }
 *
 * // Decrypt
 * const decrypted = await encryptionService.decrypt(encrypted);
 * // Returns: 'my secret data'
 * ```
 */

import { logger } from '../logging/loggerService';

export interface EncryptedData {
  iv: number[];           // Initialization vector (12 bytes)
  salt: number[];         // Salt for key derivation (16 bytes)
  data: number[];         // Encrypted data (ciphertext)
  version: number;        // Encryption version (for future migrations)
}

/**
 * Encryption Service
 * Secure encryption using Web Crypto API
 */
class EncryptionService {
  private readonly KEY_DERIVATION_ITERATIONS = 100000; // PBKDF2 iterations
  private readonly ENCRYPTION_VERSION = 1;
  private masterKey: CryptoKey | null = null;
  private keyCache = new Map<string, CryptoKey>();

  /**
   * Initialize encryption service
   * Generates or loads master key
   */
  async initialize(): Promise<void> {
    try {
      // Check if we have a stored key derivation password
      let password = this.getStoredPassword();

      if (!password) {
        // First time setup - generate a secure random password
        password = this.generateSecurePassword();
        this.storePassword(password);
        logger.info('Generated new encryption master password');
      }

      // Derive master key from password
      this.masterKey = await this.deriveKeyFromPassword(password);
      logger.info('Encryption service initialized');
    } catch (error) {
      logger.error('Failed to initialize encryption service', { error });
      throw new Error('Encryption initialization failed');
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(data: string): Promise<string> {
    if (!this.masterKey) {
      await this.initialize();
    }

    try {
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Generate random salt for this encryption
      const salt = crypto.getRandomValues(new Uint8Array(16));

      // Derive a unique key for this encryption using the salt
      const key = await this.deriveKey(this.masterKey!, salt);

      // Encode string to bytes
      const encoded = new TextEncoder().encode(data);

      // Encrypt with AES-GCM
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encoded
      );

      // Package encrypted data
      const encryptedData: EncryptedData = {
        iv: Array.from(iv),
        salt: Array.from(salt),
        data: Array.from(new Uint8Array(ciphertext)),
        version: this.ENCRYPTION_VERSION,
      };

      // Return as base64-encoded JSON
      return btoa(JSON.stringify(encryptedData));
    } catch (error) {
      logger.error('Encryption failed', { error });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   */
  async decrypt(encryptedString: string): Promise<string> {
    if (!this.masterKey) {
      await this.initialize();
    }

    try {
      // Decode from base64
      const encryptedData: EncryptedData = JSON.parse(atob(encryptedString));

      // Validate version
      if (encryptedData.version !== this.ENCRYPTION_VERSION) {
        throw new Error(`Unsupported encryption version: ${encryptedData.version}`);
      }

      // Reconstruct Uint8Arrays
      const iv = new Uint8Array(encryptedData.iv);
      const salt = new Uint8Array(encryptedData.salt);
      const ciphertext = new Uint8Array(encryptedData.data);

      // Derive the same key using the stored salt
      const key = await this.deriveKey(this.masterKey!, salt);

      // Decrypt with AES-GCM
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        ciphertext
      );

      // Decode bytes to string
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logger.error('Decryption failed', { error });
      throw new Error('Failed to decrypt data - data may be corrupted or key is wrong');
    }
  }

  /**
   * Check if data is encrypted (vs plaintext)
   */
  isEncrypted(data: string): boolean {
    try {
      const parsed = JSON.parse(atob(data));
      return parsed.iv && parsed.salt && parsed.data && parsed.version;
    } catch {
      return false;
    }
  }

  /**
   * Migrate plaintext data to encrypted format
   */
  async migratePlaintext(plaintext: string): Promise<string> {
    logger.info('Migrating plaintext data to encrypted format');
    return await this.encrypt(plaintext);
  }

  /**
   * Derive an encryption key from the master key using a salt
   * This allows each piece of data to have a unique key
   */
  private async deriveKey(masterKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
    // Use HKDF to derive a key from master key + salt
    const saltKey = `${Array.from(salt).join(',')}`;

    // Check cache
    if (this.keyCache.has(saltKey)) {
      return this.keyCache.get(saltKey)!;
    }

    // Import master key material for HKDF
    const keyMaterial = await crypto.subtle.exportKey('raw', masterKey);

    // Derive new key using PBKDF2 with salt
    const baseKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.KEY_DERIVATION_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // Not extractable
      ['encrypt', 'decrypt']
    );

    // Cache for performance
    this.keyCache.set(saltKey, derivedKey);

    return derivedKey;
  }

  /**
   * Derive master key from password using PBKDF2
   */
  private async deriveKeyFromPassword(password: string): Promise<CryptoKey> {
    // Get or generate salt for password derivation
    let passwordSalt = this.getPasswordSalt();
    if (!passwordSalt) {
      passwordSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
      this.storePasswordSalt(passwordSalt);
    }

    // Import password as key material
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive master key
    const masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(passwordSalt),
        iterations: this.KEY_DERIVATION_ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // Not extractable
      ['encrypt', 'decrypt']
    );

    return masterKey;
  }

  /**
   * Generate a secure random password for encryption
   */
  private generateSecurePassword(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store encryption password in localStorage
   * NOTE: This is still not ideal for production - consider using:
   * - User-entered password (derive key from user's password)
   * - Hardware security module (HSM)
   * - Operating system keychain
   */
  private storePassword(password: string): void {
    try {
      localStorage.setItem('dlx-encryption-password', password);
    } catch (error) {
      logger.error('Failed to store encryption password', { error });
      throw new Error('Cannot store encryption password');
    }
  }

  /**
   * Get stored encryption password
   */
  private getStoredPassword(): string | null {
    try {
      return localStorage.getItem('dlx-encryption-password');
    } catch (error) {
      logger.error('Failed to get encryption password', { error });
      return null;
    }
  }

  /**
   * Store password derivation salt
   */
  private storePasswordSalt(salt: number[]): void {
    try {
      localStorage.setItem('dlx-password-salt', JSON.stringify(salt));
    } catch (error) {
      logger.error('Failed to store password salt', { error });
    }
  }

  /**
   * Get password derivation salt
   */
  private getPasswordSalt(): number[] | null {
    try {
      const stored = localStorage.getItem('dlx-password-salt');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error('Failed to get password salt', { error });
      return null;
    }
  }

  /**
   * Clear all encryption keys and passwords
   * WARNING: This will make all encrypted data unrecoverable!
   */
  clearKeys(): void {
    this.masterKey = null;
    this.keyCache.clear();
    localStorage.removeItem('dlx-encryption-password');
    localStorage.removeItem('dlx-password-salt');
    logger.warn('All encryption keys cleared - encrypted data is now unrecoverable');
  }

  /**
   * Re-encrypt data with a new password
   * Useful for password rotation
   */
  async reEncrypt(encryptedData: string, newPassword: string): Promise<string> {
    // Decrypt with old key
    const plaintext = await this.decrypt(encryptedData);

    // Generate new master key from new password
    const oldMasterKey = this.masterKey;
    this.masterKey = await this.deriveKeyFromPassword(newPassword);

    // Encrypt with new key
    const reEncrypted = await this.encrypt(plaintext);

    // Restore old master key (in case of error)
    this.masterKey = oldMasterKey;

    return reEncrypted;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Export for type checking
export type { EncryptionService };
