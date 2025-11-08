import '../../styles/StatusWidget.css';

interface StatusWidgetProps {
  label: string;
  status: 'online' | 'offline' | 'warning' | 'loading';
  value?: string | number;
  sublabel?: string;
  compact?: boolean;
}

function StatusWidget({ 
  label, 
  status, 
  value, 
  sublabel, 
  compact = false 
}: StatusWidgetProps) {
  return (
    <div className={`status-widget ${status} ${compact ? 'compact' : ''}`}>
      <div className="widget-led">
        <span className="led-ring"></span>
        <span className="led-core"></span>
      </div>
      
      <div className="widget-content">
        <div className="widget-label">{label}</div>
        {value !== undefined && (
          <div className="widget-value">{value}</div>
        )}
        {sublabel && (
          <div className="widget-sublabel">{sublabel}</div>
        )}
      </div>

      <div className="widget-pulse"></div>
    </div>
  );
}

export default StatusWidget;

