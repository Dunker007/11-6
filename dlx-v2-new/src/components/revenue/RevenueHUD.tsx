/**
 * Revenue HUD
 * Main dashboard showing revenue stats, trends, and opportunities
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Zap,
  Target,
  Plus,
  Command as CommandIcon,
  Bell,
  BarChart3,
  X,
} from 'lucide-react';
import { useRevenueStore, formatCurrency, formatPercentage } from '../../services/revenue/revenue-engine';
import { useAIStore } from '../../services/ai/ai-router';
import { useAnalyticsStore } from '../../services/revenue/analytics';
import { useAlertStore } from '../../services/revenue/alert-system';
import { RevenueChart } from './RevenueChart';
import { AddRevenueModal } from './AddRevenueModal';
import { CommandPalette } from '../ui/CommandPalette';

export function RevenueHUD() {
  const { stats, opportunities, streams, updateStats, loadOpportunities } = useRevenueStore();
  const { activeProvider, activeModel, models } = useAIStore();
  const { analyze, insights } = useAnalyticsStore();
  const { alerts, checkRevenue, dismissAlert } = useAlertStore();

  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'pie'>('line');

  useEffect(() => {
    updateStats('month');
    loadOpportunities();
    analyze(streams);
    checkRevenue(streams);
  }, [streams.length]);

  useEffect(() => {
    // Keyboard shortcut for command palette
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowAddRevenue(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const activeAIModel = models.find((m) => m.id === activeModel);
  const unreadAlerts = alerts.filter(a => !a.dismissed);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Revenue Operating System</h1>
          <p className="text-gray-400">Your money machine is running</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadAlerts.length > 0 && (
            <button className="relative p-3 rounded-lg bg-cyber-dark border border-cyber-primary/30 hover:border-cyber-primary/50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyber-secondary rounded-full text-xs flex items-center justify-center font-bold">
                {unreadAlerts.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-cyber-dark border border-cyber-primary/30 hover:border-cyber-primary/50 transition-colors"
          >
            <CommandIcon className="w-5 h-5" />
            <span>⌘K</span>
          </button>
          <button
            onClick={() => setShowAddRevenue(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-cyber-primary text-cyber-darker font-bold hover:bg-cyber-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Revenue</span>
          </button>
        </div>
      </motion.div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="revenue-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Revenue</h3>
            <DollarSign className="w-5 h-5 text-cyber-primary" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold text-white">
                {stats ? formatCurrency(stats.total) : '$0.00'}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {stats && stats.trend === 'up' && <TrendingUp className="w-4 h-4 text-revenue-up" />}
                {stats && stats.trend === 'down' && <TrendingDown className="w-4 h-4 text-revenue-down" />}
                {stats && stats.trend === 'stable' && <Minus className="w-4 h-4 text-revenue-neutral" />}
                <span
                  className={`text-sm font-medium ${
                    stats?.trend === 'up'
                      ? 'text-revenue-up'
                      : stats?.trend === 'down'
                      ? 'text-revenue-down'
                      : 'text-revenue-neutral'
                  }`}
                >
                  {stats ? formatPercentage(stats.change) : '0%'}
                </span>
                <span className="text-sm text-gray-400">this month</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="revenue-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Active Streams</h3>
            <Zap className="w-5 h-5 text-cyber-secondary" />
          </div>
          <div className="text-3xl font-bold text-white">
            {stats ? Object.values(stats.breakdown).filter((v) => v > 0).length : 0}
          </div>
          <div className="text-sm text-gray-400 mt-2">revenue sources</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="revenue-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">AI Status</h3>
            <div className="w-2 h-2 rounded-full bg-revenue-up animate-pulse"></div>
          </div>
          <div className="text-lg font-semibold text-white">{activeAIModel?.name || 'No model selected'}</div>
          <div className="text-sm text-gray-400 mt-2">
            {activeProvider === 'gemini' && '⚡ Multimodal ready'}
            {activeProvider === 'claude' && '🧠 Strategic mode'}
            {(activeProvider === 'ollama' || activeProvider === 'lmstudio') && '🏠 Running locally'}
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="revenue-card mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-cyber-accent" />
            <h3 className="text-lg font-bold">AI Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="text-sm text-gray-300 p-3 bg-cyber-dark/30 rounded-lg">
                {insight}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Revenue Chart */}
      {stats && stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="revenue-card mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyber-primary" />
              <h3 className="text-xl font-bold">Revenue Trends</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  chartType === 'line'
                    ? 'bg-cyber-primary text-cyber-darker font-bold'
                    : 'bg-cyber-dark border border-cyber-primary/30'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  chartType === 'pie'
                    ? 'bg-cyber-primary text-cyber-darker font-bold'
                    : 'bg-cyber-dark border border-cyber-primary/30'
                }`}
              >
                Breakdown
              </button>
            </div>
          </div>
          <RevenueChart type={chartType} period="week" />
        </motion.div>
      )}

      {/* Revenue Breakdown Bars */}
      {stats && stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="revenue-card mb-8"
        >
          <h3 className="text-xl font-bold mb-6">Revenue by Source</h3>
          <div className="space-y-4">
            {Object.entries(stats.breakdown).map(([source, amount]) => {
              if (amount === 0) return null;
              const percentage = (amount / stats.total) * 100;
              return (
                <div key={source} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-gray-300">{source.replace('-', ' ')}</span>
                    <span className="font-semibold text-white">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-cyber-dark rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="bg-gradient-to-r from-cyber-primary to-cyber-secondary h-2 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8 space-y-3"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyber-secondary" />
            Active Alerts
          </h3>
          {unreadAlerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border flex items-start justify-between ${
                alert.severity === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : alert.severity === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : alert.severity === 'success'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold text-white mb-1">{alert.title}</div>
                <p className="text-sm text-gray-300">{alert.message}</p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="ml-4 p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="revenue-card mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-cyber-accent" />
            <h3 className="text-xl font-bold">Growth Opportunities</h3>
          </div>
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-4 bg-cyber-dark/30 rounded-lg border border-cyber-primary/10 hover:border-cyber-primary/30 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-white">{opp.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{opp.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyber-primary">
                      +{formatCurrency(opp.estimatedRevenue)}
                    </div>
                    <div className="text-xs text-gray-400">/month</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="capitalize">{opp.difficulty} difficulty</span>
                    <span>⏱ {opp.timeToImplement}</span>
                  </div>
                  <button
                    onClick={opp.action.handler}
                    className="px-4 py-2 bg-cyber-primary/20 border border-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition-colors text-sm font-medium"
                  >
                    {opp.action.label}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {(!stats || stats.total === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No revenue tracked yet</h3>
          <p className="text-gray-500 mb-6">Add your first revenue entry to get started</p>
          <button
            onClick={() => setShowAddRevenue(true)}
            className="px-6 py-3 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors"
          >
            Add Revenue
          </button>
        </motion.div>
      )}

      {/* Modals */}
      <AddRevenueModal isOpen={showAddRevenue} onClose={() => setShowAddRevenue(false)} />
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onOpenAddRevenue={() => setShowAddRevenue(true)}
        onOpenSettings={() => {/* Settings coming soon */}}
      />
    </div>
  );
}
