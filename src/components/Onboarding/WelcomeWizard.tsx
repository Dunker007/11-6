/**
 * WelcomeWizard.tsx
 *
 * PURPOSE:
 * Interactive 5-step first-run experience for new DLX users.
 * Guides users through profile setup, quick wins, feature tour, and dashboard intro.
 *
 * FEATURES:
 * - Beautiful step-by-step wizard with animations
 * - Progress tracking (Step X of 5)
 * - Skip option for power users
 * - Resume capability
 * - Profile setup
 * - Quick wins (connect service, generate content)
 * - Interactive feature tour
 *
 * USAGE:
 * <WelcomeWizard onComplete={() => console.log('Onboarding complete')} />
 */

import React, { useState } from 'react';
import {
  useOnboardingStore,
  welcomeWizardService,
  OnboardingStep,
} from '../../services/onboarding/welcomeWizardService';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Card } from '../ui/Card';
import './WelcomeWizard.css';

interface WelcomeWizardProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({
  onComplete,
  onSkip,
}) => {
  const {
    currentStep,
    userProfile,
    nextStep,
    previousStep,
    skipOnboarding,
    updateProfile,
    getProgress,
  } = useOnboardingStore();

  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      nextStep();
      setIsAnimating(false);

      // Check if onboarding is complete
      const state = useOnboardingStore.getState();
      if (state.isCompleted && onComplete) {
        onComplete();
      }
    }, 300);
  };

  const handlePrevious = () => {
    setIsAnimating(true);
    setTimeout(() => {
      previousStep();
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    if (window.confirm('Are you sure you want to skip the setup wizard?')) {
      skipOnboarding();
      if (onSkip) {
        onSkip();
      }
    }
  };

  const progress = getProgress();
  const stepIndex = welcomeWizardService.getCurrentStepIndex();
  const totalSteps = welcomeWizardService.getTotalSteps();

  return (
    <div className="welcome-wizard-overlay">
      <div className="welcome-wizard-container">
        {/* Header */}
        <div className="welcome-wizard-header">
          <h1 className="welcome-wizard-title">
            {welcomeWizardService.getStepTitle(currentStep)}
          </h1>
          <p className="welcome-wizard-subtitle">
            {welcomeWizardService.getStepDescription(currentStep)}
          </p>
          <div className="welcome-wizard-progress-container">
            <div className="welcome-wizard-progress-text">
              Step {stepIndex + 1} of {totalSteps}
            </div>
            <Progress value={progress} className="welcome-wizard-progress" />
          </div>
        </div>

        {/* Step Content */}
        <div className={`welcome-wizard-content ${isAnimating ? 'animating' : ''}`}>
          {currentStep === 'welcome' && <WelcomeStep />}
          {currentStep === 'profile' && (
            <ProfileStep
              profile={userProfile}
              updateProfile={updateProfile}
            />
          )}
          {currentStep === 'quick-wins' && <QuickWinsStep />}
          {currentStep === 'tour' && <TourStep />}
          {currentStep === 'dashboard' && <DashboardStep />}
        </div>

        {/* Footer */}
        <div className="welcome-wizard-footer">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="welcome-wizard-skip"
          >
            Skip Setup
          </Button>
          <div className="welcome-wizard-actions">
            {stepIndex > 0 && (
              <Button variant="secondary" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {stepIndex === totalSteps - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 1: Welcome Screen
const WelcomeStep: React.FC = () => {
  return (
    <div className="wizard-step welcome-step">
      <div className="welcome-hero">
        <div className="welcome-icon">🚀</div>
        <h2>Welcome to DLX Studios</h2>
        <p className="welcome-tagline">
          Transform your computer into a passive income machine
        </p>
      </div>

      <div className="welcome-features">
        <Card className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>AI-Powered Content</h3>
          <p>Generate blog posts, social media, and more with advanced AI</p>
        </Card>
        <Card className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>Revenue Tracking</h3>
          <p>Monitor earnings from Stripe, ads, affiliates in one place</p>
        </Card>
        <Card className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Idle Computing</h3>
          <p>Earn passive income while your computer sits idle</p>
        </Card>
        <Card className="feature-card">
          <div className="feature-icon">🔄</div>
          <h3>Automation</h3>
          <p>Set it and forget it - automate your entire content pipeline</p>
        </Card>
      </div>

      <div className="welcome-stats">
        <div className="stat">
          <div className="stat-value">5,000+</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat">
          <div className="stat-value">$2.5M+</div>
          <div className="stat-label">Generated Revenue</div>
        </div>
        <div className="stat">
          <div className="stat-value">24/7</div>
          <div className="stat-label">Automated Earning</div>
        </div>
      </div>
    </div>
  );
};

// Step 2: Profile Setup
interface ProfileStepProps {
  profile: Partial<import('../../services/onboarding/welcomeWizardService').UserProfile>;
  updateProfile: (profile: Partial<import('../../services/onboarding/welcomeWizardService').UserProfile>) => void;
}

const ProfileStep: React.FC<ProfileStepProps> = ({ profile, updateProfile }) => {
  const [name, setName] = useState(profile.name || '');
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel || 'beginner');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(profile.goals || []);

  const goals = [
    'Generate passive income',
    'Create content faster',
    'Automate workflows',
    'Track revenue',
    'Build a business',
    'Learn AI tools',
  ];

  const handleGoalToggle = (goal: string) => {
    const newGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter((g) => g !== goal)
      : [...selectedGoals, goal];
    setSelectedGoals(newGoals);
    updateProfile({ goals: newGoals });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    updateProfile({ name: e.target.value });
  };

  const handleExperienceChange = (level: typeof experienceLevel) => {
    setExperienceLevel(level);
    updateProfile({ experienceLevel: level });
  };

  return (
    <div className="wizard-step profile-step">
      <div className="profile-section">
        <label className="profile-label">What's your name?</label>
        <input
          type="text"
          className="profile-input"
          placeholder="Enter your name"
          value={name}
          onChange={handleNameChange}
          autoFocus
        />
      </div>

      <div className="profile-section">
        <label className="profile-label">Experience Level</label>
        <div className="experience-options">
          <button
            className={`experience-option ${experienceLevel === 'beginner' ? 'active' : ''}`}
            onClick={() => handleExperienceChange('beginner')}
          >
            <div className="experience-icon">🌱</div>
            <div className="experience-title">Beginner</div>
            <div className="experience-desc">Just getting started</div>
          </button>
          <button
            className={`experience-option ${experienceLevel === 'intermediate' ? 'active' : ''}`}
            onClick={() => handleExperienceChange('intermediate')}
          >
            <div className="experience-icon">📈</div>
            <div className="experience-title">Intermediate</div>
            <div className="experience-desc">Some experience</div>
          </button>
          <button
            className={`experience-option ${experienceLevel === 'advanced' ? 'active' : ''}`}
            onClick={() => handleExperienceChange('advanced')}
          >
            <div className="experience-icon">🚀</div>
            <div className="experience-title">Advanced</div>
            <div className="experience-desc">Power user</div>
          </button>
        </div>
      </div>

      <div className="profile-section">
        <label className="profile-label">What are your goals?</label>
        <div className="goals-grid">
          {goals.map((goal) => (
            <button
              key={goal}
              className={`goal-chip ${selectedGoals.includes(goal) ? 'active' : ''}`}
              onClick={() => handleGoalToggle(goal)}
            >
              {selectedGoals.includes(goal) && <span className="goal-check">✓</span>}
              {goal}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Step 3: Quick Wins
const QuickWinsStep: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState(false);

  const services = [
    { id: 'stripe', name: 'Stripe', icon: '💳', desc: 'Track payments' },
    { id: 'wordpress', name: 'WordPress', icon: '📝', desc: 'Publish content' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', desc: 'Social media' },
    { id: 'openai', name: 'OpenAI', icon: '🤖', desc: 'AI generation' },
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleGenerateContent = () => {
    setGeneratedContent(true);
  };

  return (
    <div className="wizard-step quick-wins-step">
      <div className="quick-wins-intro">
        <h3>Let's Get Your First Win! 🎯</h3>
        <p>Connect a service and generate your first piece of content in under 5 minutes</p>
      </div>

      <div className="quick-wins-section">
        <h4>1. Connect a Service (Optional)</h4>
        <div className="services-grid">
          {services.map((service) => (
            <button
              key={service.id}
              className={`service-card ${selectedService === service.id ? 'active' : ''}`}
              onClick={() => handleServiceSelect(service.id)}
            >
              <div className="service-icon">{service.icon}</div>
              <div className="service-name">{service.name}</div>
              <div className="service-desc">{service.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="quick-wins-section">
        <h4>2. Generate Your First Content</h4>
        {!generatedContent ? (
          <div className="generate-demo">
            <p>Click below to see AI generate a blog post in seconds:</p>
            <Button onClick={handleGenerateContent} size="lg">
              ✨ Generate Demo Content
            </Button>
          </div>
        ) : (
          <Card className="generated-preview">
            <div className="generated-header">
              <span className="generated-badge">✅ Generated!</span>
              <span className="generated-time">3.2s</span>
            </div>
            <h4>5 Ways AI is Transforming Business in 2025</h4>
            <p className="generated-excerpt">
              Artificial Intelligence is revolutionizing the way businesses operate.
              From automated customer service to predictive analytics, AI is helping
              companies work smarter and faster...
            </p>
            <div className="generated-stats">
              <span>📊 750 words</span>
              <span>✅ SEO optimized</span>
              <span>🎯 Ready to publish</span>
            </div>
          </Card>
        )}
      </div>

      <div className="quick-wins-success">
        <div className="success-icon">🎉</div>
        <p>
          {generatedContent
            ? "Great! You've seen how fast DLX can create content. Let's continue!"
            : 'You can connect services later. Let\'s continue the tour!'}
        </p>
      </div>
    </div>
  );
};

// Step 4: Feature Tour
const TourStep: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'AI Intelligence Dashboard',
      icon: '🧠',
      description: 'Monitor all your AI systems in one place. Track performance, costs, and insights.',
      benefits: ['Real-time monitoring', 'Cost tracking', 'Performance analytics'],
    },
    {
      title: 'Content Generation',
      icon: '✍️',
      description: 'Create blog posts, social media, newsletters with AI. Publish anywhere.',
      benefits: ['Multi-platform support', 'SEO optimization', 'Brand voice learning'],
    },
    {
      title: 'Revenue Tracking',
      icon: '💰',
      description: 'Track all your income sources: Stripe, ads, affiliates, sponsorships.',
      benefits: ['Real-time revenue', 'Multi-source tracking', 'Tax reporting'],
    },
    {
      title: 'Automation Workflows',
      icon: '🔄',
      description: 'Set up automated workflows that run 24/7. Generate, optimize, and publish.',
      benefits: ['Set and forget', '24/7 operation', 'Custom workflows'],
    },
  ];

  return (
    <div className="wizard-step tour-step">
      <div className="tour-navigation">
        {features.map((feature, index) => (
          <button
            key={index}
            className={`tour-nav-item ${activeFeature === index ? 'active' : ''}`}
            onClick={() => setActiveFeature(index)}
          >
            <span className="tour-nav-icon">{feature.icon}</span>
            <span className="tour-nav-title">{feature.title}</span>
          </button>
        ))}
      </div>

      <Card className="tour-feature-card">
        <div className="tour-feature-header">
          <div className="tour-feature-icon">{features[activeFeature].icon}</div>
          <h3>{features[activeFeature].title}</h3>
        </div>
        <p className="tour-feature-description">
          {features[activeFeature].description}
        </p>
        <div className="tour-feature-benefits">
          <h4>Key Benefits:</h4>
          <ul>
            {features[activeFeature].benefits.map((benefit, index) => (
              <li key={index}>
                <span className="benefit-check">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="tour-progress">
        {features.map((_, index) => (
          <div
            key={index}
            className={`tour-dot ${activeFeature === index ? 'active' : ''}`}
            onClick={() => setActiveFeature(index)}
          />
        ))}
      </div>
    </div>
  );
};

// Step 5: Dashboard Ready
const DashboardStep: React.FC = () => {
  const { userProfile } = useOnboardingStore();

  return (
    <div className="wizard-step dashboard-step">
      <div className="dashboard-ready-hero">
        <div className="ready-icon">🎉</div>
        <h2>You're All Set{userProfile.name ? `, ${userProfile.name}` : ''}!</h2>
        <p className="ready-subtitle">
          Your DLX Studios workspace is ready. Here's what to do next:
        </p>
      </div>

      <div className="next-steps">
        <Card className="next-step-card">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Connect Your Services</h4>
            <p>Link Stripe, WordPress, social media accounts to start tracking</p>
            <Button variant="secondary" size="sm">
              Go to Credentials →
            </Button>
          </div>
        </Card>

        <Card className="next-step-card">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Generate Your First Content</h4>
            <p>Try the AI content generator and publish your first post</p>
            <Button variant="secondary" size="sm">
              Open Creator →
            </Button>
          </div>
        </Card>

        <Card className="next-step-card">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Set Up Automation</h4>
            <p>Create your first automated workflow to run 24/7</p>
            <Button variant="secondary" size="sm">
              Build Workflow →
            </Button>
          </div>
        </Card>
      </div>

      <div className="dashboard-resources">
        <h4>Helpful Resources</h4>
        <div className="resources-grid">
          <a href="#" className="resource-link">
            📖 Getting Started Guide
          </a>
          <a href="#" className="resource-link">
            🎥 Video Tutorials
          </a>
          <a href="#" className="resource-link">
            💬 Community Forum
          </a>
          <a href="#" className="resource-link">
            ❓ FAQ & Support
          </a>
        </div>
      </div>

      <div className="dashboard-ready-footer">
        <p className="encouragement">
          💡 <strong>Pro Tip:</strong> Start small! Connect one service and generate
          one piece of content. You'll see results in minutes.
        </p>
      </div>
    </div>
  );
};

export default WelcomeWizard;
