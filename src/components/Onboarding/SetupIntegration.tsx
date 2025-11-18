/**
 * SetupIntegration.tsx
 *
 * PURPOSE:
 * Integration layer between WelcomeWizard and guided setup services.
 * Provides a streamlined onboarding experience that connects to real setup wizards.
 *
 * FEATURES:
 * - Provider auto-detection on mount
 * - Quick launch buttons for priority services
 * - Integration with SetupChecklist
 * - Integration with GuidedSetupWizard
 * - Smooth transitions between onboarding and setup
 *
 * USAGE:
 * <SetupIntegration onContinue={() => console.log('Continue to next step')} />
 */

import React, { useState, useEffect } from 'react';
import { guidedSetupService } from '../../services/setup/guidedSetupService';
import { providerDetectionService } from '../../services/setup/providerDetectionService';
import { GuidedSetupWizard } from '../Setup/GuidedSetupWizard';
import SetupChecklist from '../Setup/SetupChecklist';
import { CyberButton } from '../ui/CyberButton';
import { CyberCard } from '../ui/CyberCard';
import './SetupIntegration.css';

interface SetupIntegrationProps {
  onContinue?: () => void;
  showFullChecklist?: boolean;
}

export const SetupIntegration: React.FC<SetupIntegrationProps> = ({
  onContinue,
  showFullChecklist = false,
}) => {
  const [activeSetup, setActiveSetup] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [detectedProviders, setDetectedProviders] = useState<string[]>([]);

  useEffect(() => {
    detectAndConfigure();
  }, []);

  const detectAndConfigure = async () => {
    setDetecting(true);
    try {
      // Detect local providers
      const detection = await providerDetectionService.detectAll();

      const detected: string[] = [];
      if (detection.lmstudio.detected) detected.push('LM Studio');
      if (detection.ollama.detected) detected.push('Ollama');

      setDetectedProviders(detected);

      // Auto-configure if detected
      if (detection.hasAnyProvider) {
        await guidedSetupService.autoConfigureProviders();
      }
    } catch (error) {
      console.error('[SetupIntegration] Detection failed:', error);
    } finally {
      setDetecting(false);
    }
  };

  const handleLaunchSetup = (serviceId: string) => {
    setActiveSetup(serviceId);
  };

  const handleSetupComplete = () => {
    setActiveSetup(null);
    // Optionally continue to next step
    if (onContinue) {
      onContinue();
    }
  };

  const handleSetupCancel = () => {
    setActiveSetup(null);
  };

  // Priority services for quick setup
  const priorityServices = [
    { id: 'stripe', name: 'Stripe', icon: '💳', desc: 'Track revenue & payments' },
    { id: 'lmstudio', name: 'LM Studio', icon: '🤖', desc: 'Local AI models' },
    { id: 'wordpress', name: 'WordPress', icon: '📝', desc: 'Content publishing' },
    { id: 'github', name: 'GitHub', icon: '🔧', desc: 'Code & automation' },
  ];

  if (activeSetup) {
    return (
      <div className="setup-integration">
        <GuidedSetupWizard
          serviceId={activeSetup}
          onComplete={handleSetupComplete}
          onCancel={handleSetupCancel}
        />
      </div>
    );
  }

  if (showFullChecklist) {
    return (
      <div className="setup-integration">
        <SetupChecklist
          onLaunchSetup={handleLaunchSetup}
          onComplete={onContinue}
        />
        {onContinue && (
          <div className="setup-integration-footer">
            <CyberButton onClick={onContinue} variant="ghost">
              Skip for now
            </CyberButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="setup-integration-quick">
      {/* Detection Status */}
      {detecting && (
        <div className="setup-integration-detecting">
          <div className="setup-integration-spinner" />
          <span>Detecting local AI providers...</span>
        </div>
      )}

      {/* Detection Results */}
      {!detecting && detectedProviders.length > 0 && (
        <CyberCard className="setup-integration-detection-result">
          <div className="setup-integration-detection-header">
            <span className="setup-integration-detection-icon">🎉</span>
            <div className="setup-integration-detection-content">
              <h4>Great! We found {detectedProviders.join(' and ')}</h4>
              <p>Your local AI {detectedProviders.length === 1 ? 'provider is' : 'providers are'} automatically configured and ready to use!</p>
            </div>
          </div>
        </CyberCard>
      )}

      {/* Quick Setup Options */}
      <div className="setup-integration-intro">
        <h3>Quick Setup (Optional)</h3>
        <p>Connect the services you want to use. You can always do this later.</p>
      </div>

      <div className="setup-integration-services">
        {priorityServices.map((service) => (
          <CyberCard
            key={service.id}
            className="setup-integration-service-card"
            onClick={() => handleLaunchSetup(service.id)}
          >
            <div className="setup-integration-service-icon">{service.icon}</div>
            <div className="setup-integration-service-info">
              <div className="setup-integration-service-name">{service.name}</div>
              <div className="setup-integration-service-desc">{service.desc}</div>
            </div>
            <div className="setup-integration-service-action">
              <CyberButton size="sm">Setup</CyberButton>
            </div>
          </CyberCard>
        ))}
      </div>

      {/* Show All Services Link */}
      <div className="setup-integration-show-all">
        <button
          className="setup-integration-show-all-button"
          onClick={() => handleLaunchSetup('all')}
        >
          View all services →
        </button>
      </div>

      {/* Continue Button */}
      {onContinue && (
        <div className="setup-integration-footer">
          <CyberButton onClick={onContinue}>
            Continue Tour
          </CyberButton>
        </div>
      )}
    </div>
  );
};

export default SetupIntegration;
