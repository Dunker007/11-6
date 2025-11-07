import { useEffect, useState } from 'react';
import { useActivityStore } from '../../services/activity/activityStore';
import { TrendingUp, Activity, Zap } from 'lucide-react';
import '../../styles/RealtimeMetrics.css';

interface MetricData {
  hour: string;
  fileOps: number;
  aiQueries: number;
  builds: number;
}

function RealtimeMetrics() {
  const { activities } = useActivityStore();
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [totalToday, setTotalToday] = useState({ files: 0, ai: 0, builds: 0 });

  useEffect(() => {
    // Get activities from last 6 hours, grouped by hour
    const now = Date.now();
    const sixHoursAgo = now - (6 * 3600000);
    
    const hourlyData: Record<string, MetricData> = {};
    
    // Initialize last 6 hours
    for (let i = 5; i >= 0; i--) {
      const time = new Date(now - (i * 3600000));
      const hour = time.getHours().toString().padStart(2, '0') + ':00';
      hourlyData[hour] = { hour, fileOps: 0, aiQueries: 0, builds: 0 };
    }

    // Count activities
    const todayStart = new Date().setHours(0, 0, 0, 0);
    let filesCount = 0;
    let aiCount = 0;
    let buildsCount = 0;

    activities.forEach(activity => {
      if (activity.timestamp >= sixHoursAgo) {
        const time = new Date(activity.timestamp);
        const hour = time.getHours().toString().padStart(2, '0') + ':00';
        
        if (hourlyData[hour]) {
          if (activity.type === 'file') hourlyData[hour].fileOps++;
          if (activity.type === 'ai') hourlyData[hour].aiQueries++;
          if (activity.type === 'build') hourlyData[hour].builds++;
        }
      }

      // Count today's totals
      if (activity.timestamp >= todayStart) {
        if (activity.type === 'file') filesCount++;
        if (activity.type === 'ai') aiCount++;
        if (activity.type === 'build') buildsCount++;
      }
    });

    setMetrics(Object.values(hourlyData));
    setTotalToday({ files: filesCount, ai: aiCount, builds: buildsCount });
  }, [activities]);

  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...metrics.map(m => Math.max(m.fileOps, m.aiQueries, m.builds)),
    1
  );

  return (
    <div className="realtime-metrics">
      <div className="metrics-header">
        <TrendingUp size={20} className="metrics-icon" />
        <h3 className="metrics-title">Activity Metrics</h3>
      </div>

      {/* Today's Summary */}
      <div className="metrics-summary">
        <div className="summary-card">
          <Activity size={16} className="summary-icon file" />
          <div className="summary-content">
            <div className="summary-value">{totalToday.files}</div>
            <div className="summary-label">File Operations</div>
          </div>
        </div>
        <div className="summary-card">
          <Zap size={16} className="summary-icon ai" />
          <div className="summary-content">
            <div className="summary-value">{totalToday.ai}</div>
            <div className="summary-label">AI Queries</div>
          </div>
        </div>
        <div className="summary-card">
          <Activity size={16} className="summary-icon build" />
          <div className="summary-content">
            <div className="summary-value">{totalToday.builds}</div>
            <div className="summary-label">Build Tasks</div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="metrics-chart">
        <div className="chart-title">Last 6 Hours</div>
        <div className="chart-container">
          {metrics.map((data, index) => {
            const fileHeight = (data.fileOps / maxValue) * 100;
            const aiHeight = (data.aiQueries / maxValue) * 100;
            const buildHeight = (data.builds / maxValue) * 100;

            return (
              <div key={index} className="chart-bar-group">
                <div className="chart-bars">
                  <div 
                    className="chart-bar file" 
                    style={{ height: `${fileHeight}%` }}
                    title={`${data.fileOps} file ops`}
                  >
                    {data.fileOps > 0 && <span className="bar-value">{data.fileOps}</span>}
                  </div>
                  <div 
                    className="chart-bar ai" 
                    style={{ height: `${aiHeight}%` }}
                    title={`${data.aiQueries} AI queries`}
                  >
                    {data.aiQueries > 0 && <span className="bar-value">{data.aiQueries}</span>}
                  </div>
                  <div 
                    className="chart-bar build" 
                    style={{ height: `${buildHeight}%` }}
                    title={`${data.builds} builds`}
                  >
                    {data.builds > 0 && <span className="bar-value">{data.builds}</span>}
                  </div>
                </div>
                <div className="chart-label">{data.hour}</div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color file"></span>
            <span className="legend-label">Files</span>
          </div>
          <div className="legend-item">
            <span className="legend-color ai"></span>
            <span className="legend-label">AI</span>
          </div>
          <div className="legend-item">
            <span className="legend-color build"></span>
            <span className="legend-label">Builds</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealtimeMetrics;

