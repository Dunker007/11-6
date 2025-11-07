import SystemOverview from '../Monitor/SystemOverview';
import ProjectHealthGrid from '../Monitor/ProjectHealthGrid';
import LLMStatusPanel from '../Monitor/LLMStatusPanel';
import RealtimeMetrics from '../Monitor/RealtimeMetrics';
import AlertsPanel from '../Monitor/AlertsPanel';
import '../../styles/HealthDashboard.css';

function HealthDashboard() {

  return (
    <div className="health-dashboard monitor-command-center">
      {/* Hero Section - System Overview */}
      <div className="monitor-hero">
        <SystemOverview />
      </div>

      {/* Main Grid Layout */}
      <div className="monitor-grid">
        {/* Left Column - Projects & LLM Status */}
        <div className="monitor-column-left">
          <ProjectHealthGrid />
          <LLMStatusPanel />
        </div>

        {/* Right Column - Metrics & Alerts */}
        <div className="monitor-column-right">
          <RealtimeMetrics />
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}

export default HealthDashboard;

