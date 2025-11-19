/**
 * Revenue HUD
 * Main dashboard showing revenue stats, trends, and opportunities
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DollarSign, Zap, Target } from 'lucide-react';
import { useRevenueStore, formatCurrency, formatPercentage } from '../../services/revenue/revenue-engine';
import { useAIStore } from '../../services/ai/ai-router';

export function RevenueHUD() {
  const { stats, opportunities, alerts, updateStats, loadOpportunities, checkAlerts } = useRevenueStore();
  const { activeProvider, activeModel, models } = useAIStore();

  useEffect(() => {
    updateStats('month');
    loadOpportunities();
    checkAlerts();
  }, []);

  const activeAIModel = models.find((m) => m.id === activeModel);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Revenue Operating System</h1>
        <p className="text-gray-400">Your money machine is running</p>
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

      {/* Revenue Breakdown */}
      {stats && stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="revenue-card mb-8"
        >
          <h3 className="text-xl font-bold mb-6">Revenue Breakdown</h3>
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
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="bg-gradient-to-r from-cyber-primary to-cyber-secondary h-2 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
                    className="neon-button text-sm px-4 py-2"
                  >
                    {opp.action.label}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
                alert.severity === 'critical'
                  ? 'bg-red-500/10 border-red-500/30'
                  : alert.severity === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">{alert.message}</p>
                {alert.actionable && alert.action && (
                  <button
                    onClick={alert.action.handler}
                    className="text-sm font-medium text-cyber-primary hover:text-cyber-secondary transition-colors"
                  >
                    {alert.action.label} →
                  </button>
                )}
              </div>
            </div>
          ))}
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
          <p className="text-gray-500 mb-6">Connect your first revenue source to get started</p>
          <button
            onClick={() => loadOpportunities()}
            className="neon-button"
          >
            View Setup Guide
          </button>
        </motion.div>
      )}
    </div>
  );
}
