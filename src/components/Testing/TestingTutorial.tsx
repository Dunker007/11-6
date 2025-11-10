import { useState, useMemo } from 'react';
import { BookOpen, CheckCircle2, Circle, ChevronRight, ChevronDown, Play, RotateCcw } from 'lucide-react';
import '../../styles/TestingTutorial.css';

interface TutorialStep {
  id: string;
  title: string;
  objective: string;
  prerequisites?: string[];
  steps: string[];
  expectedResults: string[];
  verification: string[];
}

interface TutorialSection {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

const tutorialData: TutorialSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Verify the application launches correctly and understand the basic UI layout.',
    steps: [
      {
        id: 'launch',
        title: 'Launch the Application',
        objective: 'Verify the application launches correctly',
        steps: [
          'Double-click DLX Studios Ultimate.exe (or use Start Menu shortcut if installed)',
          'Wait for the application window to appear',
          'Observe the window title bar (should show "DLX Studios Ultimate")'
        ],
        expectedResults: [
          'Window opens within 3-5 seconds',
          'Window is properly sized (not minimized)',
          'Title bar shows application name'
        ],
        verification: [
          'Window appears',
          'Title bar visible',
          'No error dialogs'
        ]
      },
      {
        id: 'ui-layout',
        title: 'Observe Initial UI Layout',
        objective: 'Understand the basic UI structure',
        steps: [
          'Look at the top of the window - you should see navigation bar with tabs',
          'Look at the main content area - center panel and right sidebar (Command Hub)',
          'Observe the layout structure'
        ],
        expectedResults: [
          'Navigation bar is centered horizontally',
          'Tabs are visible: "LLM Optimization", "Revenue & Monetization", etc.',
          'Command Hub is visible on the right (or collapsed as icon-only)'
        ],
        verification: [
          'Navigation bar centered',
          'All main tabs visible',
          'Command Hub visible (expanded or collapsed)',
          'No layout glitches'
        ]
      },
      {
        id: 'window-controls',
        title: 'Test Window Controls',
        objective: 'Verify window controls work correctly',
        steps: [
          'Click the minimize button (top-right, first button)',
          'Click the application icon in taskbar to restore',
          'Click the maximize button (top-right, second button)',
          'Click maximize again to restore windowed mode',
          'Hover over the title bar (should be draggable)'
        ],
        expectedResults: [
          'Minimize works',
          'Maximize/restore works',
          'Window is draggable',
          'Close button visible'
        ],
        verification: [
          'Minimize works',
          'Maximize/restore works',
          'Window dragging works',
          'All controls responsive'
        ]
      },
      {
        id: 'tab-navigation',
        title: 'Navigate Between Tabs',
        objective: 'Test tab switching functionality',
        steps: [
          'Click on "LLM Optimization" tab (should already be active)',
          'Click on "Revenue & Monetization" tab',
          'Click on "Vibed Ed" tab',
          'Click on "Crypto Lab" tab',
          'Click on "Wealth Lab" tab',
          'Click on "Idea Lab" tab',
          'Click back to "LLM Optimization"'
        ],
        expectedResults: [
          'Each tab click switches content smoothly',
          'Active tab is visually highlighted',
          'No loading delays > 1 second',
          'Content loads correctly for each tab'
        ],
        verification: [
          'All tabs clickable',
          'Smooth transitions between tabs',
          'Active tab clearly indicated',
          'Content loads for each tab'
        ]
      }
    ]
  },
  {
    id: 'llm-optimization',
    title: 'LLM Optimization Tab',
    description: 'Test all features in the LLM Optimization tab including connection status, model catalog, hardware profiling, and system health.',
    steps: [
      {
        id: 'connection-status',
        title: 'Examine Connection Status Bar',
        objective: 'Verify connection status display',
        steps: [
          'Look at the top of the center panel',
          'Find the "Connection Status" heading (centered, above a horizontal bar)',
          'Observe the Connection Status Bar: should show "X/Y Active", provider icons, and refresh button'
        ],
        expectedResults: [
          'Connection Status heading is centered',
          'Status bar shows active/total provider count',
          'Provider icons visible',
          'Refresh button visible'
        ],
        verification: [
          'Connection Status heading visible and centered',
          'Status summary shows (e.g., "2/5 Active")',
          'Provider icons displayed',
          'Refresh button visible'
        ]
      },
      {
        id: 'model-catalog',
        title: 'Explore Model Catalog',
        objective: 'Test Model Catalog functionality',
        steps: [
          'Look at the left sidebar',
          'Find the "Model Catalog" heading (left-aligned)',
          'Observe the catalog: should show list of available models',
          'Check if models are scrollable if many models'
        ],
        expectedResults: [
          'Model Catalog visible in left sidebar',
          'Models listed with details',
          'Scrollable if content exceeds height'
        ],
        verification: [
          'Model Catalog visible',
          'Models displayed',
          'Scrollable (if needed)',
          'No layout issues'
        ]
      },
      {
        id: 'hardware-profiler',
        title: 'Examine Hardware Profiler',
        objective: 'Verify hardware information display',
        steps: [
          'Scroll down in the center panel (if needed)',
          'Find the "Hardware Profiler" card/section',
          'Observe displayed information: CPU, Memory/RAM, GPU, System specifications'
        ],
        expectedResults: [
          'Hardware information displayed',
          'Values are readable and formatted',
          'No placeholder text or errors'
        ],
        verification: [
          'Hardware Profiler visible',
          'CPU info displayed',
          'Memory info displayed',
          'Information is accurate'
        ]
      }
    ]
  }
];

