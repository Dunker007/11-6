/**
 * Integration Hub
 * Central hub for managing all revenue integrations
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Check,
  Link2,
  CreditCard,
  Github,
  Heart,
  Coffee,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useStripeConnector } from '../../services/integration/stripe-connector';
import { useGitHubSponsorsStore } from '../../services/integration/github-sponsors';
import { usePatreonStore } from '../../services/integration/patreon';
import { useKofiStore } from '../../services/integration/kofi';
import { formatCurrency } from '../../services/revenue/revenue-engine';

interface IntegrationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: typeof CreditCard;
  color: string;
  isConnected: boolean;
  revenue?: number;
  onConnect: () => void;
  onDisconnect: () => void;
  isSyncing?: boolean;
  lastSync?: Date | null;
}

export function IntegrationHub({ isOpen, onClose }: IntegrationHubProps) {
  const stripe = useStripeConnector();
  const github = useGitHubSponsorsStore();
  const patreon = usePatreonStore();
  const kofi = useKofiStore();

  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);

  const integrations: Integration[] = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept payments and track revenue automatically',
      icon: CreditCard,
      color: '#635bff',
      isConnected: !!stripe.account?.connected,
      revenue: stripe.totalEarned,
      onConnect: () => setShowConnectModal('stripe'),
      onDisconnect: stripe.disconnect,
      isSyncing: stripe.isSyncing,
      lastSync: stripe.account?.lastSync,
    },
    {
      id: 'github-sponsors',
      name: 'GitHub Sponsors',
      description: 'Sync sponsorships from GitHub',
      icon: Github,
      color: '#24292e',
      isConnected: github.isConnected,
      revenue: github.getTotalMonthlyRevenue(),
      onConnect: () => setShowConnectModal('github-sponsors'),
      onDisconnect: github.disconnect,
      isSyncing: github.isSyncing,
      lastSync: github.lastSync,
    },
    {
      id: 'patreon',
      name: 'Patreon',
      description: 'Track pledges and memberships',
      icon: Heart,
      color: '#ff424d',
      isConnected: patreon.isConnected,
      revenue: patreon.getTotalMonthlyRevenue(),
      onConnect: () => setShowConnectModal('patreon'),
      onDisconnect: patreon.disconnect,
      isSyncing: patreon.isSyncing,
      lastSync: patreon.lastSync,
    },
    {
      id: 'kofi',
      name: 'Ko-fi',
      description: 'Receive donations and tips',
      icon: Coffee,
      color: '#ff5e5b',
      isConnected: kofi.isConnected,
      revenue: kofi.getTotalRevenue(),
      onConnect: () => setShowConnectModal('kofi'),
      onDisconnect: kofi.disconnect,
      lastSync: kofi.lastSync,
    },
  ];

  const connectedIntegrations = integrations.filter((i) => i.isConnected);
  const totalRevenue = integrations.reduce((sum, i) => sum + (i.revenue || 0), 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[85vh] bg-cyber-darker border border-cyber-primary/30 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cyber-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-primary/20 rounded-lg">
                <Link2 className="w-6 h-6 text-cyber-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-text">Integration Hub</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {connectedIntegrations.length} connected • {formatCurrency(totalRevenue)} total revenue
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-cyber-dark rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                />
              ))}
            </div>

            {/* Coming Soon */}
            <div className="mt-8 p-6 bg-cyber-dark/30 border border-cyber-primary/10 rounded-lg">
              <h3 className="text-lg font-bold mb-3">Coming Soon</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-400">
                <div>🛍️ Gumroad</div>
                <div>📦 Shopify</div>
                <div>💼 Buy Me a Coffee</div>
                <div>🎨 Creative Market</div>
                <div>📱 App Store Connect</div>
                <div>🎮 Steam</div>
                <div>🎵 Bandcamp</div>
                <div>📚 Leanpub</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connect Modals */}
        {showConnectModal && (
          <ConnectModal
            integration={integrations.find((i) => i.id === showConnectModal)!}
            onClose={() => setShowConnectModal(null)}
          />
        )}
      </div>
    </AnimatePresence>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const Icon = integration.icon;

  return (
    <div className="revenue-card hover:border-cyber-primary/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${integration.color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color: integration.color }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {integration.name}
              {integration.isConnected && (
                <span className="flex items-center gap-1 text-xs text-green-500 font-normal">
                  <Check className="w-4 h-4" />
                  Connected
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-400">{integration.description}</p>
          </div>
        </div>
      </div>

      {integration.isConnected && (
        <div className="space-y-3 mb-4">
          {integration.revenue !== undefined && integration.revenue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Revenue</span>
              <span className="font-bold text-cyber-primary">
                {formatCurrency(integration.revenue)}
              </span>
            </div>
          )}
          {integration.lastSync && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Last sync</span>
              <span>{new Date(integration.lastSync).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {integration.isConnected ? (
          <>
            <button
              onClick={integration.onDisconnect}
              className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
            >
              Disconnect
            </button>
            {integration.isSyncing !== undefined && (
              <button
                disabled={integration.isSyncing}
                className="px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg hover:bg-cyber-dark/80 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {integration.isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={integration.onConnect}
            className="flex-1 px-4 py-2 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

function ConnectModal({
  integration,
  onClose,
}: {
  integration: Integration;
  onClose: () => void;
}) {
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const stripe = useStripeConnector();
  const github = useGitHubSponsorsStore();
  const patreon = usePatreonStore();
  const kofi = useKofiStore();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      switch (integration.id) {
        case 'stripe':
          await stripe.connect();
          break;
        case 'github-sponsors':
          await github.connect(token);
          break;
        case 'patreon':
          await patreon.connect(token);
          break;
        case 'kofi':
          const [pageId, verificationToken] = token.split(':');
          await kofi.connect(pageId, verificationToken);
          break;
      }
      onClose();
    } catch (error) {
      // Error already handled in stores
    } finally {
      setIsConnecting(false);
    }
  };

  const getInstructions = () => {
    switch (integration.id) {
      case 'stripe':
        return {
          title: 'Connect Stripe',
          instructions: [
            '1. Go to your Stripe Dashboard',
            '2. Navigate to Developers → API Keys',
            '3. Copy your Secret Key (starts with sk_)',
            '4. Paste it below',
          ],
          placeholder: 'sk_live_...',
          docsUrl: 'https://stripe.com/docs/keys',
        };
      case 'github-sponsors':
        return {
          title: 'Connect GitHub Sponsors',
          instructions: [
            '1. Go to GitHub Settings → Developer settings → Personal access tokens',
            '2. Generate a new token with "read:user" and "read:org" scopes',
            '3. Copy the token',
            '4. Paste it below',
          ],
          placeholder: 'ghp_...',
          docsUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
        };
      case 'patreon':
        return {
          title: 'Connect Patreon',
          instructions: [
            '1. Go to Patreon Creator Portal',
            '2. Navigate to Settings → Webhooks & API',
            '3. Create an OAuth Client',
            '4. Copy your Access Token',
            '5. Paste it below',
          ],
          placeholder: 'Access Token',
          docsUrl: 'https://www.patreon.com/portal/registration/register-clients',
        };
      case 'kofi':
        return {
          title: 'Connect Ko-fi',
          instructions: [
            '1. Go to Ko-fi Settings → Webhooks',
            '2. Copy your Page ID and Verification Token',
            '3. Enter them below in format: PAGE_ID:TOKEN',
          ],
          placeholder: 'yourpage:verification_token',
          docsUrl: 'https://ko-fi.com/manage/webhooks',
        };
      default:
        return null;
    }
  };

  const instructions = getInstructions();
  if (!instructions) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-cyber-darker border border-cyber-primary/30 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold gradient-text mb-4">{instructions.title}</h3>

        <div className="space-y-4 mb-6">
          <div className="bg-cyber-dark/30 p-4 rounded-lg">
            {instructions.instructions.map((instruction, i) => (
              <p key={i} className="text-sm text-gray-300 mb-2 last:mb-0">
                {instruction}
              </p>
            ))}
          </div>

          <a
            href={instructions.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-cyber-primary hover:underline"
          >
            View documentation
            <ExternalLink className="w-4 h-4" />
          </a>

          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={instructions.placeholder}
            className="w-full px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="flex-1 px-4 py-2 bg-cyber-dark border border-cyber-primary/30 rounded-lg hover:bg-cyber-dark/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={!token || isConnecting}
            className="flex-1 px-4 py-2 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
