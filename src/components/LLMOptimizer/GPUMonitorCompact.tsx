import { useEffect, useState, useMemo } from 'react';
import { Cpu, Thermometer } from 'lucide-react';
import { useHealthStore } from '@/services/health/healthStore';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
import '../../styles/LLMOptimizer.css';

const GPUMonitorCompact = () => {
  const { stats, getSystemStats } = useHealthStore();
  const { hardwareProfile } = useLLMOptimizerStore();
  const [gpuInfo, setGpuInfo] = useState<{
    name: string | null;
    memoryGB: number | null;
  } | null>(null);

  useEffect(() => {
    getSystemStats();
    const interval = setInterval(() => {
      getSystemStats();
    }, 2000);

    return () => clearInterval(interval);
  }, [getSystemStats]);

  // Get GPU info from hardware profile or stats
  useEffect(() => {
    if (stats?.gpu) {
      setGpuInfo({
        name: stats.gpu.name,
        memoryGB: stats.gpu.memoryTotalGB || stats.gpu.memoryGB,
      });
    } else if (hardwareProfile?.gpuModel) {
      setGpuInfo({
        name: hardwareProfile.gpuModel,
        memoryGB: hardwareProfile.gpuMemoryGB,
      });
    }
  }, [stats, hardwareProfile]);

  const gpuUtilization = stats?.gpu?.utilization ?? null;
  const vramUsed = stats?.gpu?.memoryUsedGB ?? null;
  const vramTotal = stats?.gpu?.memoryTotalGB ?? stats?.gpu?.memoryGB ?? null;
  const gpuTemp = stats?.gpu?.temperature ?? null;

  const vramUsagePercent = useMemo(() => {
    if (vramUsed !== null && vramTotal !== null && vramTotal > 0) {
      return Math.round((vramUsed / vramTotal) * 100);
    }
    return null;
  }, [vramUsed, vramTotal]);

  if (!gpuInfo?.name) {
    return (
      <div className="sidebar-section">
        <h3>GPU Monitor</h3>
        <div className="compact-gpu-empty">
          <span className="gpu-text">GPU not detected</span>
        </div>
      </div>
    );
  }

  const truncateName = (name: string, maxLength: number = 30) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  return (
    <div className="sidebar-section">
      <h3>GPU Monitor</h3>
      <div className="compact-gpu-monitor">
        <div className="gpu-name" title={gpuInfo.name}>
          {truncateName(gpuInfo.name)}
        </div>

        {gpuUtilization !== null && (
          <div className="gpu-metric">
            <div className="metric-label">
              <Cpu size={12} />
              <span>Utilization</span>
            </div>
            <div className="metric-value">{Math.round(gpuUtilization)}%</div>
            <div className="compact-progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${gpuUtilization}%`,
                  background:
                    gpuUtilization > 80
                      ? 'var(--red-500)'
                      : gpuUtilization > 50
                      ? 'var(--amber-500)'
                      : 'var(--emerald-500)',
                }}
              />
            </div>
          </div>
        )}

        {vramTotal !== null && (
          <div className="gpu-metric">
            <div className="metric-label">
              <span>VRAM</span>
            </div>
            <div className="metric-value">
              {vramUsed !== null
                ? `${vramUsed.toFixed(1)}/${vramTotal} GB`
                : `${vramTotal} GB`}
            </div>
            {vramUsagePercent !== null && (
              <div className="compact-progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${vramUsagePercent}%`,
                    background:
                      vramUsagePercent > 85
                        ? 'var(--red-500)'
                        : vramUsagePercent > 70
                        ? 'var(--amber-500)'
                        : 'var(--emerald-500)',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {gpuTemp !== null && (
          <div className="gpu-metric">
            <div className="metric-label">
              <Thermometer size={12} />
              <span>Temperature</span>
            </div>
            <div className="metric-value">{Math.round(gpuTemp)}°C</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPUMonitorCompact;

