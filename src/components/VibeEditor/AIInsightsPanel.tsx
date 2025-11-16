import React, { useState } from 'react';
import '@/styles/AIInsightsPanel.css';

interface TabDef {
  id: 'insights' | 'callgraph' | 'coverage' | 'deps';
  label: string;
}

const TABS: TabDef[] = [
  { id: 'insights', label: 'Insights' },
  { id: 'callgraph', label: 'Call Graph' },
  { id: 'coverage', label: 'Test Coverage' },
  { id: 'deps', label: 'Dependencies' },
];

interface AIInsightsPanelProps {
  visible: boolean;
  onClose: () => void;
  insights?: string | null;
  callGraph?: Array<{ caller: string; callee: string }>;
  coverage?: { filesCovered: number; percent: number } | null;
  deps?: Array<{ file: string; dependsOn: string[] }>;
}

function AIInsightsPanel({ visible, onClose, insights, callGraph, coverage, deps }: AIInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabDef['id']>('insights');
  if (!visible) return null;

  return (
    <div className="aiinsights-overlay">
      <div className="aiinsights-panel">
        <div className="aiinsights-header">
          <h3>AI Context</h3>
          <button className="aiinsights-close" onClick={onClose} title="Close">×</button>
        </div>
        <div className="aiinsights-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`aiinsights-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="aiinsights-body">
          {activeTab === 'insights' && (
            <div className="aiinsights-section">
              {insights ? <pre>{insights}</pre> : <p>No insights yet. Configure LLM or run analysis.</p>}
            </div>
          )}
          {activeTab === 'callgraph' && (
            <div className="aiinsights-section">
              {(callGraph && callGraph.length > 0) ? (
                <ul>
                  {callGraph.map((edge, idx) => (
                    <li key={idx}>{edge.caller} → {edge.callee}</li>
                  ))}
                </ul>
              ) : <p>No call graph data.</p>}
            </div>
          )}
          {activeTab === 'coverage' && (
            <div className="aiinsights-section">
              {coverage ? (
                <div>
                  <p>Files Covered: {coverage.filesCovered}</p>
                  <p>Coverage: {coverage.percent}%</p>
                </div>
              ) : <p>No coverage available.</p>}
            </div>
          )}
          {activeTab === 'deps' && (
            <div className="aiinsights-section">
              {(deps && deps.length > 0) ? (
                <ul>
                  {deps.map((d, idx) => (
                    <li key={idx}>
                      <strong>{d.file}</strong>
                      <div>→ {d.dependsOn.join(', ') || 'No direct deps'}</div>
                    </li>
                  ))}
                </ul>
              ) : <p>No dependencies data.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIInsightsPanel;


