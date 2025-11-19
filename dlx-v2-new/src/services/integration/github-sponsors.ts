/**
 * GitHub Sponsors Integration
 * Connect and sync GitHub Sponsors payments
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCredentialVault } from './credential-vault';
import { useRevenueStore } from '../revenue/revenue-engine';
import { toast } from '../../components/ui/Toast';
import { logger } from '../foundation/logger';

export interface GitHubSponsor {
  id: string;
  login: string;
  name: string;
  tier: {
    name: string;
    monthlyPriceInCents: number;
  };
  createdAt: Date;
  isOneTime: boolean;
}

export interface GitHubSponsorship {
  id: string;
  sponsor: GitHubSponsor;
  amount: number; // in cents
  createdAt: Date;
  isActive: boolean;
}

interface GitHubSponsorsState {
  isConnected: boolean;
  username: string | null;
  sponsorships: GitHubSponsorship[];
  isSyncing: boolean;
  lastSync: Date | null;

  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  syncSponsorships: () => Promise<void>;
  getActiveSponsorships: () => GitHubSponsorship[];
  getTotalMonthlyRevenue: () => number;
}

export const useGitHubSponsorsStore = create<GitHubSponsorsState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      username: null,
      sponsorships: [],
      isSyncing: false,
      lastSync: null,

      connect: async (token) => {
        try {
          // Verify token and get user info
          const response = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          if (!response.ok) {
            throw new Error('Invalid GitHub token');
          }

          const user = await response.json();

          // Store credential
          const vault = useCredentialVault.getState();
          await vault.addCredential({
            provider: 'github-sponsors',
            type: 'oauth-token',
            value: token,
            name: 'GitHub Sponsors Token',
          });

          set({
            isConnected: true,
            username: user.login,
          });

          logger.info('✅ GitHub Sponsors connected', { username: user.login });
          toast.success('GitHub Sponsors connected!', {
            description: `Connected as ${user.login}`,
          });

          // Initial sync
          await get().syncSponsorships();
        } catch (error) {
          logger.error('GitHub Sponsors connection failed', { error });
          toast.error('Connection failed', {
            description: 'Could not connect to GitHub Sponsors',
          });
          throw error;
        }
      },

      disconnect: () => {
        // Remove credential
        const vault = useCredentialVault.getState();
        const cred = vault.getCredential('github-sponsors', 'oauth-token');
        if (cred) {
          vault.deleteCredential(cred.id);
        }

        set({
          isConnected: false,
          username: null,
          sponsorships: [],
          lastSync: null,
        });

        logger.info('GitHub Sponsors disconnected');
        toast.info('GitHub Sponsors disconnected');
      },

      syncSponsorships: async () => {
        const { isConnected, sponsorships: existingSponsorships } = get();
        if (!isConnected) {
          logger.warn('Cannot sync: GitHub Sponsors not connected');
          return;
        }

        set({ isSyncing: true });

        try {
          const vault = useCredentialVault.getState();
          const token = vault.getCredential('github-sponsors', 'oauth-token');

          if (!token) {
            throw new Error('No GitHub token found');
          }

          // Fetch sponsorships using GraphQL API
          const query = `
            query {
              viewer {
                sponsorshipsAsMaintainer(first: 100, includePrivate: true) {
                  nodes {
                    id
                    createdAt
                    isActive
                    isOneTimePayment
                    tier {
                      name
                      monthlyPriceInCents
                    }
                    sponsor {
                      ... on User {
                        id
                        login
                        name
                      }
                    }
                  }
                }
              }
            }
          `;

          const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token.value}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch sponsorships');
          }

          const data = await response.json();
          const nodes = data.data?.viewer?.sponsorshipsAsMaintainer?.nodes || [];

          // Convert to our format
          const sponsorships: GitHubSponsorship[] = nodes.map((node: any) => ({
            id: node.id,
            sponsor: {
              id: node.sponsor.id,
              login: node.sponsor.login,
              name: node.sponsor.name || node.sponsor.login,
              tier: {
                name: node.tier.name,
                monthlyPriceInCents: node.tier.monthlyPriceInCents,
              },
              createdAt: new Date(node.createdAt),
              isOneTime: node.isOneTimePayment,
            },
            amount: node.tier.monthlyPriceInCents,
            createdAt: new Date(node.createdAt),
            isActive: node.isActive,
          }));

          set({
            sponsorships,
            lastSync: new Date(),
            isSyncing: false,
          });

          // Track new sponsorships as revenue
          const existingIds = new Set(existingSponsorships.map((s) => s.id));
          const { addStream } = useRevenueStore.getState();

          sponsorships.forEach((sponsorship) => {
            if (!existingIds.has(sponsorship.id) && sponsorship.isActive) {
              addStream({
                source: 'affiliate', // Using affiliate as closest category
                name: `GitHub Sponsor: ${sponsorship.sponsor.login}`,
                amount: sponsorship.amount,
                currency: 'USD',
                timestamp: sponsorship.createdAt,
                metadata: {
                  provider: 'github-sponsors',
                  sponsorLogin: sponsorship.sponsor.login,
                  tier: sponsorship.sponsor.tier.name,
                  isRecurring: !sponsorship.sponsor.isOneTime,
                },
              });
            }
          });

          const newCount = sponsorships.filter((s) => !existingIds.has(s.id)).length;
          if (newCount > 0) {
            toast.success(`Synced ${newCount} new sponsorships!`);
          }

          logger.info('✅ GitHub Sponsors synced', {
            total: sponsorships.length,
            new: newCount,
          });
        } catch (error) {
          logger.error('GitHub Sponsors sync failed', { error });
          toast.error('Sync failed', {
            description: 'Could not sync GitHub Sponsors',
          });
          set({ isSyncing: false });
        }
      },

      getActiveSponsorships: () => {
        return get().sponsorships.filter((s) => s.isActive);
      },

      getTotalMonthlyRevenue: () => {
        return get()
          .sponsorships.filter((s) => s.isActive && !s.sponsor.isOneTime)
          .reduce((sum, s) => sum + s.amount, 0);
      },
    }),
    {
      name: 'dlx-github-sponsors',
    }
  )
);
