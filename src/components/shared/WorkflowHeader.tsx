import { ReactNode } from 'react';
import TechIcon from '../Icons/TechIcon';
import { ChevronRight } from 'lucide-react';
import '../../styles/WorkflowHeader.css';

interface WorkflowHeaderProps {
  title: string;
  breadcrumbs?: string[];
  actions?: ReactNode;
  statusBadge?: {
    label: string;
    variant: 'success' | 'warning' | 'error' | 'info';
  };
  onBack?: () => void;
}

function WorkflowHeader({ 
  title, 
  breadcrumbs, 
  actions, 
  statusBadge, 
  onBack 
}: WorkflowHeaderProps) {
  return (
    <div className="workflow-header">
      <div className="header-left">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <span className="back-arrow">←</span>
            <span>Back</span>
          </button>
        )}
        
        <div className="header-title-section">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="breadcrumbs">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="breadcrumb-item">
                  {index > 0 && (
                    <TechIcon 
                      icon={ChevronRight} 
                      size={12} 
                      className="breadcrumb-separator"
                    />
                  )}
                  <span className="breadcrumb-text">{crumb}</span>
                </span>
              ))}
            </div>
          )}
          
          <h2 className="header-title">
            <span className="title-line"></span>
            <span className="title-text">{title}</span>
            <span className="title-line"></span>
          </h2>
        </div>

        {statusBadge && (
          <div className={`status-badge ${statusBadge.variant}`}>
            <span className="badge-pulse"></span>
            <span className="badge-label">{statusBadge.label}</span>
          </div>
        )}
      </div>

      {actions && (
        <div className="header-actions">
          {actions}
        </div>
      )}
    </div>
  );
}

export default WorkflowHeader;

