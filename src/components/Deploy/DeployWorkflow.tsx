import { useState, useEffect } from 'react';
import DeploymentTargets from './DeploymentTargets';
import DeploymentConfig from './DeploymentConfig';
import DeploymentHistory from './DeploymentHistory';
import LiveDeployment from './LiveDeployment';
import { useDeploymentStore } from '../../services/deploy/deploymentStore';
import type { DeploymentTarget, DeploymentConfig as DeployConfig } from '@/types/deploy';
import '../../styles/DeployWorkflow.css';

function DeployWorkflow() {
  const { deploy, activeDeployment, loadHistory } = useDeploymentStore();
  const [selectedTarget, setSelectedTarget] = useState<DeploymentTarget | null>(null);
  const [activeTab, setActiveTab] = useState<'targets' | 'history'>('targets');
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (activeDeployment) {
      setIsDeploying(true);
      // Check if deployment is complete
      if (activeDeployment.status === 'success' || activeDeployment.status === 'failed' || activeDeployment.status === 'cancelled') {
        setTimeout(() => {
          setIsDeploying(false);
          setSelectedTarget(null);
        }, 3000);
      }
    }
  }, [activeDeployment]);

  const handleTargetSelect = (target: DeploymentTarget) => {
    setSelectedTarget(target);
  };

  const handleConfigSubmit = async (config: DeployConfig) => {
    try {
      await deploy(config);
      setSelectedTarget(null);
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  const handleConfigCancel = () => {
    setSelectedTarget(null);
  };

  if (isDeploying && activeDeployment) {
    return (
      <div className="deploy-workflow">
        <LiveDeployment deployment={activeDeployment} />
      </div>
    );
  }

  if (selectedTarget) {
    return (
      <div className="deploy-workflow">
        <DeploymentConfig
          target={selectedTarget}
          onConfigured={handleConfigSubmit}
          onCancel={handleConfigCancel}
        />
      </div>
    );
  }

  return (
    <div className="deploy-workflow">
      <div className="deploy-header">
        <h2>Deploy Your Project</h2>
        <p>Choose a deployment target and get your project live</p>
      </div>

      <div className="deploy-tabs">
        <button
          className={`deploy-tab ${activeTab === 'targets' ? 'active' : ''}`}
          onClick={() => setActiveTab('targets')}
        >
          🎯 Deployment Targets
        </button>
        <button
          className={`deploy-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History
        </button>
      </div>

      <div className="deploy-content">
        {activeTab === 'targets' && <DeploymentTargets onSelectTarget={handleTargetSelect} />}
        {activeTab === 'history' && <DeploymentHistory />}
      </div>
    </div>
  );
}

export default DeployWorkflow;

