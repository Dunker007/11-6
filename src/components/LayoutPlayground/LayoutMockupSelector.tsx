import { useState } from 'react';
import '../../styles/LayoutMockups.css';

export type MockupType =
  | 'studio-hub'
  | 'llm-revenue-command-center'
  | 'bolt-ai-workspace';

export interface LayoutMockup {
  id: MockupType;
  name: string;
  description: string;
  tagline: string;
  features: string[];
  vibeLevel: number; // 1-3, representing how much vibe coding features are included
}

interface LayoutMockupSelectorProps {
  onPreview: (mockupId: MockupType) => void;
}

const MOCKUPS: LayoutMockup[] = [
  {
    id: 'studio-hub',
    name: 'Studio Hub',
    description: 'Professional development workspace focused on project management, code editing, and workflow orchestration.',
    tagline: 'Studio · Project Management & Code Editing',
    features: [
      'Large code editor with syntax highlighting',
      'Project selector and file explorer',
      'Workflow switcher (Create/Build/Deploy/Monitor/Monetize)',
      'AI assistant sidebar for code help',
      'Activity feed and git status',
      'Integrated terminal and build output',
      'AI-powered code suggestions',
    ],
    vibeLevel: 3,
  },
  {
    id: 'llm-revenue-command-center',
    name: 'LLM & Revenue Command Center',
    description: 'Unified dashboard combining LLM optimization, model management, and revenue tracking with cost analysis.',
    tagline: 'LLMs & Revenue · Optimization & Monetization',
    features: [
      'LLM model catalog with cost tracking',
      'Hardware profiler and system health',
      'Revenue streams with LLM cost attribution',
      'ROI analysis and profit optimization',
      'Benchmark runner and model comparison',
      'AI-powered cost and revenue insights',
      'Unified optimization dashboard',
    ],
    vibeLevel: 3,
  },
  {
    id: 'bolt-ai-workspace',
    name: 'Bolt AI Workspace',
    description: 'AI-first conversational coding interface with turbo edits, smart context, and real-time AI assistance.',
    tagline: 'Bolt · AI-Powered Coding Assistant',
    features: [
      'Large AI chat interface as primary surface',
      'Real-time code preview and updates',
      'Context HUD showing project understanding',
      'Turbo Edit panel for quick modifications',
      'Multi-file context visualization',
      'AI agent status (Kai, Guardian, ByteBot)',
      'Conversation-driven development workflow',
    ],
    vibeLevel: 3,
  },
];

function LayoutMockupSelector({ onPreview }: LayoutMockupSelectorProps) {
  const [hoveredMockup, setHoveredMockup] = useState<MockupType | null>(null);

  return (
    <div className="mockup-selector">
      <div className="mockup-selector-header">
        <h3>Explore Future Layouts</h3>
        <p>
          See how DLX Studios Ultimate evolves from IDE to the ultimate vibe coding platform.
          Each mockup progressively integrates the most-desired 2025 vibe coding features.
        </p>
      </div>

      <div className="mockup-cards">
        {MOCKUPS.map((mockup) => (
          <div
            key={mockup.id}
            className={`mockup-card ${hoveredMockup === mockup.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredMockup(mockup.id)}
            onMouseLeave={() => setHoveredMockup(null)}
          >
            <div className="mockup-card-header">
              <div className="mockup-vibe-level">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`vibe-dot ${i < mockup.vibeLevel ? 'active' : ''}`}
                  />
                ))}
              </div>
              <h4>{mockup.name}</h4>
              <p className="mockup-tagline">{mockup.tagline}</p>
            </div>

            <p className="mockup-description">{mockup.description}</p>

            <div className="mockup-features">
              <h5>Key Features:</h5>
              <ul>
                {mockup.features.slice(0, 5).map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
                {mockup.features.length > 5 && (
                  <li className="feature-more">
                    +{mockup.features.length - 5} more features
                  </li>
                )}
              </ul>
            </div>

            <button
              className="preview-mockup-btn"
              onClick={() => onPreview(mockup.id)}
            >
              Preview Interactive Mockup
            </button>
          </div>
        ))}
      </div>

      <div className="mockup-selector-footer">
        <div className="info-card">
          <h4>What are these mockups?</h4>
          <p>
            Three focused layout options emphasizing Studio workflows, unified LLM optimization & revenue tracking, and Bolt AI coding.
            Each mockup is fully functional and demonstrates how DLX Studios Ultimate integrates AI throughout the development experience.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LayoutMockupSelector;

