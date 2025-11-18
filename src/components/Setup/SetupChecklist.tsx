/**
 * SetupChecklist.tsx
 *
 * PURPOSE:
 * Onboarding checklist showing users what services are configured vs what's needed.
 * Provides quick access to setup wizards and overall setup progress.
 *
 * FEATURES:
 * - Visual progress indicator (X of Y services configured)
 * - Service status indicators (configured, recommended, optional)
 * - Quick launch buttons for setup wizards
 * - Auto-detection indicator for local providers
 * - Collapsible sections for different service categories
 *
 * USAGE:
 * <SetupChecklist onLaunchSetup={(serviceId) => console.log('Launch setup for', serviceId)} />
 */

import React, { useState, useEffect } from 'react';
import { guidedSetupService } from '../../services/setup/guidedSetupService';
import { providerDetectionService, type ProviderDetectionResult } from '../../services/setup/providerDetectionService';
import { credentialVaultService } from '../../services/credentials/credentialVaultService';
import { logger } from '../../services/logging/loggerService';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import './SetupChecklist.css';

interface SetupChecklistProps {
  onLaunchSetup?: (serviceId: string) => void;
  onComplete?: () => void;
  compact?: boolean; // Show compact version
}

interface ServiceStatus {
  serviceId: string;
  serviceName: string;
  configured: boolean;
  recommended: boolean;
  category: 'ai' | 'revenue' | 'publishing' | 'other';
  estimatedTime: number;
}

