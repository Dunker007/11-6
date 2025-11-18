/**
 * AI Intelligence Dashboard
 * Unified view of all AI systems, insights, notifications, and activity
 */

import React, { useState, useEffect } from 'react';
import {
  aiControlCenterService,
  aiNotificationService,
  aiInsightsService,
  aiIntegrationService,
  type AISystemStatus,
  type AINotification,
  type AIInsight,
  type AIActivityEvent,
} from '../../services/ai';

export const AIIntelligenceDashboard: React.FC = () => {
  const [systems, setSystems] = useState<AISystemStatus[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [activity, setActivity] = useState<AIActivityEvent[]>([]);
  const [quickStats, setQuickStats] = useState(aiControlCenterService.getQuickStats());
  const [selectedTab, setSelectedTab] = useState<'overview' | 'insights' | 'activity' | 'settings'>('overview');

  useEffect(() => {
    // Load initial data
    loadData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setSystems(aiControlCenterService.getSystemStatuses());
    setInsights(aiInsightsService.getTopInsights(10));
    setNotifications(aiNotificationService.getAll({ status: 'unread', limit: 10 }));
    setActivity(aiInsightsService.getActivityFeed({ limit: 20 }));
    setQuickStats(aiControlCenterService.getQuickStats());
  };

  const handleToggleAI = () => {
    if (quickStats.aiEnabled) {
      aiControlCenterService.disableAI();
    } else {
      aiControlCenterService.enableAI();
    }
    loadData();
  };

  const handleMarkAllRead = () => {
    aiNotificationService.markAllAsRead();
    loadData();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Intelligence</h1>
          <p className="text-gray-600">Monitor and control all AI systems</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* AI Master Switch */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">AI Systems</span>
            <button
              onClick={handleToggleAI}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                quickStats.aiEnabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  quickStats.aiEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Active Systems</div>
          <div className="mt-2 flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">
              {quickStats.systemsActive}/{quickStats.systemsTotal}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Today's Impact</div>
          <div className="mt-2 flex items-baseline">
            <div className="text-2xl font-semibold text-green-600">
              ${quickStats.todayImpact.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Unread Alerts</div>
          <div className="mt-2 flex items-baseline">
            <div className="text-2xl font-semibold text-orange-600">
              {quickStats.unreadAlerts}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm font-medium text-gray-600">AI Status</div>
          <div className="mt-2 flex items-baseline">
            <div className={`text-2xl font-semibold ${quickStats.aiEnabled ? 'text-green-600' : 'text-gray-400'}`}>
              {quickStats.aiEnabled ? 'Active' : 'Paused'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'insights', 'activity', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Systems Grid */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Systems</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className="bg-white p-4 rounded-lg shadow border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(system.health)}`} />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{system.name}</h3>
                        <p className="text-xs text-gray-500">{system.category}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      system.running ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {system.running ? 'Running' : 'Stopped'}
                    </span>
                  </div>

                  {system.stats && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Actions Today:</span>
                        <span className="font-medium">{system.stats.actionsToday}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium">{Math.round(system.stats.successRate)}%</span>
                      </div>
                      {system.stats.totalImpact !== undefined && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Impact:</span>
                          <span className="font-medium text-green-600">
                            ${system.stats.totalImpact.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-200 divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No unread notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">{notif.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(notif.priority)}`}>
                            {notif.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{notif.message}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {notif.source} • {notif.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'insights' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">{insight.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {insight.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{insight.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Source: {insight.source}</span>
                      <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                      <span>Impact: {insight.impact.estimated.toFixed(1)}% {insight.impact.category}</span>
                    </div>
                    {insight.actionable && insight.actions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {insight.actions.map((action, idx) => (
                          <button
                            key={idx}
                            className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'activity' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">AI Activity Feed</h2>
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="divide-y divide-gray-200">
              {activity.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full ${
                      event.result === 'success' ? 'bg-green-500' :
                      event.result === 'failed' ? 'bg-red-500' :
                      event.result === 'partial' ? 'bg-yellow-500' :
                      'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{event.action}</span>
                        <span className="text-xs text-gray-500">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                      <p className="mt-1 text-xs text-gray-500">{event.system}</p>
                      {event.impact && (
                        <p className="mt-1 text-xs text-green-600">
                          +{event.impact.value}% {event.impact.metric}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">AI Settings</h2>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleToggleAI}
                className={`w-full px-4 py-2 text-sm font-medium rounded-lg ${
                  quickStats.aiEnabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {quickStats.aiEnabled ? 'Pause All AI Systems' : 'Resume All AI Systems'}
              </button>

              <button
                onClick={() => {
                  aiControlCenterService.resetToDefaults();
                  loadData();
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset to Defaults
              </button>

              <button
                onClick={handleMarkAllRead}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear All Notifications
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Integrations</h3>
            <div className="space-y-3">
              {aiIntegrationService.getIntegrationStatus().map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{integration.name}</h4>
                    <p className="text-xs text-gray-500">{integration.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Executed {integration.executionCount} times
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    integration.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
