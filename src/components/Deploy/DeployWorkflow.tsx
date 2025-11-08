import { useState, useEffect } from 'react';
import DeploymentTargets from './DeploymentTargets';
import DeploymentConfig from './DeploymentConfig';
import DeploymentHistory from './DeploymentHistory';
import LiveDeployment from './LiveDeployment';
import { useDeploymentStore } from '../../services/deploy/deploymentStore';
import { useActivityStore } from '../../services/activity/activityStore';
import TechIcon from '../Icons/TechIcon';
import { Target, History, Rocket } from 'lucide-react';
import type { DeploymentTarget, DeploymentConfig as DeployConfig } from '@/types/deploy';
import '../../styles/DeployWorkflow.css';

function DeployWorkflow() {
  const { deploy, activeDeployment, loadHistory } = useDeploymentStore();
  const { addActivity } = useActivityStore();
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
      addActivity('deployment', 'started', `Deploying to ${config.target}`);
      await deploy(config);
      addActivity('deployment', 'completed', `Successfully deployed to ${config.target}`);
      setSelectedTarget(null);
    } catch (error) {
      console.error('Deployment failed:', error);
      addActivity('deployment', 'failed', `Deployment to ${config.target} failed`);
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
        <div className="deploy-title">
          <TechIcon icon={Rocket} size={32} glow="cyan" animated={false} />
          <div>
            <h2>Deploy Your Project</h2>
            <p>Choose a deployment target and get your project live</p>
          </div>
        </div>
      </div>

      <div className="deploy-tabs">
        <button
          className={`deploy-tab ${activeTab === 'targets' ? 'active' : ''}`}
          onClick={() => setActiveTab('targets')}
        >
          <TechIcon icon={Target} size={18} glow={activeTab === 'targets' ? 'cyan' : 'none'} />
          <span>Deployment Targets</span>
        </button>
        <button
          className={`deploy-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <TechIcon icon={History} size={18} glow={activeTab === 'history' ? 'cyan' : 'none'} />
          <span>History</span>
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

