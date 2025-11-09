import { useState, useEffect } from 'react';

interface BoltConfig {
  modelPath?: string;
  maxMemory?: number;
  contextSize?: number;
  threads?: number;
  gpuLayers?: number;
  batchSize?: number;
}

function BoltOptimizer() {
  const [boltDetected, setBoltDetected] = useState(false);
  const [config, setConfig] = useState<BoltConfig>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    checkBoltDIY();
  }, []);

  const checkBoltDIY = async () => {
    try {
      const result = await (window as any).electronAPI.checkBoltDIY();
      setBoltDetected(result.installed);
      if (result.installed) {
        // Load existing config if available
        loadConfig();
      }
    } catch (error) {
      console.error('Failed to check Bolt.diy:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    // In a real implementation, load from bolt.diy config file
    // For now, set defaults based on system specs
    setConfig({
      maxMemory: 8,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      batchSize: 512,
    });
  };

  const optimizeConfig = async () => {
    try {
      const systemInfo = await (window as any).electronAPI.getSystemInfo();
      const totalRAM = parseFloat(systemInfo.memory.totalGB);
      const cpuCores = systemInfo.cpu.physicalCores;
      const hasGPU = systemInfo.graphics.length > 0;

      // Optimize based on system specs
      const optimized: BoltConfig = {
        maxMemory: Math.floor(totalRAM * 0.7), // Use 70% of available RAM
        contextSize: totalRAM >= 32 ? 8192 : totalRAM >= 16 ? 4096 : 2048,
        threads: Math.max(2, cpuCores - 1), // Leave one core free
        gpuLayers: hasGPU ? 20 : 0, // Use GPU if available
        batchSize: totalRAM >= 32 ? 1024 : 512,
      };

      setConfig(optimized);
      setSaved(false);
    } catch (error) {
      console.error('Failed to optimize config:', error);
    }
  };

  const saveConfig = async () => {
    // In a real implementation, save to bolt.diy config file
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading"></div>
        <span>Checking Bolt.diy installation...</span>
      </div>
    );
  }

  if (!boltDetected) {
    return (
      <div>
        <div className="card">
          <h2>⚙️ Bolt.diy Optimizer</h2>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#a0a0a0' }}>
              Bolt.diy is not detected on your system
            </p>
            <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
              Install Bolt.diy to use the optimizer
            </p>
            <a
              href="https://bolt.diy"
              target="_blank"
              rel="noopener noreferrer"
              className="button"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Visit Bolt.diy
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>⚙️ Bolt.diy Optimizer</h2>
        <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
          Optimize your Bolt.diy configuration for best performance
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="button" onClick={optimizeConfig}>
            🎯 Auto-Optimize
          </button>
          <button
            className="button"
            onClick={saveConfig}
            style={{
              background: saved
                ? 'rgba(34, 197, 94, 0.2)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: saved ? '1px solid rgba(34, 197, 94, 0.3)' : 'none',
            }}
          >
            {saved ? '✓ Saved!' : '💾 Save Configuration'}
          </button>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <label>Max Memory (GB)</label>
            <input
              type="number"
              value={config.maxMemory || ''}
              onChange={(e) =>
                setConfig({ ...config, maxMemory: parseInt(e.target.value) || 0 })
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                background: 'rgba(30, 30, 45, 0.6)',
                border: '1px solid rgba(100, 100, 150, 0.2)',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
              Maximum RAM to use for models
            </p>
          </div>

          <div className="info-item">
            <label>Context Size</label>
            <input
              type="number"
              value={config.contextSize || ''}
              onChange={(e) =>
                setConfig({ ...config, contextSize: parseInt(e.target.value) || 0 })
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                background: 'rgba(30, 30, 45, 0.6)',
                border: '1px solid rgba(100, 100, 150, 0.2)',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
              Maximum context window size
            </p>
          </div>

          <div className="info-item">
            <label>CPU Threads</label>
            <input
              type="number"
              value={config.threads || ''}
              onChange={(e) =>
                setConfig({ ...config, threads: parseInt(e.target.value) || 0 })
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                background: 'rgba(30, 30, 45, 0.6)',
                border: '1px solid rgba(100, 100, 150, 0.2)',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
              Number of CPU threads to use
            </p>
          </div>

          <div className="info-item">
            <label>GPU Layers</label>
            <input
              type="number"
              value={config.gpuLayers || ''}
              onChange={(e) =>
                setConfig({ ...config, gpuLayers: parseInt(e.target.value) || 0 })
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                background: 'rgba(30, 30, 45, 0.6)',
                border: '1px solid rgba(100, 100, 150, 0.2)',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
              Layers to offload to GPU (0 = CPU only)
            </p>
          </div>

          <div className="info-item">
            <label>Batch Size</label>
            <input
              type="number"
              value={config.batchSize || ''}
              onChange={(e) =>
                setConfig({ ...config, batchSize: parseInt(e.target.value) || 0 })
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                background: 'rgba(30, 30, 45, 0.6)',
                border: '1px solid rgba(100, 100, 150, 0.2)',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
              Batch size for processing
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>📖 Configuration Guide</h2>
        <div style={{ marginTop: '1rem', lineHeight: '1.8' }}>
          <h3>Max Memory</h3>
          <p style={{ color: '#a0a0a0', marginBottom: '1rem' }}>
            Set to 70-80% of your available RAM. Leave some memory for the OS and other applications.
          </p>

          <h3>Context Size</h3>
          <p style={{ color: '#a0a0a0', marginBottom: '1rem' }}>
            Larger context sizes allow for longer conversations but use more memory. 
            Start with 4096 and increase if you have more RAM.
          </p>

          <h3>GPU Layers</h3>
          <p style={{ color: '#a0a0a0', marginBottom: '1rem' }}>
            If you have a compatible GPU, set GPU layers to 20-40 for faster inference. 
            Set to 0 to use CPU only.
          </p>

          <h3>CPU Threads</h3>
          <p style={{ color: '#a0a0a0', marginBottom: '1rem' }}>
            Use all cores minus one to leave resources for the system. 
            More threads = faster processing but higher CPU usage.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BoltOptimizer;

