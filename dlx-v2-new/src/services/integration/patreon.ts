/**
 * Patreon Integration
 * Connect and sync Patreon pledges
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCredentialVault } from './credential-vault';
import { useRevenueStore } from '../revenue/revenue-engine';
import { toast } from '../../components/ui/Toast';
import { logger } from '../foundation/logger';

export interface PatreonPledge {
  id: string;
  patronName: string;
  amount: number; // in cents
  tier: string;
  since: Date;
  isActive: boolean;
}

interface PatreonState {
  isConnected: boolean;
  creatorName: string | null;
  pledges: PatreonPledge[];
  isSyncing: boolean;
  lastSync: Date | null;

  connect: (accessToken: string) => Promise<void>;
  disconnect: () => void;
  syncPledges: () => Promise<void>;
  getActivePledges: () => PatreonPledge[];
  getTotalMonthlyRevenue: () => number;
}

export const usePatreonStore = create<PatreonState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      creatorName: null,
      pledges: [],
      isSyncing: false,
      lastSync: null,

      connect: async (accessToken) => {
        try {
          // Verify token and get creator info
          const response = await fetch('https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields%5Buser%5D=full_name', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Invalid Patreon token');
          }

          const data = await response.json();
          const creator = data.data;

          // Store credential
          const vault = useCredentialVault.getState();
          await vault.addCredential({
            provider: 'patreon',
            type: 'oauth-token',
            value: accessToken,
            name: 'Patreon Access Token',
          });

          set({
            isConnected: true,
            creatorName: creator.attributes.full_name,
          });

          logger.info('✅ Patreon connected', { creator: creator.attributes.full_name });
          toast.success('Patreon connected!', {
            description: `Connected as ${creator.attributes.full_name}`,
          });

          // Initial sync
          await get().syncPledges();
        } catch (error) {
          logger.error('Patreon connection failed', { error });
          toast.error('Connection failed', {
            description: 'Could not connect to Patreon',
          });
          throw error;
        }
      },

      disconnect: () => {
        const vault = useCredentialVault.getState();
        const cred = vault.getCredential('patreon', 'oauth-token');
        if (cred) {
          vault.deleteCredential(cred.id);
        }

        set({
          isConnected: false,
          creatorName: null,
          pledges: [],
          lastSync: null,
        });

        logger.info('Patreon disconnected');
        toast.info('Patreon disconnected');
      },

      syncPledges: async () => {
        const { isConnected, pledges: existingPledges } = get();
        if (!isConnected) {
          logger.warn('Cannot sync: Patreon not connected');
          return;
        }

        set({ isSyncing: true });

        try {
          const vault = useCredentialVault.getState();
          const token = vault.getCredential('patreon', 'oauth-token');

          if (!token) {
            throw new Error('No Patreon token found');
          }

          // Fetch members
          const response = await fetch('https://www.patreon.com/api/oauth2/v2/campaigns?include=members&fields%5Bmember%5D=full_name,currently_entitled_amount_cents,patron_status,pledge_relationship_start', {
            headers: {
              Authorization: `Bearer ${token.value}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch Patreon members');
          }

          const data = await response.json();
          const members = data.included?.filter((item: any) => item.type === 'member') || [];

          // Convert to our format
          const pledges: PatreonPledge[] = members.map((member: any) => ({
            id: member.id,
            patronName: member.attributes.full_name || 'Anonymous',
            amount: member.attributes.currently_entitled_amount_cents || 0,
            tier: member.attributes.patron_status,
            since: new Date(member.attributes.pledge_relationship_start),
            isActive: member.attributes.patron_status === 'active_patron',
          }));

          set({
            pledges,
            lastSync: new Date(),
            isSyncing: false,
          });

          // Track new pledges as revenue
          const existingIds = new Set(existingPledges.map((p) => p.id));
          const { addStream } = useRevenueStore.getState();

          pledges.forEach((pledge) => {
            if (!existingIds.has(pledge.id) && pledge.isActive && pledge.amount > 0) {
              addStream({
                source: 'affiliate',
                name: `Patreon: ${pledge.patronName}`,
                amount: pledge.amount,
                currency: 'USD',
                timestamp: pledge.since,
                metadata: {
                  provider: 'patreon',
                  patronName: pledge.patronName,
                  tier: pledge.tier,
                  isRecurring: true,
                },
              });
            }
          });

          const newCount = pledges.filter((p) => !existingIds.has(p.id)).length;
          if (newCount > 0) {
            toast.success(`Synced ${newCount} new Patreon pledges!`);
          }

          logger.info('✅ Patreon synced', {
            total: pledges.length,
            new: newCount,
          });
        } catch (error) {
          logger.error('Patreon sync failed', { error });
          toast.error('Sync failed', {
            description: 'Could not sync Patreon',
          });
          set({ isSyncing: false });
        }
      },

      getActivePledges: () => {
        return get().pledges.filter((p) => p.isActive);
      },

      getTotalMonthlyRevenue: () => {
        return get()
          .pledges.filter((p) => p.isActive)
          .reduce((sum, p) => sum + p.amount, 0);
      },
    }),
    {
      name: 'dlx-patreon',
    }
  )
);
