/**
 * Ko-fi Integration
 * Connect and sync Ko-fi donations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCredentialVault } from './credential-vault';
import { useRevenueStore } from '../revenue/revenue-engine';
import { toast } from '../../components/ui/Toast';
import { logger } from '../foundation/logger';

export interface KofiDonation {
  id: string;
  from: string;
  message: string;
  amount: number; // in cents
  isRecurring: boolean;
  timestamp: Date;
}

interface KofiState {
  isConnected: boolean;
  username: string | null;
  donations: KofiDonation[];
  isSyncing: boolean;
  lastSync: Date | null;
  webhookUrl: string | null;

  connect: (pageId: string, verificationToken: string) => Promise<void>;
  disconnect: () => void;
  syncDonations: () => Promise<void>;
  handleWebhook: (data: any) => void;
  getTotalRevenue: () => number;
  getRecurringRevenue: () => number;
}

export const useKofiStore = create<KofiState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      username: null,
      donations: [],
      isSyncing: false,
      lastSync: null,
      webhookUrl: null,

      connect: async (pageId, verificationToken) => {
        try {
          // Store credentials
          const vault = useCredentialVault.getState();
          await vault.addCredential({
            provider: 'kofi',
            type: 'api-key',
            value: verificationToken,
            name: 'Ko-fi Verification Token',
          });

          // Generate webhook URL
          const webhookUrl = `${window.location.origin}/api/kofi/webhook`;

          set({
            isConnected: true,
            username: pageId,
            webhookUrl,
          });

          logger.info('✅ Ko-fi connected', { pageId });
          toast.success('Ko-fi connected!', {
            description: `Connected Ko-fi page: ${pageId}`,
          });

          // Ko-fi doesn't have a public API, so we rely on webhooks
          toast.info('Configure Ko-fi webhook', {
            description: `Set webhook URL to: ${webhookUrl}`,
          });
        } catch (error) {
          logger.error('Ko-fi connection failed', { error });
          toast.error('Connection failed', {
            description: 'Could not connect to Ko-fi',
          });
          throw error;
        }
      },

      disconnect: () => {
        const vault = useCredentialVault.getState();
        const cred = vault.getCredential('kofi', 'api-key');
        if (cred) {
          vault.deleteCredential(cred.id);
        }

        set({
          isConnected: false,
          username: null,
          donations: [],
          lastSync: null,
          webhookUrl: null,
        });

        logger.info('Ko-fi disconnected');
        toast.info('Ko-fi disconnected');
      },

      syncDonations: async () => {
        // Ko-fi doesn't have a public API
        // Donations are synced via webhooks only
        logger.info('Ko-fi uses webhook-only sync');
        set({ lastSync: new Date() });
      },

      handleWebhook: (data) => {
        try {
          // Verify webhook data
          const vault = useCredentialVault.getState();
          const token = vault.getCredential('kofi', 'api-key');

          if (!token || data.verification_token !== token.value) {
            logger.warn('Ko-fi webhook verification failed');
            return;
          }

          // Parse donation
          const donation: KofiDonation = {
            id: data.kofi_transaction_id,
            from: data.from_name,
            message: data.message || '',
            amount: Math.round(parseFloat(data.amount) * 100), // Convert to cents
            isRecurring: data.type === 'Subscription',
            timestamp: new Date(data.timestamp),
          };

          // Add to donations
          set((state) => ({
            donations: [...state.donations, donation],
          }));

          // Track as revenue
          const { addStream } = useRevenueStore.getState();
          addStream({
            source: 'affiliate',
            name: `Ko-fi: ${donation.from}`,
            amount: donation.amount,
            currency: 'USD',
            timestamp: donation.timestamp,
            metadata: {
              provider: 'kofi',
              from: donation.from,
              message: donation.message,
              isRecurring: donation.isRecurring,
            },
          });

          logger.info('✅ Ko-fi donation received', {
            from: donation.from,
            amount: donation.amount,
          });

          toast.success('New Ko-fi donation!', {
            description: `${donation.from} donated $${(donation.amount / 100).toFixed(2)}`,
          });
        } catch (error) {
          logger.error('Ko-fi webhook processing failed', { error });
        }
      },

      getTotalRevenue: () => {
        return get().donations.reduce((sum, d) => sum + d.amount, 0);
      },

      getRecurringRevenue: () => {
        return get()
          .donations.filter((d) => d.isRecurring)
          .reduce((sum, d) => sum + d.amount, 0);
      },
    }),
    {
      name: 'dlx-kofi',
    }
  )
);
