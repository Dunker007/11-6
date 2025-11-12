/**
 * Model Status Dashboard
 * Real-time status of all models with quick actions
 */

import React, { useMemo } from 'react';
import { Zap, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import TechIcon from '../Icons/TechIcon';
import QuickModelActions from './QuickModelActions';
import type { ModelCatalogEntry } from '@/types/optimizer';
import '@/styles/ModelStatusDashboard.css';

interface ModelStatusDashboardProps {
  catalog?: ModelCatalogEntry[];
}

const ModelStatusDashboard: React.FC<ModelStatusDashboardProps> = ({ catalog = [] }) => {
  const { models, activeModel, availableProviders, isLoading } = useLLMStore();

  // Group models by provider and status
  const modelGroups = useMemo(() => {
    const groups: Record<string, {
      provider: string;
      providerName: string;
      type: 'local' | 'cloud';
      isOnline: boolean;
      models: typeof models;
      activeModel?: typeof models[0];
    }> = {};

    const providerMap: Record<string, { name: string; type: 'local' | 'cloud' }> = {
      ollama: { name: 'Ollama', type: 'local' },
      lmstudio: { name: 'LM Studio', type: 'local' },
      gemini: { name: 'Gemini', type: 'cloud' },
      notebooklm: { name: 'NotebookLM', type: 'cloud' },
      openrouter: { name: 'OpenRouter', type: 'cloud' },
    };

    models.forEach((model) => {
      const providerInfo = providerMap[model.provider];
      if (!providerInfo) return;

      if (!groups[model.provider]) {
        groups[model.provider] = {
          provider: model.provider,
          providerName: providerInfo.name,
          type: providerInfo.type,
          isOnline: availableProviders.includes(model.provider),
          models: [],
          activeModel: activeModel?.provider === model.provider ? activeModel : undefined,
        };
      }

      groups[model.provider].models.push(model);
    });

    return Object.values(groups);
  }, [models, availableProviders, activeModel]);

  if (isLoading) {
    return (
      <div className="model-status-dashboard">
        <div className="dashboard-loading">
          <Activity size={20} className="spinning" />
          <span>Loading model status...</span>
        </div>
      </div>
    );
  }

  if (modelGroups.length === 0) {
    return (
      <div className="model-status-dashboard">
        <div className="dashboard-empty">
          <XCircle size={32} />
          <h3>No Models Available</h3>
          <p>Start Ollama or LM Studio to discover local models</p>
        </div>
      </div>
    );
  }

  return (
    <div className="model-status-dashboard">
      <div className="dashboard-header">
        <h3>Model Status</h3>
        <div className="status-summary">
          <span className="summary-item">
            <CheckCircle2 size={14} className="online" />
            {modelGroups.filter(g => g.isOnline).length} Online
          </span>
          <span className="summary-item">
            <Zap size={14} className="active" />
            {activeModel ? '1 Active' : 'None Active'}
          </span>
        </div>
      </div>

      <div className="model-groups">
        {modelGroups.map((group) => (
          <div
            key={group.provider}
            className={`model-group ${group.isOnline ? 'online' : 'offline'} ${group.type}`}
          >
            <div className="group-header">
              <div className="group-info">
                <div className={`status-indicator ${group.isOnline ? 'online' : 'offline'}`} />
                <div className="group-details">
                  <h4>{group.providerName}</h4>
                  <span className="model-count">
                    {group.models.length} model{group.models.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {group.activeModel && (
                <div className="active-badge">
                  <TechIcon icon={Zap} size={14} glow="green" />
                  <span>Active</span>
                </div>
              )}
            </div>

            <div className="models-list">
              {group.models.slice(0, 5).map((model) => (
                <div
                  key={model.id}
                  className={`model-item ${activeModel?.id === model.id ? 'active' : ''}`}
                >
                  <div className="model-info">
                    <span className="model-name">{model.name}</span>
                    {model.size && (
                      <span className="model-size">{model.size}</span>
                    )}
                  </div>
                  <QuickModelActions model={catalog.find(c => c.id === model.id) || {
                    id: model.id,
                    displayName: model.name,
                    provider: model.provider,
                    sizeGB: 0,
                    contextWindow: model.contextWindow || 4096,
                    tags: [],
                    family: model.provider,
                    description: '',
                  }} compact={true} />
                </div>
              ))}
              {group.models.length > 5 && (
                <div className="more-models">
                  +{group.models.length - 5} more models
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelStatusDashboard;

