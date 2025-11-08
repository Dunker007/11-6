import { useState, useEffect } from 'react';
import DeploymentTargets from './DeploymentTargets';
import DeploymentConfig from './DeploymentConfig';
import DeploymentHistory from './DeploymentHistory';
import LiveDeployment from './LiveDeployment';
import WorkflowHero from '../shared/WorkflowHero';
import WorkflowHeader from '../shared/WorkflowHeader';
import CommandCard from '../shared/CommandCard';
import { useDeploymentStore } from '../../services/deploy/deploymentStore';
import { useActivityStore } from '../../services/activity/activityStore';
import { useProjectStore } from '../../services/project/projectStore';
import TechIcon from '../Icons/TechIcon';
import { Target, History, Rocket } from 'lucide-react';
import type { DeploymentTarget, DeploymentConfig as DeployConfig } from '@/types/deploy';
import '../../styles/DeployWorkflow.css';

function DeployWorkflow() {
  const { deploy, activeDeployment, loadHistory, history } = useDeploymentStore();
  const { addActivity } = useActivityStore();
  const { projects } = useProjectStore();
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
        <WorkflowHeader 
          title="DEPLOYMENT IN PROGRESS"
          statusBadge={{ label: 'DEPLOYING', variant: 'info' }}
        />
        <LiveDeployment deployment={activeDeployment} />
      </div>
    );
  }

  if (selectedTarget) {
    return (
      <div className="deploy-workflow">
        <WorkflowHeader 
          title="CONFIGURE DEPLOYMENT"
          breadcrumbs={['Deploy', selectedTarget.name]}
          onBack={handleConfigCancel}
        />
        <DeploymentConfig
          target={selectedTarget}
          onConfigured={handleConfigSubmit}
          onCancel={handleConfigCancel}
        />
      </div>
    );
  }

  // Calculate stats (with safe fallbacks)
  const deploymentList = history?.deployments || [];
  const projectList = projects || [];
  const totalDeployments = deploymentList.length;
  const successfulDeployments = deploymentList.filter(d => d.status === 'success').length;
  const activeProjects = projectList.filter(p => p.status !== 'archived').length;
  const successRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;

  return (
    <div className="deploy-workflow command-center-layout">
      {/* Command Center Hero */}
      <WorkflowHero
        title="DEPLOYMENT COMMAND"
        subtitle="Launch Your Projects to Production"
        showCore={false}
        stats={[
          { icon: '▣', value: activeProjects, label: 'Active Projects' },
          { icon: '◈', value: totalDeployments, label: 'Total Deployments' },
          { icon: '◎', value: successfulDeployments, label: 'Successful' },
          { icon: '◉', value: `${successRate}%`, label: 'Success Rate' },
        ]}
        statusIndicators={[
          { label: 'DEPLOY READY', status: 'online' },
          { label: 'TARGETS AVAILABLE', status: 'online' },
        ]}
      />

      {/* Tab Navigation */}
      <div className="deploy-tab-nav">
        <CommandCard 
          variant="cyan"
          clickable
          onClick={() => setActiveTab('targets')}
          className={activeTab === 'targets' ? 'active' : ''}
        >
          <div className="tab-content">
            <TechIcon icon={Target} size={32} glow="cyan" animated={activeTab === 'targets'} />
            <h3>Deployment Targets</h3>
            <p>Select platform and configure deployment</p>
          </div>
        </CommandCard>

        <CommandCard 
          variant="violet"
          clickable
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'active' : ''}
        >
          <div className="tab-content">
            <TechIcon icon={History} size={32} glow="violet" animated={activeTab === 'history'} />
            <h3>Deployment History</h3>
            <p>View past deployments and logs</p>
          </div>
        </CommandCard>
      </div>

      {/* Content Area */}
      <div className="deploy-content-wrapper">
        {activeTab === 'targets' && <DeploymentTargets onSelectTarget={handleTargetSelect} />}
        {activeTab === 'history' && <DeploymentHistory />}
      </div>
    </div>
  );
}

export default DeployWorkflow;

