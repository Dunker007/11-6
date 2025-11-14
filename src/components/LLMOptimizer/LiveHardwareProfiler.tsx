import { useState, useEffect, useCallback } from 'react';
import { Activity, Zap, TrendingUp, Play, BarChart3 } from '@/components/Icons/icons';
import { useHealthStore } from '@/services/health/healthStore';
import { useBenchmarkStore } from '@/services/benchmark/benchmarkStore';
import { windowsOptimizer } from '@/services/windows/windowsOptimizer';
import { formatBytes, formatPercent } from '@/utils/formatters';
import BenchmarkSuite from './BenchmarkSuite';
import WindowsOptimizer from './WindowsOptimizer';
import '../../styles/LLMOptimizer.css';

interface DiskInfo {
  mount?: string;
  total: number;
  used: number;
  free: number;
  usage: number;
}

const LiveHardwareProfiler = () => {
  const { stats, isMonitoring, startMonitoring, stopMonitoring, getSystemStats } = useHealthStore();
  const { isRunning, runBenchmarkSuite } = useBenchmarkStore();
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    // Check if Windows
    windowsOptimizer.getSystemInfo().then((info) => {
      setIsWindows(info.isWindows);
    }).catch(() => {
      setIsWindows(false);
    });
  }, []);

  useEffect(() => {
    // Start live monitoring
    if (!isMonitoring) {
      startMonitoring(2000); // Update every 2 seconds
    }

    // Also fetch initial stats
    getSystemStats();

    return () => {
      stopMonitoring();
    };
  }, []); // Empty array prevents re-running on every render

  const handleRunBenchmark = useCallback(async () => {
    setShowBenchmark(true);
    await runBenchmarkSuite();
  }, [runBenchmarkSuite]);

  return (
    <div className="hardware-profiler-card">
      <div className="hardware-profiler-header">
        <div className="hardware-profiler-title">
          <Activity size={18} />
          <h3>Live Hardware Profiler</h3>
          {stats && (
            <span className="hardware-profiler-source" style={{ 
              color: isMonitoring ? 'var(--emerald-400)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isMonitoring ? 'var(--emerald-400)' : 'var(--text-muted)',
                animation: isMonitoring ? 'pulse 2s infinite' : 'none'
              }} />
              {isMonitoring ? 'Live' : 'Paused'}
            </span>
          )}
        </div>
        <div className="hardware-profiler-actions">
          <button
            className="hp-action-button"
            onClick={handleRunBenchmark}
            disabled={isRunning}
            title="Run PC Benchmark Suite"
          >
            <BarChart3 size={16} />
            Benchmark
          </button>
          {isWindows && (
            <button
              className="hp-action-button"
              onClick={() => setShowOptimizer(!showOptimizer)}
              title="Windows Optimization"
            >
              <Zap size={16} />
              Optimize
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="hardware-profiler-grid">
          {/* System Name Tile */}
          {stats.hostname && (
            <div className="hardware-profiler-tile" style={{ gridColumn: '1 / -1' }}>
              <div className="tile-header">
                <Activity size={18} />
                <span>System</span>
              </div>
              <div className="tile-content">
                <span className="tile-primary">{stats.hostname}</span>
                <div className="tile-meta">
                  <span>{stats.processes.running} processes</span>
                  <span>{Math.round(stats.uptime / 3600)}h uptime</span>
                </div>
              </div>
            </div>
          )}

          {/* CPU Tile */}
          <div className="hardware-profiler-tile">
            <div className="tile-header">
              <Activity size={18} />
              <span>CPU</span>
            </div>
            <div className="tile-content">
              <span className="tile-primary">{stats.cpu.model}</span>
              <div className="tile-meta">
                <span>{stats.cpu.cores} cores</span>
                <span>{formatPercent(stats.cpu.usage, 0, true)} usage</span>
                {stats.cpu.temperature && (
                  <span>{Math.round(stats.cpu.temperature)}°C</span>
                )}
              </div>
              <div className="tile-progress">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${stats.cpu.usage}%`,
                    background: stats.cpu.usage > 80 ? 'var(--red-500)' : 
                               stats.cpu.usage > 50 ? 'var(--amber-500)' : 
                               'var(--emerald-500)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Memory Tile */}
          <div className="hardware-profiler-tile">
            <div className="tile-header">
              <TrendingUp size={18} />
              <span>Memory</span>
            </div>
            <div className="tile-content">
              <span className="tile-primary">{formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}</span>
              <div className="tile-meta">
                <span>{formatPercent(stats.memory.usage, 0, true)} used</span>
                <span>{formatBytes(stats.memory.free)} free</span>
              </div>
              <div className="tile-progress">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${stats.memory.usage}%`,
                    background: stats.memory.usage > 85 ? 'var(--red-500)' : 
                               stats.memory.usage > 70 ? 'var(--amber-500)' : 
                               'var(--emerald-500)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Disk Tile */}
          {stats.disk && stats.disk.length > 0 && (
            <div className="hardware-profiler-tile">
              <div className="tile-header">
                <Zap size={18} />
                <span>Disk</span>
              </div>
              <div className="tile-content">
                <span className="tile-primary">{(stats.disk[0] as DiskInfo).mount || 'C:'}</span>
                <div className="tile-meta">
                  <span>{formatBytes((stats.disk[0] as DiskInfo).used)} / {formatBytes((stats.disk[0] as DiskInfo).total)}</span>
                  <span>{formatPercent((stats.disk[0] as DiskInfo).usage, 0, true)} used</span>
                </div>
                <div className="tile-progress">
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: `${(stats.disk[0] as DiskInfo).usage}%`,
                      background: (stats.disk[0] as DiskInfo).usage > 90 ? 'var(--red-500)' : 
                                 (stats.disk[0] as DiskInfo).usage > 75 ? 'var(--amber-500)' : 
                                 'var(--emerald-500)'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* System Info Tile (if hostname not shown) */}
          {!stats.hostname && (
            <div className="hardware-profiler-tile">
              <div className="tile-header">
                <Play size={18} />
                <span>System</span>
              </div>
              <div className="tile-content">
                <span className="tile-primary">{stats.processes.running} processes</span>
                <div className="tile-meta">
                  <span>{Math.round(stats.uptime / 3600)}h uptime</span>
                  <span>{stats.processes.total} total</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showBenchmark && (
        <BenchmarkSuite 
          onClose={() => setShowBenchmark(false)}
        />
      )}

      {showOptimizer && isWindows && (
        <WindowsOptimizer 
          onClose={() => setShowOptimizer(false)}
        />
      )}
    </div>
  );
};

export default LiveHardwareProfiler;

