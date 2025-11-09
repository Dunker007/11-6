import { useState, useEffect } from 'react';

interface DetectionResult {
  installed: boolean;
  path?: string | null;
  version?: string | null;
}

function LLMDetection() {
  const [lmStudio, setLMStudio] = useState<DetectionResult | null>(null);
  const [ollama, setOllama] = useState<DetectionResult | null>(null);
  const [boltDIY, setBoltDIY] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectAll();
  }, []);

  const detectAll = async () => {
    setLoading(true);
    try {
      const [lmResult, ollamaResult, boltResult] = await Promise.all([
        (window as any).electronAPI.checkLMStudio(),
        (window as any).electronAPI.checkOllama(),
        (window as any).electronAPI.checkBoltDIY(),
      ]);

      setLMStudio(lmResult);
      setOllama(ollamaResult);
      setBoltDIY(boltResult);
    } catch (error) {
      console.error('Failed to detect LLM tools:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading"></div>
        <span>Detecting LLM tools...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>🔍 LLM Tool Detection</h2>
        <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
          Detecting installed LLM tools and their configurations
        </p>

        <div className="info-grid">
          <div className="info-item">
            <label>LM Studio</label>
            <div style={{ marginTop: '0.5rem' }}>
              <span
                className={`status-badge ${
                  lmStudio?.installed ? 'installed' : 'not-installed'
                }`}
              >
                {lmStudio?.installed ? '✓ Installed' : '✗ Not Installed'}
              </span>
            </div>
            {lmStudio?.installed && lmStudio.path && (
              <value style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                Path: {lmStudio.path}
              </value>
            )}
          </div>

          <div className="info-item">
            <label>Ollama</label>
            <div style={{ marginTop: '0.5rem' }}>
              <span
                className={`status-badge ${
                  ollama?.installed ? 'installed' : 'not-installed'
                }`}
              >
                {ollama?.installed ? '✓ Installed' : '✗ Not Installed'}
              </span>
            </div>
            {ollama?.installed && ollama.version && (
              <value style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                Version: {ollama.version}
              </value>
            )}
          </div>

          <div className="info-item">
            <label>Bolt.diy</label>
            <div style={{ marginTop: '0.5rem' }}>
              <span
                className={`status-badge ${
                  boltDIY?.installed ? 'installed' : 'not-installed'
                }`}
              >
                {boltDIY?.installed ? '✓ Installed' : '✗ Not Installed'}
              </span>
            </div>
            {boltDIY?.installed && boltDIY.path && (
              <value style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                Path: {boltDIY.path}
              </value>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button className="button" onClick={detectAll}>
            🔄 Re-detect Tools
          </button>
        </div>
      </div>

      <div className="card">
        <h2>📋 Setup Instructions</h2>
        <div style={{ marginTop: '1rem' }}>
          {!lmStudio?.installed && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3>LM Studio</h3>
              <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                <li>Download LM Studio from <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>lmstudio.ai</a></li>
                <li>Install and launch LM Studio</li>
                <li>Download models from the built-in model browser</li>
                <li>Start a local server to use models via API</li>
              </ol>
            </div>
          )}

          {!ollama?.installed && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3>Ollama</h3>
              <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                <li>Download Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>ollama.ai</a></li>
                <li>Install Ollama</li>
                <li>Run <code style={{ background: 'rgba(30,30,45,0.6)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>ollama pull &lt;model-name&gt;</code> to download models</li>
                <li>Use <code style={{ background: 'rgba(30,30,45,0.6)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>ollama serve</code> to start the API server</li>
              </ol>
            </div>
          )}

          {!boltDIY?.installed && (
            <div>
              <h3>Bolt.diy</h3>
              <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                <li>Install Bolt.diy from <a href="https://bolt.diy" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>bolt.diy</a></li>
                <li>Configure your setup in the Bolt.diy directory</li>
                <li>Use the optimizer tab to fine-tune your configuration</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LLMDetection;

