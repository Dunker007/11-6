/**
 * Add Revenue Modal
 * Manual revenue entry with source selection
 */

import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { useRevenueStore } from '../../services/revenue/revenue-engine';
import type { RevenueSource } from '../../types/revenue';
import { toast } from '../ui/Toast';

interface AddRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOURCES: { value: RevenueSource; label: string; emoji: string }[] = [
  { value: 'stripe', label: 'Stripe Payment', emoji: '💳' },
  { value: 'idle-compute', label: 'Idle Compute', emoji: '⚡' },
  { value: 'content', label: 'Content Revenue', emoji: '📝' },
  { value: 'crypto', label: 'Crypto', emoji: '₿' },
  { value: 'affiliate', label: 'Affiliate', emoji: '🤝' },
  { value: 'ads', label: 'Advertising', emoji: '📢' },
  { value: 'manual', label: 'Manual Entry', emoji: '✏️' },
];

export function AddRevenueModal({ isOpen, onClose }: AddRevenueModalProps) {
  const { addStream } = useRevenueStore();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<RevenueSource>('manual');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInCents) || amountInCents <= 0) {
      toast.error('Invalid amount', { description: 'Please enter a valid dollar amount' });
      return;
    }

    addStream({
      source,
      name: description || `${source} revenue`,
      amount: amountInCents,
      currency: 'USD',
      timestamp: new Date(),
      metadata: { manual: true, description },
    });

    toast.success('Revenue added!', {
      description: `$${amount} from ${source}`,
    });

    // Reset and close
    setAmount('');
    setSource('manual');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-cyber-dark border border-cyber-primary/30 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyber-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyber-primary/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cyber-primary" />
            </div>
            <h2 className="text-xl font-bold gradient-text">Add Revenue</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyber-primary/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-primary">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-cyber-darker border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary transition-colors"
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-primary">
              Revenue Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    source === s.value
                      ? 'bg-cyber-primary/20 border-cyber-primary'
                      : 'bg-cyber-darker border-cyber-primary/20 hover:border-cyber-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="text-xs">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2 text-cyber-primary">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-cyber-darker border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary transition-colors"
              placeholder="What is this revenue from?"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-cyber-primary/30 rounded-lg hover:bg-cyber-primary/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors"
            >
              Add Revenue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