function TestingTutorial() {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStepIndex, setCurrentStepIndex] = useState<{ section: string; step: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const startTutorial = () => {
    setIsPlaying(true);
    setExpandedSection('getting-started');
    setExpandedStep('launch');
    setCurrentStepIndex({ section: 'getting-started', step: 0 });
  };

  const resetTutorial = () => {
    setIsPlaying(false);
    setCompletedSteps(new Set());
    setCurrentStepIndex(null);
    setExpandedStep(null);
  };

  const totalSteps = useMemo(() => {
    return tutorialData.reduce((sum, section) => sum + section.steps.length, 0);
  }, []);

  const completedCount = completedSteps.size;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <div className="testing-tutorial">
      <div className="tutorial-header">
        <div className="header-content">
          <BookOpen size={24} className="header-icon" />
          <div>
            <h1>Manual Testing Tutorial</h1>
            <p className="tutorial-subtitle">Step-by-step guide to test all application features</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="progress-indicator">
            <span className="progress-text">{completedCount} / {totalSteps} completed</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {!isPlaying ? (
            <button className="tutorial-btn primary" onClick={startTutorial}>
              <Play size={16} />
              Start Tutorial
            </button>
          ) : (
            <button className="tutorial-btn secondary" onClick={resetTutorial}>
              <RotateCcw size={16} />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="tutorial-content">
        {tutorialData.map((section) => (
          <div key={section.id} className="tutorial-section">
            <div
              className="section-header"
              onClick={() => toggleSection(section.id)}
            >
              <div className="section-title-group">
                {expandedSection === section.id ? (
                  <ChevronDown size={20} className="chevron" />
                ) : (
                  <ChevronRight size={20} className="chevron" />
                )}
                <h2>{section.title}</h2>
                <span className="section-badge">
                  {section.steps.length} {section.steps.length === 1 ? 'step' : 'steps'}
                </span>
              </div>
            </div>

            {expandedSection === section.id && (
              <div className="section-content">
                <p className="section-description">{section.description}</p>

                {section.steps.map((step, index) => {
                  const stepId = `${section.id}-${step.id}`;
                  const isCompleted = completedSteps.has(stepId);
                  const isExpanded = expandedStep === stepId;
                  const isCurrent = currentStepIndex?.section === section.id && currentStepIndex?.step === index;

                  return (
                    <div
                      key={step.id}
                      className={`tutorial-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="step-header" onClick={() => toggleStep(stepId)}>
                        <div className="step-title-group">
                          <div className="step-checkbox" onClick={(e) => {
                            e.stopPropagation();
                            toggleStepCompletion(stepId);
                          }}>
                            {isCompleted ? (
                              <CheckCircle2 size={20} className="check-icon" />
                            ) : (
                              <Circle size={20} className="circle-icon" />
                            )}
                          </div>
                          <div className="step-title-content">
                            <h3>{step.title}</h3>
                            <p className="step-objective">{step.objective}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={18} className="chevron" />
                        ) : (
                          <ChevronRight size={18} className="chevron" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="step-content">
                          {step.prerequisites && step.prerequisites.length > 0 && (
                            <div className="step-section">
                              <h4>Prerequisites</h4>
                              <ul>
                                {step.prerequisites.map((prereq, i) => (
                                  <li key={i}>{prereq}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="step-section">
                            <h4>Step-by-Step Instructions</h4>
                            <ol className="instructions-list">
                              {step.steps.map((instruction, i) => (
                                <li key={i}>{instruction}</li>
                              ))}
                            </ol>
                          </div>

                          <div className="step-section">
                            <h4>Expected Results</h4>
                            <ul className="results-list">
                              {step.expectedResults.map((result, i) => (
                                <li key={i}>{result}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="step-section">
                            <h4>Verification</h4>
                            <div className="verification-checklist">
                              {step.verification.map((item, i) => {
                                const checkId = `${stepId}-check-${i}`;
                                const isChecked = completedSteps.has(checkId);
                                return (
                                  <label key={i} className="verification-item">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const newCompleted = new Set(completedSteps);
                                        if (isChecked) {
                                          newCompleted.delete(checkId);
                                        } else {
                                          newCompleted.add(checkId);
                                        }
                                        setCompletedSteps(newCompleted);
                                      }}
                                    />
                                    <span>{item}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="tutorial-footer">
        <p className="footer-note">
          💡 <strong>Tip:</strong> Follow the tutorials in order and check off each step as you complete it. 
          Document any issues you find for reporting.
        </p>
      </div>
    </div>
  );
}

export default TestingTutorial;

