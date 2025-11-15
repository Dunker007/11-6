/**
 * Gemini Studio Panel
 * Configuration panel for Google AI Studio features
 * Provides controls for all Gemini-specific features: safety settings, system instructions,
 * function calling, grounding, and advanced parameters
 */

import React, { useState, useEffect } from 'react';
import ProjectHost from '../GeminiStudio/ProjectHost';
import SmartCommentsPanel from '../CodeAnalysis/SmartCommentsPanel';
import VisualToCode from '../Vision/VisualToCode';
import ProjectQA from '../GoogleAI/ProjectQA';
import { Button } from '../ui';
import TechIcon from '../Icons/TechIcon';
import { BrainCircuit, Image, MessageSquare, HelpCircle, Info, AlertCircle, Settings } from 'lucide-react';
import { apiKeyService } from '@/services/apiKeys/apiKeyService';
import '../../styles/GeminiStudio.css';
import '../../styles/GoogleAIHub.css';

type HubTab = 'studio' | 'vision' | 'comments' | 'qa';

const GoogleAIHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HubTab>('studio');
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if user has visited before
    const visited = localStorage.getItem('google-ai-hub-visited');
    return !visited;
  });
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      const key = await apiKeyService.getKey('gemini');
      setHasGeminiKey(!!key);
    };
    checkApiKey();
  }, []);

  // Keyboard shortcuts (1-4 to switch tabs)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case '1':
          setActiveTab('studio');
          break;
        case '2':
          setActiveTab('vision');
          break;
        case '3':
          setActiveTab('comments');
          break;
        case '4':
          setActiveTab('qa');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleDismissWelcome = () => {
    localStorage.setItem('google-ai-hub-visited', 'true');
    setShowWelcome(false);
  };

  const tabDescriptions = {
    studio: 'Import and run Gemini AI Studio projects with function calling',
    vision: 'Convert UI screenshots to code using Gemini Vision',
    comments: 'AI-powered code analysis and smart comments',
    qa: 'Ask questions about your project using natural language'
  };

  return (
    <div className="google-ai-hub">
      {showWelcome && (
        <div className="hub-welcome">
          <Info size={20} />
          <div className="welcome-content">
            <h4>Welcome to Google AI Hub!</h4>
            <p>Explore powerful AI features powered by Gemini. Use keyboard shortcuts (1-4) to switch between tabs.</p>
          </div>
          <button onClick={handleDismissWelcome} className="welcome-dismiss">
            Got it
          </button>
        </div>
      )}
      {!hasGeminiKey && (
        <div className="hub-api-warning">
          <AlertCircle size={20} />
          <div className="warning-content">
            <p><strong>Gemini API Key Required</strong></p>
            <p>Configure your API key in settings to use these features.</p>
          </div>
          <button 
            onClick={() => {/* Navigate to settings - would need router */}}
            className="warning-action"
            title="Open Settings"
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      )}
      <div className="hub-header">
        <h3>Google AI Hub</h3>
        <div className="hub-tabs" role="tablist" aria-label="Google AI Hub features">
          <Button
            variant={activeTab === 'studio' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('studio')}
            leftIcon={BrainCircuit}
            title={`${tabDescriptions.studio} (Press 1)`}
            role="tab"
            aria-selected={activeTab === 'studio'}
            aria-controls="hub-content-studio"
          >
            AI Studio
          </Button>
          <Button
            variant={activeTab === 'vision' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('vision')}
            leftIcon={Image}
            title={`${tabDescriptions.vision} (Press 2)`}
            role="tab"
            aria-selected={activeTab === 'vision'}
            aria-controls="hub-content-vision"
          >
            Visual to Code
          </Button>
          <Button
            variant={activeTab === 'comments' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('comments')}
            leftIcon={MessageSquare}
            title={`${tabDescriptions.comments} (Press 3)`}
            role="tab"
            aria-selected={activeTab === 'comments'}
            aria-controls="hub-content-comments"
          >
            Smart Comments
          </Button>
          <Button
            variant={activeTab === 'qa' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('qa')}
            leftIcon={HelpCircle}
            title={`${tabDescriptions.qa} (Press 4)`}
            role="tab"
            aria-selected={activeTab === 'qa'}
            aria-controls="hub-content-qa"
          >
            Project Q&A
          </Button>
        </div>
      </div>
      <div className="hub-content">
        {activeTab === 'studio' && (
          <div role="tabpanel" id="hub-content-studio" aria-labelledby="tab-studio">
            <TechIcon icon={BrainCircuit} size={24} />
            <h4>Gemini AI Studio Projects</h4>
            <ProjectHost />
          </div>
        )}
        {activeTab === 'vision' && (
          <div role="tabpanel" id="hub-content-vision" aria-labelledby="tab-vision">
            <TechIcon icon={Image} size={24} />
            <h4>Visual to Code</h4>
            <VisualToCode />
          </div>
        )}
        {activeTab === 'comments' && (
          <div role="tabpanel" id="hub-content-comments" aria-labelledby="tab-comments">
            <TechIcon icon={MessageSquare} size={24} />
            <h4>Smart Comments</h4>
            <SmartCommentsPanel />
          </div>
        )}
        {activeTab === 'qa' && (
          <div role="tabpanel" id="hub-content-qa" aria-labelledby="tab-qa">
            <TechIcon icon={HelpCircle} size={24} />
            <h4>Project Q&A</h4>
            <ProjectQA />
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAIHub;

