/**
 * Insights Stream Component
 * Displays chronological timeline of agent activities and system events
 */

import React, { useEffect, useRef } from 'react';
import { useInsightsStreamStore } from '@/services/agents/insightsStreamStore';
import type { Insight } from '@/types/insights';
import TechIcon from '../Icons/TechIcon';
import { 
  Brain, 
  ShieldCheck, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  GitPullRequestArrow, 
  FileText, 
  Terminal, 
  MessageSquare,
  Sparkles,
  Loader,
  X,
} from 'lucide-react';
import '@/styles/InsightsStream.css';

interface InsightsStreamProps {
  maxHeight?: string;
  showHeader?: boolean;
  onClose?: () => void;
}

const InsightsStream: React.FC<InsightsStreamProps> = ({ 
  maxHeight = '400px',
  showHeader = true,
  onClose,
}) => {
  const insights = useInsightsStreamStore((state) => state.insights);
  const clearInsights = useInsightsStreamStore((state) => state.clearInsights);
  const insightsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new insights arrive
  useEffect(() => {
    insightsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [insights]);

  const getInsightIcon = (insight: Insight) => {
    switch (insight.type) {
      case 'agent-activity':
        return insight.agent === 'Vibed Ed' ? (
          <TechIcon icon={Brain} size={16} glow="cyan" animated={insight.details?.status === 'thinking' || insight.details?.status === 'generating'} />
        ) : (
          <TechIcon icon={ShieldCheck} size={16} glow="cyan" animated={insight.details?.status === 'scanning' || insight.details?.status === 'reviewing'} />
        );
      case 'code-vibe':
        return insight.agent === 'Vibed Ed' ? (
          <TechIcon icon={Sparkles} size={16} glow="violet" />
        ) : (
          <TechIcon icon={Lightbulb} size={16} glow="yellow" />
        );
      case 'plan-event':
        switch (insight.details?.status) {
          case 'running':
            return <TechIcon icon={Loader} size={16} glow="cyan" animated />;
          case 'completed':
            return <TechIcon icon={CheckCircle} size={16} glow="green" />;
          case 'error':
            return <TechIcon icon={AlertTriangle} size={16} glow="red" />;
          default:
            return <TechIcon icon={Play} size={16} glow="amber" />;
        }
      case 'code-review':
        return <TechIcon icon={GitPullRequestArrow} size={16} glow="cyan" />;
      case 'file-change':
        return <TechIcon icon={FileText} size={16} glow="amber" />;
      case 'command-output':
        return <TechIcon icon={Terminal} size={16} glow="amber" />;
      case 'system-alert':
        return <TechIcon icon={AlertTriangle} size={16} glow="red" />;
      default:
        return <TechIcon icon={MessageSquare} size={16} glow="amber" />;
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin}m ago`;
    } else if (diffHour < 24) {
      return `${diffHour}h ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  const getAgentColor = (agent: Insight['agent']): string => {
    switch (agent) {
      case 'Vibed Ed':
        return 'var(--accent-cyan)';
      case 'Itor':
        return 'var(--accent-blue)';
      case 'System':
        return 'var(--accent-amber)';
      case 'User':
        return 'var(--accent-green)';
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <div className="insights-stream" style={{ maxHeight }}>
      {showHeader && (
        <div className="insights-stream-header">
          <h3>Insights Stream</h3>
          <div className="insights-stream-actions">
            <button
              onClick={clearInsights}
              className="clear-btn"
              title="Clear all insights"
            >
              Clear
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="close-btn"
                title="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="insights-stream-content">
        {insights.length === 0 ? (
          <div className="insights-empty">
            <MessageSquare size={32} />
            <p>No insights yet</p>
            <span>Agent activities will appear here</span>
          </div>
        ) : (
          <div className="insights-timeline">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`insight-item insight-${insight.type}`}
                style={{
                  borderLeftColor: getAgentColor(insight.agent),
                }}
              >
                <div className="insight-icon">{getInsightIcon(insight)}</div>
                <div className="insight-content">
                  <div className="insight-header">
                    <span
                      className="insight-agent"
                      style={{ color: getAgentColor(insight.agent) }}
                    >
                      {insight.agent}
                    </span>
                    <span className="insight-timestamp">
                      {formatTimestamp(insight.timestamp)}
                    </span>
                  </div>
                  <div className="insight-message">{insight.message}</div>
                  {insight.details && (
                    <div className="insight-details">
                      {insight.details.filePath && (
                        <span className="detail-item">
                          📁 {insight.details.filePath.split('/').pop()}
                        </span>
                      )}
                      {insight.details.status && (
                        <span className={`detail-item status-${insight.details.status}`}>
                          {insight.details.status}
                        </span>
                      )}
                      {insight.details.error && (
                        <span className="detail-item error">
                          ⚠️ {insight.details.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={insightsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsStream;

