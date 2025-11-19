/**
 * Command Palette
 * ⌘K quick actions and navigation
 */

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import {
  DollarSign,
  Settings,
  Sparkles,
  TrendingUp,
  Zap,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Key,
  Keyboard,
} from 'lucide-react';
import { useRevenueStore } from '../../services/revenue/revenue-engine';
import { useAIStore } from '../../services/ai/ai-router';
import { toast } from './Toast';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddRevenue: () => void;
  onOpenSettings: () => void;
  onOpenKeyboardShortcuts?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenAddRevenue, onOpenSettings, onOpenKeyboardShortcuts }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const { stats } = useRevenueStore();
  const { activeProvider, models, setProvider } = useAIStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action: string) => {
    onClose();
    setSearch('');

    switch (action) {
      case 'add-revenue':
        onOpenAddRevenue();
        break;
      case 'settings':
        onOpenSettings();
        break;
      case 'keyboard-shortcuts':
        onOpenKeyboardShortcuts?.();
        break;
      case 'copy-total':
        if (stats) {
          navigator.clipboard.writeText(`$${(stats.total / 100).toFixed(2)}`);
          toast.success('Copied to clipboard!', { description: `$${(stats.total / 100).toFixed(2)}` });
        }
        break;
      case 'ask-ai':
        toast.info('AI Assistant coming soon!', { description: 'This feature is under development' });
        break;
      default:
        if (action.startsWith('switch-provider-')) {
          const provider = action.replace('switch-provider-', '') as any;
          setProvider(provider);
          toast.success(`Switched to ${provider}`, { description: 'AI provider updated' });
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[20vh] bg-black/50 backdrop-blur-sm">
      <Command className="w-full max-w-2xl bg-cyber-dark border border-cyber-primary/30 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center border-b border-cyber-primary/20 px-4">
          <Sparkles className="w-5 h-5 text-cyber-primary mr-3" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="w-full py-4 bg-transparent focus:outline-none text-lg"
            autoFocus
          />
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-8 text-center text-gray-400">
            No results found.
          </Command.Empty>

          <Command.Group heading="Quick Actions" className="px-2 py-2 text-sm text-cyber-primary font-semibold">
            <CommandItem
              icon={<DollarSign className="w-5 h-5" />}
              label="Add Revenue"
              shortcut="⌘N"
              onSelect={() => handleAction('add-revenue')}
            />
            <CommandItem
              icon={<Sparkles className="w-5 h-5" />}
              label="Ask AI Assistant"
              shortcut="⌘A"
              onSelect={() => handleAction('ask-ai')}
            />
            <CommandItem
              icon={<BarChart3 className="w-5 h-5" />}
              label="Copy Total Revenue"
              shortcut="⌘C"
              onSelect={() => handleAction('copy-total')}
            />
          </Command.Group>

          <Command.Group heading="AI Providers" className="px-2 py-2 text-sm text-cyber-primary font-semibold">
            {models.filter(m => m.isAvailable).map((model) => (
              <CommandItem
                key={model.id}
                icon={<Zap className="w-5 h-5" />}
                label={`Switch to ${model.name}`}
                description={`${model.provider} • ${(model.contextWindow / 1000).toFixed(0)}k context`}
                badge={model.provider === activeProvider ? 'Active' : undefined}
                onSelect={() => handleAction(`switch-provider-${model.provider}`)}
              />
            ))}
          </Command.Group>

          <Command.Group heading="Navigation" className="px-2 py-2 text-sm text-cyber-primary font-semibold">
            <CommandItem
              icon={<TrendingUp className="w-5 h-5" />}
              label="View Analytics"
              onSelect={() => toast.info('Analytics view coming soon!')}
            />
            <CommandItem
              icon={<Bell className="w-5 h-5" />}
              label="View Alerts"
              onSelect={() => toast.info('Alerts view coming soon!')}
            />
            <CommandItem
              icon={<CreditCard className="w-5 h-5" />}
              label="Connect Stripe"
              onSelect={() => toast.info('Stripe integration coming soon!')}
            />
            <CommandItem
              icon={<FileText className="w-5 h-5" />}
              label="Content Pipeline"
              onSelect={() => toast.info('Content pipeline coming soon!')}
            />
          </Command.Group>

          <Command.Separator className="my-2 border-t border-cyber-primary/20" />

          <Command.Group heading="Settings" className="px-2 py-2 text-sm text-cyber-primary font-semibold">
            <CommandItem
              icon={<Settings className="w-5 h-5" />}
              label="Open Settings"
              shortcut="⌘,"
              onSelect={() => handleAction('settings')}
            />
            <CommandItem
              icon={<Keyboard className="w-5 h-5" />}
              label="Keyboard Shortcuts"
              shortcut="?"
              onSelect={() => handleAction('keyboard-shortcuts')}
            />
            <CommandItem
              icon={<Key className="w-5 h-5" />}
              label="Manage API Keys"
              onSelect={() => toast.info('API key management coming soon!')}
            />
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function CommandItem({
  icon,
  label,
  description,
  shortcut,
  badge,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  shortcut?: string;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-cyber-primary/10 data-[selected=true]:bg-cyber-primary/20 transition-colors"
    >
      <div className="text-cyber-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {badge && (
            <span className="px-2 py-0.5 text-xs bg-cyber-primary/20 text-cyber-primary rounded">
              {badge}
            </span>
          )}
        </div>
        {description && <div className="text-sm text-gray-400">{description}</div>}
      </div>
      {shortcut && (
        <kbd className="px-2 py-1 text-xs bg-cyber-darker border border-cyber-primary/30 rounded">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
