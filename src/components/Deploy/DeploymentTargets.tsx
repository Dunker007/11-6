import { useState, useEffect, useMemo } from 'react';
import { useDeploymentStore } from '../../services/deploy/deploymentStore';
import { useDebounce } from '../../utils/hooks/useDebounce';
import TechIcon from '../Icons/TechIcon';
import { Search, Server, Cloud, Lock } from 'lucide-react';
import type { DeploymentTarget } from '@/types/deploy';
import '../../styles/DeployWorkflow.css';

interface DeploymentTargetsProps {
  onSelectTarget: (target: DeploymentTarget) => void;
}

function DeploymentTargets({ onSelectTarget }: DeploymentTargetsProps) {
  const { targets, loadTargets } = useDeploymentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const filteredTargets = useMemo(() => {
    return debouncedSearchQuery.trim()
      ? targets.filter((target) =>
          target.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          target.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          target.type.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        )
      : targets;
  }, [debouncedSearchQuery, targets]);

  return (
    <div className="deployment-targets">
      <div className="targets-header">
        <h3>Deployment Targets</h3>
        <div className="search-box">
          <TechIcon icon={Search} size={16} glow="none" className="search-icon" />
          <input
            type="text"
            placeholder="Search targets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="target-search"
          />
        </div>
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
              <div className="target-icon-wrapper">
                <TechIcon 
                  icon={target.type === 'cloud' ? Cloud : Server} 
                  size={32} 
                  glow="cyan" 
                />
              </div>
              <div className="target-info">
                <h4>{target.name}</h4>
                <p>{target.description}</p>
                <div className="target-meta">
                  <span className="target-type">{target.type}</span>
                  {target.requiresAuth && (
                    <span className="auth-badge">
                      <TechIcon icon={Lock} size={12} glow="none" />
                      <span>Requires Auth</span>
                    </span>
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

