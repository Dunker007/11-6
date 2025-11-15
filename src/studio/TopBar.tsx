import { useState, useEffect } from 'react';
import VibedEdAvatar from '../vibed-ed/VibedEdAvatar';
import AIStatus from '../components/AIStatus';
import RevenueDashboard from '../components/RevenueDashboard';
import Marketplace from '../marketplace/Marketplace';
import LLMOptimizerPanel from '../components/LLMOptimizer/LLMOptimizerPanel';
import { luxrigAutomation } from '../affiliate/luxrigAutomation';
import '../styles-new/topbar.css';

interface TopBarProps {
  activeProject: any; // Project object from store
  onToggleSidebar: () => void;
  onOpenMarketplace?: () => void;
  onOpenCommandPalette?: () => void;
}

function TopBar({ activeProject, onToggleSidebar, onOpenMarketplace, onOpenCommandPalette }: TopBarProps) {
  const [showRevenueDashboard, setShowRevenueDashboard] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showLLMOptimizer, setShowLLMOptimizer] = useState(false);
  const [automationStats, setAutomationStats] = useState(luxrigAutomation.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setAutomationStats(luxrigAutomation.getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleAutomation = async () => {
    try {
      if (automationStats.isRunning) {
        luxrigAutomation.stop();
      } else {
        await luxrigAutomation.start();
      }
      setAutomationStats(luxrigAutomation.getStats());
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          ☰
        </button>

        <div className="brand">
          <VibedEdAvatar size="small" />
          <span className="brand-text">Vibed Ed Studio</span>
        </div>
      </div>

      <div className="topbar-center">
        {activeProject && (
          <div className="project-info">
            <span className="project-name">{activeProject.name}</span>
            <span className="project-status">{activeProject.status}</span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        <AIStatus />
        <button
          className={`topbar-button automation-button ${automationStats.isRunning ? 'active' : ''}`}
          onClick={toggleAutomation}
          title={automationStats.isRunning ? 'Stop LuxRig Automation' : 'Start LuxRig Automation'}
        >
          {automationStats.isRunning ? '⏹️' : '▶️'}
        </button>
        <button
          className="topbar-button command-palette-button"
          onClick={() => onOpenCommandPalette?.()}
          title="Command Palette (Ctrl+K)"
        >
          ⌘
        </button>
        <button
          className="topbar-button llm-optimizer-button"
          onClick={() => setShowLLMOptimizer(true)}
          title="LLM Optimizer - Benchmark and optimize models"
        >
          🧠 LLM Tools
        </button>
        <button
          className="topbar-button marketplace-button"
          onClick={() => {
            if (onOpenMarketplace) {
              onOpenMarketplace();
            } else {
              setShowMarketplace(true);
            }
          }}
          title="Template Marketplace"
        >
          🛒
        </button>
        <button
          className="topbar-button revenue-button"
          onClick={() => setShowRevenueDashboard(true)}
          title="Revenue Dashboard"
        >
          💰
        </button>
        <button className="topbar-button" title="Settings">
          ⚙️
        </button>
        <button className="topbar-button" title="Help">
          ❓
        </button>
      </div>

      {/* Revenue Dashboard Modal */}
      {showRevenueDashboard && (
        <div className="revenue-modal-overlay" onClick={() => setShowRevenueDashboard(false)}>
          <div className="revenue-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Revenue Dashboard</h2>
              <button
                className="modal-close"
                onClick={() => setShowRevenueDashboard(false)}
              >
                ×
              </button>
            </div>
            <RevenueDashboard />
          </div>
        </div>
      )}

      {/* Marketplace Modal */}
      {showMarketplace && (
        <div className="marketplace-modal-overlay" onClick={() => setShowMarketplace(false)}>
          <div className="marketplace-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Template Marketplace</h2>
              <button
                className="modal-close"
                onClick={() => setShowMarketplace(false)}
              >
                ×
              </button>
            </div>
            <Marketplace />
          </div>
        </div>
      )}

      {/* LLM Optimizer Modal */}
      {showLLMOptimizer && (
        <div className="llm-optimizer-modal-overlay" onClick={() => setShowLLMOptimizer(false)}>
          <div className="llm-optimizer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>LLM Optimizer</h2>
              <button
                className="modal-close"
                onClick={() => setShowLLMOptimizer(false)}
              >
                ×
              </button>
            </div>
            <LLMOptimizerPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default TopBar;
