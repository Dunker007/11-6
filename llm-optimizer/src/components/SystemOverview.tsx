import { useState, useEffect } from 'react';

interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: string;
  };
  memory: {
    totalGB: string;
    freeGB: string;
    used: number;
    total: number;
  };
  graphics: Array<{
    model: string;
    vendor: string;
    vram?: number;
    memoryTotal?: number;
  }>;
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
  };
}

function SystemOverview() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const info = await (window as any).electronAPI.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading"></div>
        <span>Loading system information...</span>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="card">
        <p>Failed to load system information</p>
      </div>
    );
  }

  const memoryUsagePercent = ((systemInfo.memory.used / systemInfo.memory.total) * 100).toFixed(1);

  return (
    <div>
      <div className="card">
        <h2>🖥️ System Specifications</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>CPU Manufacturer</label>
            <value>{systemInfo.cpu.manufacturer}</value>
          </div>
          <div className="info-item">
            <label>CPU Model</label>
            <value>{systemInfo.cpu.brand}</value>
          </div>
          <div className="info-item">
            <label>CPU Cores</label>
            <value>{systemInfo.cpu.physicalCores} Physical / {systemInfo.cpu.cores} Logical</value>
          </div>
          <div className="info-item">
            <label>CPU Speed</label>
            <value>{systemInfo.cpu.speed} GHz</value>
          </div>
          <div className="info-item">
            <label>Total RAM</label>
            <value>{systemInfo.memory.totalGB} GB</value>
          </div>
          <div className="info-item">
            <label>Available RAM</label>
            <value>{systemInfo.memory.freeGB} GB</value>
          </div>
          <div className="info-item">
            <label>Memory Usage</label>
            <value>{memoryUsagePercent}%</value>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${memoryUsagePercent}%` }}
              />
            </div>
          </div>
          <div className="info-item">
            <label>Operating System</label>
            <value>{systemInfo.os.distro || systemInfo.os.platform} {systemInfo.os.release}</value>
          </div>
          <div className="info-item">
            <label>Architecture</label>
            <value>{systemInfo.os.arch}</value>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>🎮 Graphics Cards</h2>
        {systemInfo.graphics.length === 0 ? (
          <p>No graphics cards detected</p>
        ) : (
          <div className="info-grid">
            {systemInfo.graphics.map((gpu, index) => (
              <div key={index} className="info-item">
                <label>GPU {index + 1}</label>
                <value>{gpu.vendor} {gpu.model}</value>
                {gpu.vram && (
                  <value style={{ fontSize: '0.9rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
                    VRAM: {gpu.vram} MB
                  </value>
                )}
                {gpu.memoryTotal && (
                  <value style={{ fontSize: '0.9rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
                    Total Memory: {(gpu.memoryTotal / 1024).toFixed(2)} GB
                  </value>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>💡 Recommendations</h2>
        <div style={{ marginTop: '1rem' }}>
          <h3>Based on your system:</h3>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>
              <strong>RAM:</strong> You have {systemInfo.memory.totalGB} GB of RAM. 
              {parseFloat(systemInfo.memory.totalGB) >= 32
                ? ' Excellent for running large models (7B-13B parameters).'
                : parseFloat(systemInfo.memory.totalGB) >= 16
                ? ' Good for medium models (3B-7B parameters).'
                : ' Consider smaller models (1B-3B parameters) or upgrading RAM.'}
            </li>
            <li>
              <strong>GPU:</strong>{' '}
              {systemInfo.graphics.length > 0
                ? `You have ${systemInfo.graphics.length} GPU(s). Consider using GPU acceleration for faster inference.`
                : 'No dedicated GPU detected. You can still run models using CPU, but it will be slower.'}
            </li>
            <li>
              <strong>CPU:</strong> With {systemInfo.cpu.physicalCores} cores, 
              you can run multiple models in parallel or use CPU-based inference efficiently.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SystemOverview;

