import { useEffect, useState } from 'react';
import type { Deployment } from '@/types/deploy';
import '../../styles/DeployWorkflow.css';

interface LiveDeploymentProps {
  deployment: Deployment;
}

function LiveDeployment({ deployment }: LiveDeploymentProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');

  useEffect(() => {
    if (deployment.status === 'pending' || deployment.status === 'building' || deployment.status === 'deploying') {
      const interval = setInterval(() => {
        if (deployment.status === 'building') {
          setProgress(50);
          setCurrentStep('Building project...');
        } else if (deployment.status === 'deploying') {
          setProgress(75);
          setCurrentStep('Deploying to production...');
        } else {
          setProgress(100);
          setCurrentStep('Deployment complete!');
          clearInterval(interval);
        }
      }, 500);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setCurrentStep(deployment.status === 'success' ? 'Deployment complete!' : 'Deployment failed');
    }
  }, [deployment.status]);

  const getStatusColor = () => {
    switch (deployment.status) {
      case 'success':
        return 'var(--success-color, #22c55e)';
      case 'failed':
        return 'var(--error-color, #ef4444)';
      default:
        return 'var(--accent-primary, #8b5cf6)';
    }
  };

  return (
    <div className="live-deployment">
      <div className="live-header">
        <h3>🚀 Live Deployment</h3>
        <span className={`status-badge ${deployment.status}`}>{deployment.status}</span>
      </div>

      <div className="deployment-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              backgroundColor: getStatusColor(),
            }}
          />
        </div>
        <div className="progress-info">
          <span className="progress-text">{currentStep}</span>
          <span className="progress-percent">{progress}%</span>
        </div>
      </div>

      <div className="deployment-details">
        <div className="detail-item">
          <strong>Target:</strong> {deployment.targetName}
        </div>
        <div className="detail-item">
          <strong>Started:</strong> {deployment.createdAt.toLocaleTimeString()}
        </div>
        {deployment.url && (
          <div className="detail-item">
            <strong>URL:</strong>{' '}
            <a href={deployment.url} target="_blank" rel="noopener noreferrer">
              {deployment.url}
            </a>
          </div>
        )}
      </div>

      {deployment.buildLog && deployment.buildLog.length > 0 && (
        <div className="build-log">
          <h4>Build Log</h4>
          <div className="log-content">
            {deployment.buildLog.map((line, index) => (
              <div key={index} className="log-line">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveDeployment;

