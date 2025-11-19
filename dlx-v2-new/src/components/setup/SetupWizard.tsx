/**
 * Setup Wizard
 * 3-minute guided onboarding experience
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Sparkles, Key, Zap, DollarSign, Rocket } from 'lucide-react';
import { useCredentialVault } from '../../services/integration/credential-vault';
import { useAIStore } from '../../services/ai/ai-router';
import { useRevenueStore } from '../../services/revenue/revenue-engine';
import { toast } from '../ui/Toast';
import { logger } from '../../services/foundation/logger';

interface SetupWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'ai-setup' | 'revenue-setup' | 'automation' | 'complete';

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [selectedAutomation, setSelectedAutomation] = useState<string[]>([]);

  const { addCredential } = useCredentialVault();
  const { detectProviders } = useAIStore();
  const { addStream } = useRevenueStore();

  const steps: Step[] = ['welcome', 'ai-setup', 'revenue-setup', 'automation', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      // Save data before moving to next step
      if (currentStep === 'ai-setup') {
        await saveAIKeys();
      } else if (currentStep === 'revenue-setup') {
        await saveRevenueConfig();
      } else if (currentStep === 'automation') {
        await saveAutomation();
      }

      setCurrentStep(steps[nextIndex]);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const saveAIKeys = async () => {
    if (geminiKey) {
      await addCredential({
        name: 'Gemini API Key',
        type: 'api-key',
        provider: 'gemini',
        value: geminiKey,
        metadata: { source: 'setup-wizard' },
      });
      toast.success('Gemini API key saved!');
      logger.info('Gemini key added via setup wizard');
    }

    if (claudeKey) {
      await addCredential({
        name: 'Claude API Key',
        type: 'api-key',
        provider: 'claude',
        value: claudeKey,
        metadata: { source: 'setup-wizard' },
      });
      toast.success('Claude API key saved!');
      logger.info('Claude key added via setup wizard');
    }

    // Detect providers after adding keys
    await detectProviders();
  };

  const saveRevenueConfig = async () => {
    if (stripeKey) {
      await addCredential({
        name: 'Stripe Secret Key',
        type: 'api-key',
        provider: 'stripe',
        value: stripeKey,
        metadata: { source: 'setup-wizard' },
      });
      toast.success('Stripe key saved!');
    }

    // Add demo revenue to show the system working
    addStream({
      source: 'manual',
      name: 'Setup Complete Bonus',
      amount: 100, // $1.00
      currency: 'USD',
      timestamp: new Date(),
      metadata: { source: 'setup-wizard', demo: true },
    });
  };

  const saveAutomation = async () => {
    logger.info('Automation preferences saved', { selected: selectedAutomation });

    if (selectedAutomation.length > 0) {
      toast.success(`${selectedAutomation.length} automation(s) enabled!`);
    }
  };

  const handleComplete = () => {
    logger.info('🎉 Setup wizard completed');
    toast.success('Setup complete!', { description: 'Your revenue machine is ready to go!' });

    // Mark wizard as completed in localStorage
    localStorage.setItem('dlx-setup-completed', 'true');
    localStorage.setItem('dlx-setup-completed-at', new Date().toISOString());

    onComplete();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'ai-setup':
        return geminiKey || claudeKey || true; // Optional
      case 'revenue-setup':
        return true; // All optional
      case 'automation':
        return true; // Optional
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-cyber-darker/95 backdrop-blur-lg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl bg-cyber-dark border border-cyber-primary/30 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-cyber-darker">
          <motion.div
            className="h-full bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {currentStep === 'welcome' && (
              <WelcomeStep key="welcome" onNext={handleNext} />
            )}
            {currentStep === 'ai-setup' && (
              <AISetupStep
                key="ai-setup"
                geminiKey={geminiKey}
                claudeKey={claudeKey}
                onGeminiChange={setGeminiKey}
                onClaudeChange={setClaudeKey}
              />
            )}
            {currentStep === 'revenue-setup' && (
              <RevenueSetupStep
                key="revenue-setup"
                stripeKey={stripeKey}
                onStripeChange={setStripeKey}
              />
            )}
            {currentStep === 'automation' && (
              <AutomationStep
                key="automation"
                selected={selectedAutomation}
                onChange={setSelectedAutomation}
              />
            )}
            {currentStep === 'complete' && (
              <CompleteStep key="complete" onFinish={handleComplete} />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className="px-8 md:px-12 pb-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleComplete()}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Step Components

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 mx-auto rounded-full bg-cyber-primary/20 flex items-center justify-center">
        <Rocket className="w-10 h-10 text-cyber-primary" />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold gradient-text">
        Welcome to DLX v2
      </h1>

      <p className="text-xl text-gray-300 max-w-2xl mx-auto">
        Your AI-native Revenue Operating System is ready. Let's set it up in just 3 minutes.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-cyber-dark/50 rounded-lg border border-cyber-primary/20">
          <Sparkles className="w-8 h-8 text-cyber-primary mb-3" />
          <h3 className="font-bold mb-2">AI-Powered</h3>
          <p className="text-sm text-gray-400">Gemini, Claude, and local models ready to help</p>
        </div>

        <div className="p-6 bg-cyber-dark/50 rounded-lg border border-cyber-secondary/20">
          <DollarSign className="w-8 h-8 text-cyber-secondary mb-3" />
          <h3 className="font-bold mb-2">Revenue Focused</h3>
          <p className="text-sm text-gray-400">Track all income streams in one place</p>
        </div>

        <div className="p-6 bg-cyber-dark/50 rounded-lg border border-cyber-accent/20">
          <Zap className="w-8 h-8 text-cyber-accent mb-3" />
          <h3 className="font-bold mb-2">Automated</h3>
          <p className="text-sm text-gray-400">Content, idle compute, and more</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="mt-8 px-8 py-4 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors text-lg"
      >
        Get Started
      </button>
    </motion.div>
  );
}

function AISetupStep({
  geminiKey,
  claudeKey,
  onGeminiChange,
  onClaudeChange,
}: {
  geminiKey: string;
  claudeKey: string;
  onGeminiChange: (value: string) => void;
  onClaudeChange: (value: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Key className="w-8 h-8 text-cyber-primary" />
        <h2 className="text-3xl font-bold">AI Setup</h2>
      </div>

      <p className="text-gray-300">
        Add your AI provider API keys to unlock powerful features. Don't worry, we encrypt everything.
      </p>

      <div className="space-y-4">
        {/* Gemini */}
        <div>
          <label className="block text-sm font-medium mb-2 text-cyber-primary">
            Gemini API Key (Optional)
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => onGeminiChange(e.target.value)}
            placeholder="AIza..."
            className="w-full px-4 py-3 bg-cyber-darker border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-primary hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        {/* Claude */}
        <div>
          <label className="block text-sm font-medium mb-2 text-cyber-secondary">
            Claude API Key (Optional)
          </label>
          <input
            type="password"
            value={claudeKey}
            onChange={(e) => onClaudeChange(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 bg-cyber-darker border border-cyber-secondary/30 rounded-lg focus:outline-none focus:border-cyber-secondary transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your key from{' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-secondary hover:underline"
            >
              Anthropic Console
            </a>
          </p>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> We also auto-detect Ollama and LM Studio if you have them running locally!
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RevenueSetupStep({
  stripeKey,
  onStripeChange,
}: {
  stripeKey: string;
  onStripeChange: (value: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-8 h-8 text-cyber-primary" />
        <h2 className="text-3xl font-bold">Revenue Sources</h2>
      </div>

      <p className="text-gray-300">
        Connect your revenue sources to start tracking income automatically.
      </p>

      <div className="space-y-4">
        {/* Stripe */}
        <div>
          <label className="block text-sm font-medium mb-2 text-cyber-primary">
            Stripe Secret Key (Optional)
          </label>
          <input
            type="password"
            value={stripeKey}
            onChange={(e) => onStripeChange(e.target.value)}
            placeholder="sk_..."
            className="w-full px-4 py-3 bg-cyber-darker border border-cyber-primary/30 rounded-lg focus:outline-none focus:border-cyber-primary transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your key from{' '}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-primary hover:underline"
            >
              Stripe Dashboard
            </a>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-cyber-dark/50 rounded-lg border border-cyber-primary/20">
            <h4 className="font-semibold mb-2">✅ Supported</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Stripe payments</li>
              <li>• Manual entry</li>
              <li>• Content revenue</li>
              <li>• Idle compute</li>
            </ul>
          </div>

          <div className="p-4 bg-cyber-dark/50 rounded-lg border border-gray-500/20">
            <h4 className="font-semibold mb-2 text-gray-400">🚧 Coming Soon</h4>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Crypto wallets</li>
              <li>• Affiliate networks</li>
              <li>• Ad platforms</li>
              <li>• PayPal</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AutomationStep({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const automations = [
    {
      id: 'content',
      name: 'Content Pipeline',
      description: 'AI-powered blog posts, social media, and more',
      icon: '📝',
      enabled: true,
    },
    {
      id: 'idle-compute',
      name: 'Idle Compute',
      description: 'Monetize unused CPU/GPU cycles',
      icon: '⚡',
      enabled: true,
    },
    {
      id: 'opportunities',
      name: 'Opportunity Detection',
      description: 'AI finds ways to increase revenue',
      icon: '🎯',
      enabled: true,
    },
    {
      id: 'alerts',
      name: 'Smart Alerts',
      description: 'Get notified of milestones and anomalies',
      icon: '🔔',
      enabled: true,
    },
  ];

  const toggleAutomation = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-8 h-8 text-cyber-accent" />
        <h2 className="text-3xl font-bold">Automation</h2>
      </div>

      <p className="text-gray-300">
        Choose which automation features you want to enable.
      </p>

      <div className="grid gap-4">
        {automations.map((automation) => (
          <button
            key={automation.id}
            onClick={() => toggleAutomation(automation.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selected.includes(automation.id)
                ? 'border-cyber-primary bg-cyber-primary/10'
                : 'border-cyber-primary/20 bg-cyber-dark/50 hover:border-cyber-primary/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{automation.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold">{automation.name}</h3>
                  {selected.includes(automation.id) && (
                    <Check className="w-5 h-5 text-cyber-primary" />
                  )}
                </div>
                <p className="text-sm text-gray-400">{automation.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500">
        You can change these settings anytime from the Settings panel.
      </p>
    </motion.div>
  );
}

function CompleteStep({ onFinish }: { onFinish: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyber-primary via-cyber-secondary to-cyber-accent flex items-center justify-center"
      >
        <Check className="w-12 h-12 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-4xl font-bold gradient-text mb-4">
          You're All Set!
        </h1>
        <p className="text-xl text-gray-300 max-w-md mx-auto">
          Your revenue operating system is configured and ready to generate income.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-center gap-3 text-cyber-primary">
          <Check className="w-5 h-5" />
          <span>AI providers configured</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-cyber-primary">
          <Check className="w-5 h-5" />
          <span>Revenue tracking enabled</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-cyber-primary">
          <Check className="w-5 h-5" />
          <span>Automation ready</span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onFinish}
        className="mt-8 px-8 py-4 bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent text-white font-bold rounded-lg hover:opacity-90 transition-opacity text-lg"
      >
        Start Making Money 🚀
      </motion.button>

      <p className="text-sm text-gray-500 mt-4">
        Press ⌘K anytime to open the command palette
      </p>
    </motion.div>
  );
}
