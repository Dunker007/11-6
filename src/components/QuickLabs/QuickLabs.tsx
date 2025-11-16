import { useState, lazy, Suspense } from 'react';
import { Bot, ScanEye, Network, PenTool } from 'lucide-react';
import '../../styles/QuickLabs.css';

// Lazy load Quick Labs components directly
const AgentForge = lazy(() => import('./AgentForge'));
const CodeReview = lazy(() => import('./CodeReview'));
const MindMap = lazy(() => import('./MindMap'));
const Creator = lazy(() => import('./Creator'));

type QuickLabTab = 'agent-forge' | 'code-review' | 'mind-map' | 'creator';

function QuickLabs() {
  const [activeTab, setActiveTab] = useState<QuickLabTab>('agent-forge');

  const tabs = [
    { id: 'agent-forge' as QuickLabTab, label: 'Agent Forge', icon: Bot },
    { id: 'code-review' as QuickLabTab, label: 'Code Review', icon: ScanEye },
    { id: 'mind-map' as QuickLabTab, label: 'Mind Map', icon: Network },
    { id: 'creator' as QuickLabTab, label: 'Creator', icon: PenTool },
  ];

  return (
    <div className="quick-labs-container">
      <div className="quick-labs-header">
        <h2>Quick Labs</h2>
        <p className="quick-labs-subtitle">AI-powered development tools</p>
      </div>

      <div className="quick-labs-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`quick-labs-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="quick-labs-content">
        <Suspense fallback={<div className="quick-labs-loading">Loading {tabs.find(t => t.id === activeTab)?.label}...</div>}>
          {activeTab === 'agent-forge' && <AgentForge />}
          {activeTab === 'code-review' && <CodeReview />}
          {activeTab === 'mind-map' && <MindMap />}
          {activeTab === 'creator' && <Creator />}
        </Suspense>
      </div>
    </div>
  );
}

export default QuickLabs;

