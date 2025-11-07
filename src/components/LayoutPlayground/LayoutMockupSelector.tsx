import { useState } from 'react';
import '../../styles/LayoutMockups.css';

export type MockupType = 'command-center' | 'desktop-experience' | 'ai-os';

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
    id: 'command-center',
    name: 'Command Center',
    description: 'Mission Control layout with all workflows visible at once',
    tagline: 'Foundation Layer - Get organized',
    features: [
      'Grid-based workflow cards',
      'Collapsible tools drawer',
      'Quick Labs dock',
      'Context-aware completions',
      'Multi-file awareness indicator',
      'Real-time collaboration status',
    ],
    vibeLevel: 1,
  },
  {
    id: 'desktop-experience',
    name: 'Desktop Experience',
    description: 'Familiar desktop metaphor with tools as applications',
    tagline: 'Intelligence Layer - AI as your co-pilot',
    features: [
      'Multi-window management',
      'App-based workflows',
      'Multi-file editing panel',
      'Critic Agent QA assistant',
      'Automated test generator',
      'Hybrid Mode (AI/Deep coding)',
      'Mood-based environments',
    ],
    vibeLevel: 2,
  },
  {
    id: 'ai-os',
    name: 'AI OS Mode',
    description: 'Full operating system experience with Vibed Ed as system intelligence',
    tagline: 'Ultimate Vibe Coding - The future is here',
    features: [
      'Natural language command center',
      'Codebase graph visualization',
      'Cross-project AI reasoning',
      'Error forecasting dashboard',
      'Auto-test suite generation',
      'Flow state management',
      'Multiplayer coding',
      'Smart code review',
      'Security scanner integration',
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
            These are interactive previews showing three possible evolution paths for DLX Studios Ultimate.
            Each mockup is fully explorable and demonstrates how the platform could integrate the most-requested
            vibe coding features for 2025.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LayoutMockupSelector;

