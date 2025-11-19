/**
 * Settings Panel
 * Central configuration for all DLX v2 features
 */

import { useState } from 'react';
import { X, Key, Bell, Zap, Download, Trash2, RotateCw, Settings as SettingsIcon } from 'lucide-react';
import { useCredentialVault } from '../../services/integration/credential-vault';
import { useAlertStore } from '../../services/revenue/alert-system';
import { useIdleCompute } from '../../services/automation/idle-compute';
import { useContentPipeline } from '../../services/automation/content-pipeline';
import { useRevenueStore } from '../../services/revenue/revenue-engine';
import { toast } from '../ui/Toast';
import { logger } from '../../services/foundation/logger';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'credentials' | 'alerts' | 'automation' | 'data';

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('credentials');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[80vh] bg-cyber-dark border border-cyber-primary/30 rounded-lg shadow-2xl flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-cyber-darker border-r border-cyber-primary/20 p-4">
          <div className="flex items-center gap-2 mb-6 px-2">
            <SettingsIcon className="w-6 h-6 text-cyber-primary" />
            <h2 className="text-xl font-bold">Settings</h2>
          </div>

          <nav className="space-y-1">
            <TabButton
              icon={<Key className="w-5 h-5" />}
              label="Credentials"
              active={activeTab === 'credentials'}
              onClick={() => setActiveTab('credentials')}
            />
            <TabButton
              icon={<Bell className="w-5 h-5" />}
              label="Alerts"
              active={activeTab === 'alerts'}
              onClick={() => setActiveTab('alerts')}
            />
            <TabButton
              icon={<Zap className="w-5 h-5" />}
              label="Automation"
              active={activeTab === 'automation'}
              onClick={() => setActiveTab('automation')}
            />
            <TabButton
              icon={<Download className="w-5 h-5" />}
              label="Data & Privacy"
              active={activeTab === 'data'}
              onClick={() => setActiveTab('data')}
            />
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cyber-primary/20">
            <h3 className="text-2xl font-bold">
              {activeTab === 'credentials' && 'API Credentials'}
              {activeTab === 'alerts' && 'Alert Settings'}
              {activeTab === 'automation' && 'Automation Settings'}
              {activeTab === 'data' && 'Data & Privacy'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-cyber-primary/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'credentials' && <CredentialsTab />}
            {activeTab === 'alerts' && <AlertsTab />}
            {activeTab === 'automation' && <AutomationTab />}
            {activeTab === 'data' && <DataTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-cyber-primary/20 text-cyber-primary'
          : 'text-gray-400 hover:bg-cyber-primary/10 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function CredentialsTab() {
  const { credentials, deleteCredential, rotateEncryptionKey } = useCredentialVault();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      deleteCredential(id);
      toast.success('Credential deleted');
    }
  };

  const handleRotateKeys = async () => {
    if (confirm('This will re-encrypt all credentials. Continue?')) {
      await rotateEncryptionKey();
      toast.success('Encryption keys rotated');
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400">
        Manage your API keys and credentials. All credentials are encrypted before storage.
      </p>

      {/* Credentials List */}
      <div className="space-y-3">
        {credentials.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No credentials configured yet. Add them in the Setup Wizard or manually.
          </div>
        )}

        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="p-4 bg-cyber-darker border border-cyber-primary/20 rounded-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{cred.name}</h4>
                <p className="text-sm text-gray-400 capitalize">
                  {cred.provider} • {cred.type.replace('-', ' ')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(cred.id)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-cyber-dark rounded text-sm font-mono">
                {showKeys[cred.id] ? cred.value : '•'.repeat(32)}
              </code>
              <button
                onClick={() =>
                  setShowKeys({ ...showKeys, [cred.id]: !showKeys[cred.id] })
                }
                className="px-3 py-2 bg-cyber-primary/20 hover:bg-cyber-primary/30 rounded transition-colors text-sm"
              >
                {showKeys[cred.id] ? 'Hide' : 'Show'}
              </button>
            </div>

            {cred.metadata?.source && (
              <p className="text-xs text-gray-500 mt-2">
                Added from: {cred.metadata.source}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleRotateKeys}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-primary/20 hover:bg-cyber-primary/30 rounded-lg transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          Rotate Encryption Keys
        </button>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-300">
          🔒 All credentials are encrypted using XOR encryption before storage. For production use, consider implementing Web Crypto API.
        </p>
      </div>
    </div>
  );
}

function AlertsTab() {
  const { rules, updateRule, muteAlerts, unmuteAlerts, mutedUntil } = useAlertStore();

  const handleMute = (hours: number) => {
    muteAlerts(hours * 60 * 60 * 1000);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400">
        Configure when and how you receive revenue alerts.
      </p>

      {/* Mute Controls */}
      <div className="p-4 bg-cyber-darker border border-cyber-primary/20 rounded-lg">
        <h4 className="font-semibold mb-3">Alert Status</h4>
        {mutedUntil && new Date() < mutedUntil ? (
          <div className="space-y-2">
            <p className="text-sm text-yellow-400">
              🔕 Alerts muted until {mutedUntil.toLocaleTimeString()}
            </p>
            <button
              onClick={unmuteAlerts}
              className="px-4 py-2 bg-cyber-primary/20 hover:bg-cyber-primary/30 rounded-lg transition-colors"
            >
              Unmute Now
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleMute(1)}
              className="px-3 py-2 bg-cyber-dark hover:bg-cyber-primary/10 rounded transition-colors text-sm"
            >
              1 hour
            </button>
            <button
              onClick={() => handleMute(4)}
              className="px-3 py-2 bg-cyber-dark hover:bg-cyber-primary/10 rounded transition-colors text-sm"
            >
              4 hours
            </button>
            <button
              onClick={() => handleMute(24)}
              className="px-3 py-2 bg-cyber-dark hover:bg-cyber-primary/10 rounded transition-colors text-sm"
            >
              24 hours
            </button>
          </div>
        )}
      </div>

      {/* Alert Rules */}
      <div className="space-y-3">
        <h4 className="font-semibold">Alert Rules</h4>

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 bg-cyber-darker border border-cyber-primary/20 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium capitalize">{rule.type.replace('-', ' ')}</h5>
                <p className="text-sm text-gray-400">
                  {rule.config.threshold && `Threshold: $${(rule.config.threshold / 100).toFixed(2)}`}
                  {rule.config.period && ` per ${rule.config.period}`}
                  {rule.config.minChange && `Min change: ${rule.config.minChange}%`}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-primary"></div>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationTab() {
  const idleCompute = useIdleCompute();
  const contentPipeline = useContentPipeline();

  return (
    <div className="space-y-6">
      <p className="text-gray-400">
        Configure automation features and resource limits.
      </p>

      {/* Idle Compute */}
      <div className="p-4 bg-cyber-darker border border-cyber-primary/20 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Idle Compute</h4>
            <p className="text-sm text-gray-400">Monetize unused CPU/GPU</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={idleCompute.enabled}
              onChange={(e) =>
                e.target.checked ? idleCompute.enable() : idleCompute.disable()
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-primary"></div>
          </label>
        </div>

        {idleCompute.enabled && (
          <>
            <div>
              <label className="block text-sm mb-2">Max CPU Usage (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={idleCompute.settings.maxCpuUsage}
                onChange={(e) =>
                  idleCompute.updateSettings({
                    maxCpuUsage: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="text-right text-sm text-gray-400">
                {idleCompute.settings.maxCpuUsage}%
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Min Battery Level (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={idleCompute.settings.minBatteryLevel}
                onChange={(e) =>
                  idleCompute.updateSettings({
                    minBatteryLevel: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="text-right text-sm text-gray-400">
                {idleCompute.settings.minBatteryLevel}%
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content Pipeline */}
      <div className="p-4 bg-cyber-darker border border-cyber-primary/20 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Content Pipeline</h4>
            <p className="text-sm text-gray-400">AI-powered content generation</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={contentPipeline.settings.enabled}
              onChange={(e) =>
                contentPipeline.updateSettings({ enabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-primary"></div>
          </label>
        </div>

        {contentPipeline.settings.enabled && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={contentPipeline.settings.autoPublish}
              onChange={(e) =>
                contentPipeline.updateSettings({ autoPublish: e.target.checked })
              }
              className="rounded"
            />
            <label className="text-sm">Auto-publish generated content</label>
          </div>
        )}
      </div>
    </div>
  );
}

function DataTab() {
  const { streams } = useRevenueStore();

  const exportData = (format: 'json' | 'csv') => {
    const data = streams.map((s) => ({
      source: s.source,
      name: s.name,
      amount: s.amount / 100, // Convert to dollars
      currency: s.currency,
      timestamp: s.timestamp,
    }));

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = `dlx-revenue-${Date.now()}.json`;
      mimeType = 'application/json';
    } else {
      // CSV
      const headers = ['Source', 'Name', 'Amount', 'Currency', 'Timestamp'];
      const rows = data.map((d) => [
        d.source,
        d.name,
        d.amount.toFixed(2),
        d.currency,
        new Date(d.timestamp).toISOString(),
      ]);

      content = [headers, ...rows].map((row) => row.join(',')).join('\n');
      filename = `dlx-revenue-${Date.now()}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${data.length} records`, {
      description: `Downloaded ${filename}`,
    });

    logger.info(`Data exported as ${format}`, { records: data.length });
  };

  const clearAllData = () => {
    if (
      confirm(
        'This will delete ALL revenue data. This cannot be undone. Are you sure?'
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400">Export your data or clear all stored information.</p>

      {/* Export */}
      <div className="space-y-3">
        <h4 className="font-semibold">Export Data</h4>

        <div className="flex gap-3">
          <button
            onClick={() => exportData('json')}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-primary/20 hover:bg-cyber-primary/30 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export as JSON
          </button>
          <button
            onClick={() => exportData('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-primary/20 hover:bg-cyber-primary/30 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export as CSV
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Export includes all revenue streams with timestamps and metadata.
        </p>
      </div>

      {/* Privacy */}
      <div className="space-y-3">
        <h4 className="font-semibold">Privacy & Storage</h4>

        <div className="p-4 bg-cyber-darker border border-cyber-primary/20 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">
            All data is stored locally in your browser using IndexedDB and localStorage. Nothing is sent to external servers unless you explicitly connect integrations.
          </p>
          <p className="text-sm text-gray-400">
            API keys are encrypted before storage using XOR encryption.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h4 className="font-semibold text-red-400">Danger Zone</h4>

        <button
          onClick={clearAllData}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Data
        </button>

        <p className="text-sm text-gray-500">
          This will delete all revenue data, credentials, and settings. This cannot be undone.
        </p>
      </div>
    </div>
  );
}
