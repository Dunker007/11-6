/**
 * Credential Vault - Secure credential storage with encryption
 * Stores API keys, OAuth tokens, and sensitive credentials
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '../foundation/logger';

export type CredentialType = 'api-key' | 'oauth-token' | 'webhook-secret' | 'password';

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  provider: string; // 'gemini', 'claude', 'stripe', etc.
  value: string; // Encrypted value
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface CredentialVaultState {
  credentials: Credential[];
  encryptionKey: string | null;

  // Actions
  initialize: () => Promise<void>;
  addCredential: (cred: Omit<Credential, 'id' | 'createdAt' | 'isActive'>) => Promise<string>;
  getCredential: (provider: string, type: CredentialType) => Credential | null;
  updateCredential: (id: string, updates: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;
  validateCredential: (provider: string) => Promise<boolean>;
  rotateEncryptionKey: () => Promise<void>;
}

// Simple XOR encryption for client-side storage (not production-grade, but better than plaintext)
// In production, consider using Web Crypto API with proper key derivation
function simpleEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encrypted: string, key: string): string {
  const decoded = atob(encrypted);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function generateEncryptionKey(): string {
  // Generate a random encryption key
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export const useCredentialVault = create<CredentialVaultState>()(
  persist(
    (set, get) => ({
      credentials: [],
      encryptionKey: null,

      initialize: async () => {
        logger.info('🔐 Initializing credential vault');

        let { encryptionKey } = get();

        if (!encryptionKey) {
          encryptionKey = generateEncryptionKey();
          set({ encryptionKey });
          logger.info('Generated new encryption key');
        }

        // Check for environment variables
        const envCreds: Array<Omit<Credential, 'id' | 'createdAt' | 'isActive'>> = [];

        // Check for Gemini API key
        if (import.meta.env.VITE_GEMINI_API_KEY) {
          envCreds.push({
            name: 'Gemini API Key (from env)',
            type: 'api-key',
            provider: 'gemini',
            value: import.meta.env.VITE_GEMINI_API_KEY,
            metadata: { source: 'env' }
          });
        }

        // Check for Claude API key
        if (import.meta.env.VITE_CLAUDE_API_KEY) {
          envCreds.push({
            name: 'Claude API Key (from env)',
            type: 'api-key',
            provider: 'claude',
            value: import.meta.env.VITE_CLAUDE_API_KEY,
            metadata: { source: 'env' }
          });
        }

        // Check for Stripe keys
        if (import.meta.env.VITE_STRIPE_SECRET_KEY) {
          envCreds.push({
            name: 'Stripe Secret Key (from env)',
            type: 'api-key',
            provider: 'stripe',
            value: import.meta.env.VITE_STRIPE_SECRET_KEY,
            metadata: { source: 'env' }
          });
        }

        // Add env credentials if they don't exist
        for (const cred of envCreds) {
          const existing = get().getCredential(cred.provider, cred.type);
          if (!existing) {
            await get().addCredential(cred);
            logger.info(`Added ${cred.provider} credential from environment`);
          }
        }

        logger.info(`✅ Credential vault initialized with ${get().credentials.length} credentials`);
      },

      addCredential: async (cred) => {
        const { encryptionKey } = get();

        if (!encryptionKey) {
          throw new Error('Encryption key not initialized');
        }

        const newCred: Credential = {
          ...cred,
          id: crypto.randomUUID(),
          value: simpleEncrypt(cred.value, encryptionKey),
          createdAt: new Date(),
          isActive: true,
        };

        set(state => ({
          credentials: [...state.credentials, newCred]
        }));

        logger.info(`Added credential: ${cred.provider}/${cred.type}`);
        return newCred.id;
      },

      getCredential: (provider, type) => {
        const { credentials, encryptionKey } = get();

        if (!encryptionKey) {
          logger.warn('Encryption key not initialized');
          return null;
        }

        const cred = credentials.find(
          c => c.provider === provider && c.type === type && c.isActive
        );

        if (!cred) {
          return null;
        }

        // Check if expired
        if (cred.expiresAt && new Date() > new Date(cred.expiresAt)) {
          logger.warn(`Credential expired: ${provider}/${type}`);
          return null;
        }

        // Decrypt and return
        return {
          ...cred,
          value: simpleDecrypt(cred.value, encryptionKey)
        };
      },

      updateCredential: (id, updates) => {
        const { encryptionKey } = get();

        set(state => ({
          credentials: state.credentials.map(c => {
            if (c.id !== id) return c;

            const updated = { ...c, ...updates };

            // Re-encrypt if value changed
            if (updates.value && encryptionKey) {
              updated.value = simpleEncrypt(updates.value, encryptionKey);
            }

            return updated;
          })
        }));

        logger.info(`Updated credential: ${id}`);
      },

      deleteCredential: (id) => {
        set(state => ({
          credentials: state.credentials.filter(c => c.id !== id)
        }));
        logger.info(`Deleted credential: ${id}`);
      },

      validateCredential: async (provider) => {
        const cred = get().getCredential(provider, 'api-key');

        if (!cred) {
          logger.warn(`No credential found for ${provider}`);
          return false;
        }

        // Provider-specific validation
        try {
          switch (provider) {
            case 'gemini':
              // Validate Gemini API key format
              return cred.value.startsWith('AIza') && cred.value.length > 30;

            case 'claude':
              // Validate Claude API key format
              return cred.value.startsWith('sk-ant-') && cred.value.length > 40;

            case 'stripe':
              // Validate Stripe key format
              return (cred.value.startsWith('sk_') || cred.value.startsWith('pk_'));

            default:
              return cred.value.length > 0;
          }
        } catch (error) {
          logger.error('Credential validation failed', { provider, error });
          return false;
        }
      },

      rotateEncryptionKey: async () => {
        const { credentials, encryptionKey } = get();

        if (!encryptionKey) {
          throw new Error('No encryption key to rotate');
        }

        logger.info('🔄 Rotating encryption key');

        // Decrypt all credentials with old key
        const decrypted = credentials.map(c => ({
          ...c,
          value: simpleDecrypt(c.value, encryptionKey)
        }));

        // Generate new key
        const newKey = generateEncryptionKey();

        // Re-encrypt with new key
        const reencrypted = decrypted.map(c => ({
          ...c,
          value: simpleEncrypt(c.value, newKey)
        }));

        set({
          credentials: reencrypted,
          encryptionKey: newKey
        });

        logger.info('✅ Encryption key rotated successfully');
      },
    }),
    {
      name: 'dlx-credential-vault',
      version: 1,
    }
  )
);