export const SetupChecklist: React.FC<SetupChecklistProps> = ({
  onLaunchSetup,
  onComplete,
  compact = false,
}) => {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [providerDetection, setProviderDetection] = useState<ProviderDetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('ai');

  useEffect(() => {
    loadServiceStatuses();
    detectProviders();
  }, []);

  const loadServiceStatuses = () => {
    const setups = guidedSetupService.getAllSetups();

    const statuses: ServiceStatus[] = setups.map((setup) => ({
      serviceId: setup.serviceId,
      serviceName: setup.serviceName,
      configured: credentialVaultService.hasCredentials(setup.serviceId),
      recommended: ['stripe', 'lmstudio', 'ollama', 'github'].includes(setup.serviceId),
      category: getCategoryForService(setup.serviceId),
      estimatedTime: setup.estimatedTime,
    }));

    setServiceStatuses(statuses);
  };

  const detectProviders = async () => {
    setDetecting(true);
    try {
      const result = await providerDetectionService.detectAll();
      setProviderDetection(result);
      logger.info('[SetupChecklist] Provider detection complete', {
        hasAnyProvider: result.hasAnyProvider,
      });

      // Auto-configure if providers detected and not yet configured
      if (result.hasAnyProvider) {
        const configured = await guidedSetupService.autoConfigureProviders();
        if (configured.length > 0) {
          logger.info('[SetupChecklist] Auto-configured providers', { configured });
          loadServiceStatuses(); // Refresh status
        }
      }
    } catch (error) {
      logger.error('[SetupChecklist] Provider detection failed', { error });
    } finally {
      setDetecting(false);
    }
  };

  const getCategoryForService = (serviceId: string): 'ai' | 'revenue' | 'publishing' | 'other' => {
    if (serviceId === 'lmstudio' || serviceId === 'ollama') return 'ai';
    if (serviceId === 'stripe') return 'revenue';
    if (serviceId === 'wordpress' || serviceId === 'medium') return 'publishing';
    return 'other';
  };

  const getStats = () => {
    const total = serviceStatuses.length;
    const configured = serviceStatuses.filter(s => s.configured).length;
    const recommended = serviceStatuses.filter(s => s.recommended).length;
    const recommendedConfigured = serviceStatuses.filter(s => s.recommended && s.configured).length;

    return {
      total,
      configured,
      recommended,
      recommendedConfigured,
      progress: total > 0 ? (configured / total) * 100 : 0,
      recommendedProgress: recommended > 0 ? (recommendedConfigured / recommended) * 100 : 0,
    };
  };

  const stats = getStats();

  const servicesByCategory = {
    ai: serviceStatuses.filter(s => s.category === 'ai'),
    revenue: serviceStatuses.filter(s => s.category === 'revenue'),
    publishing: serviceStatuses.filter(s => s.category === 'publishing'),
    other: serviceStatuses.filter(s => s.category === 'other'),
  };

  const handleLaunchSetup = (serviceId: string) => {
    if (onLaunchSetup) {
      onLaunchSetup(serviceId);
    }
  };

  const renderServiceItem = (status: ServiceStatus) => {
    const isDetected =
      (status.serviceId === 'lmstudio' && providerDetection?.lmstudio.detected) ||
      (status.serviceId === 'ollama' && providerDetection?.ollama.detected);

    return (
      <div key={status.serviceId} className={`setup-checklist-item ${status.configured ? 'configured' : ''}`}>
        <div className="setup-checklist-item-header">
          <div className="setup-checklist-item-status">
            {status.configured ? (
              <span className="setup-checklist-icon setup-checklist-icon-success">✓</span>
            ) : (
              <span className="setup-checklist-icon setup-checklist-icon-pending">○</span>
            )}
          </div>
          <div className="setup-checklist-item-info">
            <div className="setup-checklist-item-name">
              {status.serviceName}
              {status.recommended && <span className="setup-checklist-badge">Recommended</span>}
              {isDetected && <span className="setup-checklist-badge setup-checklist-badge-detected">Auto-detected</span>}
            </div>
            <div className="setup-checklist-item-meta">
              {status.configured ? (
                <span className="setup-checklist-status-text">Configured</span>
              ) : (
                <span className="setup-checklist-status-text">~{status.estimatedTime} min setup</span>
              )}
            </div>
          </div>
        </div>
        {!status.configured && (
          <div className="setup-checklist-item-actions">
            <CyberButton
              size="sm"
              onClick={() => handleLaunchSetup(status.serviceId)}
            >
              Setup
            </CyberButton>
          </div>
        )}
      </div>
    );
  };

  const renderCategory = (
    categoryKey: 'ai' | 'revenue' | 'publishing' | 'other',
    title: string,
    icon: string
  ) => {
    const services = servicesByCategory[categoryKey];
    if (services.length === 0) return null;

    const isExpanded = expandedCategory === categoryKey;
    const configuredCount = services.filter(s => s.configured).length;

    return (
      <div className="setup-checklist-category" key={categoryKey}>
        <div
          className="setup-checklist-category-header"
          onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
        >
          <div className="setup-checklist-category-title">
            <span className="setup-checklist-category-icon">{icon}</span>
            <span className="setup-checklist-category-name">{title}</span>
            <span className="setup-checklist-category-count">
              {configuredCount}/{services.length}
            </span>
          </div>
          <span className="setup-checklist-category-toggle">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
        {isExpanded && (
          <div className="setup-checklist-category-content">
            {services.map(renderServiceItem)}
          </div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="setup-checklist-compact">
        <div className="setup-checklist-compact-header">
          <span className="setup-checklist-compact-title">Setup Progress</span>
          <span className="setup-checklist-compact-stats">
            {stats.configured}/{stats.total}
          </span>
        </div>
        <div className="setup-checklist-progress-bar">
          <div
            className="setup-checklist-progress-fill"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <CyberCard className="setup-checklist">
      <div className="setup-checklist-header">
        <h3 className="setup-checklist-title">Setup Checklist</h3>
        {detecting && <span className="setup-checklist-detecting">Detecting providers...</span>}
      </div>

      {/* Overall Progress */}
      <div className="setup-checklist-progress">
        <div className="setup-checklist-progress-header">
          <span className="setup-checklist-progress-label">Overall Progress</span>
          <span className="setup-checklist-progress-value">
            {stats.configured}/{stats.total} services configured
          </span>
        </div>
        <div className="setup-checklist-progress-bar">
          <div
            className="setup-checklist-progress-fill"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      {/* Provider Detection Summary */}
      {providerDetection && providerDetection.hasAnyProvider && (
        <div className="setup-checklist-detection-summary">
          <div className="setup-checklist-detection-header">
            <span className="setup-checklist-detection-icon">🎉</span>
            <span className="setup-checklist-detection-title">Local AI Detected!</span>
          </div>
          <div className="setup-checklist-detection-content">
            {providerDetection.lmstudio.detected && (
              <div className="setup-checklist-detection-item">
                ✓ LM Studio ({providerDetection.lmstudio.models?.length || 0} models)
              </div>
            )}
            {providerDetection.ollama.detected && (
              <div className="setup-checklist-detection-item">
                ✓ Ollama ({providerDetection.ollama.models?.length || 0} models)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommended Services */}
      {stats.recommendedConfigured < stats.recommended && (
        <div className="setup-checklist-recommended">
          <div className="setup-checklist-recommended-header">
            <span className="setup-checklist-recommended-icon">⭐</span>
            <span className="setup-checklist-recommended-title">
              Recommended Services ({stats.recommendedConfigured}/{stats.recommended})
            </span>
          </div>
          <div className="setup-checklist-recommended-content">
            {serviceStatuses
              .filter(s => s.recommended && !s.configured)
              .map(renderServiceItem)}
          </div>
        </div>
      )}

      {/* Service Categories */}
      <div className="setup-checklist-categories">
        {renderCategory('ai', 'AI Providers', '🤖')}
        {renderCategory('revenue', 'Revenue Tracking', '💰')}
        {renderCategory('publishing', 'Content Publishing', '📝')}
        {renderCategory('other', 'Other Services', '🔧')}
      </div>

      {/* Complete Button */}
      {stats.progress === 100 && onComplete && (
        <div className="setup-checklist-complete">
          <CyberButton onClick={onComplete} variant="primary">
            🎉 All Set! Start Using DLX
          </CyberButton>
        </div>
      )}
    </CyberCard>
  );
};

export default SetupChecklist;
