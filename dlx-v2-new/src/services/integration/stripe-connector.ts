/**
 * Stripe Connector
 * Stripe OAuth and webhook handling
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useRevenueStore } from '../revenue/revenue-engine';
import { useCredentialVault } from './credential-vault';
import { logger } from '../foundation/logger';
import { toast } from '../../components/ui/Toast';

export interface StripeAccount {
  id: string;
  name: string;
  email: string;
  connected: boolean;
  connectedAt?: Date;
  lastSync?: Date;
}

export interface StripePayment {
  id: string;
  amount: number; // cents
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  customer?: string;
  description?: string;
  createdAt: Date;
}

export interface StripeConnectorState {
  account: StripeAccount | null;
  isConnecting: boolean;
  isSyncing: boolean;
  lastPayments: StripePayment[];
  totalEarned: number; // cents

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  syncPayments: () => Promise<void>;
  handleWebhook: (event: any) => void;
}

export const useStripeConnector = create<StripeConnectorState>()(
  persist(
    (set, get) => ({
      account: null,
      isConnecting: false,
      isSyncing: false,
      lastPayments: [],
      totalEarned: 0,

      connect: async () => {
        set({ isConnecting: true });
        logger.info('🔗 Connecting Stripe account');

        try {
          // In a real app, this would initiate Stripe OAuth flow
          // For now, check if we have API keys in credential vault
          const vault = useCredentialVault.getState();
          const stripeKey = vault.getCredential('stripe', 'api-key');

          if (!stripeKey) {
            // Open Stripe OAuth (in real app)
            const clientId = import.meta.env.VITE_STRIPE_CLIENT_ID;

            if (clientId) {
              const redirectUri = encodeURIComponent(`${window.location.origin}/stripe/callback`);
              const stripeOAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${redirectUri}`;

              window.location.href = stripeOAuthUrl;
            } else {
              throw new Error('Stripe not configured. Add VITE_STRIPE_SECRET_KEY to .env');
            }
            return;
          }

          // Simulate connection (in real app, verify API key)
          const account: StripeAccount = {
            id: 'acct_demo',
            name: 'Demo Account',
            email: 'demo@example.com',
            connected: true,
            connectedAt: new Date(),
          };

          set({ account });
          logger.info('✅ Stripe connected', { accountId: account.id });
          toast.success('Stripe connected!', { description: account.email });

          // Initial sync
          await get().syncPayments();
        } catch (error) {
          logger.error('Stripe connection failed', { error });
          toast.error('Connection failed', { description: String(error) });
          throw error;
        } finally {
          set({ isConnecting: false });
        }
      },

      disconnect: () => {
        set({ account: null, lastPayments: [] });
        logger.info('Stripe disconnected');
        toast.info('Stripe disconnected');
      },

      syncPayments: async () => {
        const { account } = get();

        if (!account) {
          throw new Error('No Stripe account connected');
        }

        set({ isSyncing: true });
        logger.info('🔄 Syncing Stripe payments');

        try {
          const vault = useCredentialVault.getState();
          const stripeKey = vault.getCredential('stripe', 'api-key');

          if (!stripeKey) {
            throw new Error('Stripe API key not found');
          }

          // In real app, fetch from Stripe API
          // For now, simulate with demo data
          const payments = await fetchStripePayments(stripeKey.value);

          // Track new payments as revenue
          const { addStream } = useRevenueStore.getState();
          const existingIds = new Set(get().lastPayments.map(p => p.id));

          for (const payment of payments) {
            if (!existingIds.has(payment.id) && payment.status === 'succeeded') {
              addStream({
                source: 'stripe',
                name: payment.description || 'Stripe payment',
                amount: payment.amount,
                currency: payment.currency,
                timestamp: payment.createdAt,
                metadata: {
                  stripePaymentId: payment.id,
                  customer: payment.customer,
                },
              });
            }
          }

          const totalEarned = payments
            .filter(p => p.status === 'succeeded')
            .reduce((sum, p) => sum + p.amount, 0);

          set({
            lastPayments: payments,
            totalEarned,
            account: { ...account, lastSync: new Date() },
          });

          logger.info(`✅ Synced ${payments.length} Stripe payments`, { totalEarned });
          toast.success('Payments synced', { description: `${payments.length} payments` });
        } catch (error) {
          logger.error('Stripe sync failed', { error });
          toast.error('Sync failed', { description: String(error) });
          throw error;
        } finally {
          set({ isSyncing: false });
        }
      },

      handleWebhook: (event) => {
        logger.info('📥 Stripe webhook received', { type: event.type });

        switch (event.type) {
          case 'payment_intent.succeeded':
            handlePaymentSuccess(event.data.object);
            break;
          case 'charge.succeeded':
            handlePaymentSuccess(event.data.object);
            break;
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
            handleSubscriptionChange(event.data.object);
            break;
          default:
            logger.info('Unhandled webhook event', { type: event.type });
        }
      },
    }),
    {
      name: 'dlx-stripe',
      version: 1,
    }
  )
);

// Helper functions

async function fetchStripePayments(_apiKey: string): Promise<StripePayment[]> {
  // In real app, call Stripe API:
  // const response = await fetch('https://api.stripe.com/v1/charges', {
  //   headers: { Authorization: `Bearer ${_apiKey}` },
  // });

  // For demo, return mock data
  logger.info('Fetching Stripe payments (demo mode)');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return [
    {
      id: 'ch_demo_1',
      amount: 2999, // $29.99
      currency: 'usd',
      status: 'succeeded',
      description: 'Monthly subscription',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: 'ch_demo_2',
      amount: 4999, // $49.99
      currency: 'usd',
      status: 'succeeded',
      description: 'Product purchase',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  ];
}

function handlePaymentSuccess(payment: any) {
  const { addStream } = useRevenueStore.getState();

  addStream({
    source: 'stripe',
    name: payment.description || 'Stripe payment',
    amount: payment.amount,
    currency: payment.currency,
    timestamp: new Date(payment.created * 1000),
    metadata: {
      stripePaymentId: payment.id,
      customer: payment.customer,
    },
  });

  toast.success('Payment received!', {
    description: `$${(payment.amount / 100).toFixed(2)} via Stripe`,
  });

  logger.info('💰 Stripe payment processed', { amount: payment.amount });
}

function handleSubscriptionChange(subscription: any) {
  logger.info('Subscription updated', {
    id: subscription.id,
    status: subscription.status,
  });

  if (subscription.status === 'active') {
    toast.success('Subscription active', {
      description: `Recurring revenue: $${(subscription.plan.amount / 100).toFixed(2)}/${subscription.plan.interval}`,
    });
  }
}
