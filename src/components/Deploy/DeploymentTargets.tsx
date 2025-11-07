import { useState, useEffect } from 'react';
import { useDeploymentStore } from '../../services/deploy/deploymentStore';
import type { DeploymentTarget } from '@/types/deploy';
import '../../styles/DeployWorkflow.css';

interface DeploymentTargetsProps {
  onSelectTarget: (target: DeploymentTarget) => void;
}

function DeploymentTargets({ onSelectTarget }: DeploymentTargetsProps) {
  const { targets, loadTargets } = useDeploymentStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const filteredTargets = searchQuery.trim()
    ? targets.filter((target) =>
        target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        target.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        target.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : targets;

  return (
    <div className="deployment-targets">
      <div className="targets-header">
        <h3>Deployment Targets</h3>
        <input
          type="text"
          placeholder="Search targets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="target-search"
        />
      </div>

      <div className="targets-grid">
        {filteredTargets.length === 0 ? (
          <div className="empty-state">No deployment targets found.</div>
        ) : (
          filteredTargets.map((target) => (
            <div
              key={target.id}
              className="target-card"
              onClick={() => onSelectTarget(target)}
            >
              <div className="target-icon">{target.icon}</div>
              <div className="target-info">
                <h4>{target.name}</h4>
                <p>{target.description}</p>
                <div className="target-meta">
                  <span className="target-type">{target.type}</span>
                  {target.requiresAuth && (
                    <span className="auth-badge">Requires Auth</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DeploymentTargets;

