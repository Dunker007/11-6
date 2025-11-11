import { useState, useEffect, useMemo } from 'react';
import { Cpu, Thermometer, TrendingUp } from 'lucide-react';
import { useHealthStore } from '@/services/health/healthStore';
import '../../styles/LLMOptimizer.css';

interface GPUDataPoint {
  timestamp: Date;
  utilization: number | null;
  vramUsed: number | null;
  vramTotal: number | null;
  temperature: number | null;
}

const GPUMonitorDetailed = () => {
  const { stats, getSystemStats } = useHealthStore();
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [gpuHistory, setGpuHistory] = useState<GPUDataPoint[]>([]);

  useEffect(() => {
    getSystemStats();
    const interval = setInterval(() => {
      getSystemStats();
    }, 2000);

    return () => clearInterval(interval);
  }, [getSystemStats]);

  // Update GPU history
  useEffect(() => {
    if (stats?.gpu) {
      const newPoint: GPUDataPoint = {
        timestamp: new Date(),
        utilization: stats.gpu.utilization ?? null,
        vramUsed: stats.gpu.memoryUsedGB ?? null,
        vramTotal: stats.gpu.memoryTotalGB ?? stats.gpu.memoryGB ?? null,
        temperature: stats.gpu.temperature ?? null,
      };

      setGpuHistory((prev) => {
        const updated = [...prev, newPoint];
        // Keep only data within the selected time range
        const rangeMs = timeRange === '1h' ? 3600000 : timeRange === '6h' ? 21600000 : 86400000;
        const cutoff = new Date(Date.now() - rangeMs);
        return updated.filter((point) => point.timestamp >= cutoff);
      });
    }
  }, [stats, timeRange]);

  const gpuInfo = stats?.gpu;

  // Calculate average utilization - must be before early return
  const avgUtilization = useMemo(() => {
    if (!gpuInfo) return null;
    const values = gpuHistory.map((p) => p.utilization).filter((v) => v !== null) as number[];
    return values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : null;
  }, [gpuHistory, gpuInfo]);

  const currentVRAM = stats?.gpu?.memoryUsedGB ?? null;
  const totalVRAM = stats?.gpu?.memoryTotalGB ?? stats?.gpu?.memoryGB ?? null;

  if (!gpuInfo?.name) {
    return (
      <div className="gpu-monitor-detailed-card">
        <div className="card-header">
          <h3>GPU Detailed Monitor</h3>
        </div>
        <div className="card-content">
          <p className="empty-message">GPU not detected</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions
  const chartHeight = 200;
  const chartWidth = 100;
  const padding = 20;

  // Render utilization chart
  const renderUtilizationChart = () => {
    if (gpuHistory.length < 2) return null;

    const points = gpuHistory.map((point, index) => {
      const x = (index / (gpuHistory.length - 1)) * (chartWidth - padding * 2) + padding;
      const y = point.utilization !== null
        ? chartHeight - padding - (point.utilization / 100) * (chartHeight - padding * 2)
        : chartHeight - padding;
      return { x, y, value: point.utilization };
    });

    const pathData = points
      .filter((p) => p.value !== null)
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="utilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--violet-500)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--violet-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
          fill="url(#utilGradient)"
          opacity="0.5"
        />
        <path
          d={pathData}
          fill="none"
          stroke="var(--violet-500)"
          strokeWidth="2"
        />
        {points.map((point, i) => (
          point.value !== null && (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="var(--violet-500)"
            />
          )
        ))}
      </svg>
    );
  };

  // Render VRAM chart
  const renderVRAMChart = () => {
    if (gpuHistory.length < 2 || !gpuInfo.memoryTotalGB) return null;

    const points = gpuHistory.map((point, index) => {
      const x = (index / (gpuHistory.length - 1)) * (chartWidth - padding * 2) + padding;
      const usagePercent = point.vramUsed && point.vramTotal
        ? (point.vramUsed / point.vramTotal) * 100
        : 0;
      const y = chartHeight - padding - (usagePercent / 100) * (chartHeight - padding * 2);
      return { x, y, value: usagePercent };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="vramGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--cyan-500)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--cyan-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
          fill="url(#vramGradient)"
          opacity="0.5"
        />
        <path
          d={pathData}
          fill="none"
          stroke="var(--cyan-500)"
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    <div className="gpu-monitor-detailed-card">
      <div className="card-header">
        <div className="header-left">
          <Cpu size={18} />
          <h3>GPU Detailed Monitor</h3>
        </div>
        <div className="time-range-selector">
          {(['1h', '6h', '24h'] as const).map((range) => (
            <button
              key={range}
              className={`range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="card-content">
        <div className="gpu-info-grid">
          <div className="info-item">
            <div className="info-label">GPU Model</div>
            <div className="info-value">{gpuInfo.name}</div>
          </div>
          {gpuInfo.memoryGB && (
            <div className="info-item">
              <div className="info-label">Total VRAM</div>
              <div className="info-value">{gpuInfo.memoryGB} GB</div>
            </div>
          )}
          {avgUtilization !== null && (
            <div className="info-item">
              <div className="info-label">Avg Utilization</div>
              <div className="info-value">{avgUtilization}%</div>
            </div>
          )}
          {currentVRAM !== null && totalVRAM !== null && (
            <div className="info-item">
              <div className="info-label">VRAM Usage</div>
              <div className="info-value">
                {currentVRAM.toFixed(1)} / {totalVRAM} GB
              </div>
            </div>
          )}
        </div>

        <div className="charts-grid">
          <div className="chart-container">
            <div className="chart-header">
              <TrendingUp size={14} />
              <span>GPU Utilization</span>
            </div>
            <div className="chart-wrapper">
              {renderUtilizationChart() || (
                <div className="chart-empty">Collecting data...</div>
              )}
            </div>
          </div>

          {totalVRAM && (
            <div className="chart-container">
              <div className="chart-header">
                <Cpu size={14} />
                <span>VRAM Usage</span>
              </div>
              <div className="chart-wrapper">
                {renderVRAMChart() || (
                  <div className="chart-empty">Collecting data...</div>
                )}
              </div>
            </div>
          )}

          {gpuInfo.temperature !== undefined && (
            <div className="chart-container">
              <div className="chart-header">
                <Thermometer size={14} />
                <span>Temperature</span>
              </div>
              <div className="temp-display">
                <span className="temp-value">{Math.round(gpuInfo.temperature)}°C</span>
                <div className="temp-bar">
                  <div
                    className="temp-fill"
                    style={{
                      width: `${Math.min((gpuInfo.temperature / 100) * 100, 100)}%`,
                      background:
                        gpuInfo.temperature > 85
                          ? 'var(--red-500)'
                          : gpuInfo.temperature > 70
                          ? 'var(--amber-500)'
                          : 'var(--emerald-500)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GPUMonitorDetailed;

