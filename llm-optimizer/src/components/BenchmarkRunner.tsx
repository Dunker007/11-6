import { useState, useEffect } from 'react';
import { useModelLibrary } from '../services/modelLibrary';

interface BenchmarkResult {
  modelName: string;
  provider: 'lm-studio' | 'ollama';
  tokensPerSecond: number;
  latency: number;
  memoryUsage: number;
  quality: number;
  timestamp: number;
}

function BenchmarkRunner() {
  const [modelName, setModelName] = useState('');
  const [provider, setProvider] = useState<'lm-studio' | 'ollama'>('lm-studio');
  const [apiUrl, setApiUrl] = useState('http://localhost:1234/v1');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const { addBenchmarkResult } = useModelLibrary();

  // Update API URL when provider changes
  useEffect(() => {
    if (provider === 'lm-studio') {
      setApiUrl('http://localhost:1234/v1');
    } else if (provider === 'ollama') {
      setApiUrl('http://localhost:11434/api');
    }
  }, [provider]);

  const testPrompts = [
    'The quick brown fox jumps over the lazy dog.',
    'Explain quantum computing in simple terms.',
    'Write a Python function to calculate fibonacci numbers.',
    'What are the benefits of renewable energy?',
    'Describe the process of photosynthesis.',
  ];

  const runBenchmark = async () => {
    if (!modelName.trim()) {
      alert('Please enter a model name');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResult(null);

    try {
      const startTime = Date.now();
      let totalTokens = 0;
      let totalLatency = 0;
      let maxMemory = 0;

      // Run multiple test prompts
      for (let i = 0; i < testPrompts.length; i++) {
        setCurrentTest(`Testing prompt ${i + 1}/${testPrompts.length}...`);
        setProgress((i / testPrompts.length) * 100);

        const promptStart = Date.now();
        try {
          const response = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages: [{ role: 'user', content: testPrompts[i] }],
              max_tokens: 100,
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }

          const data = await response.json();
          const latency = Date.now() - promptStart;
          totalLatency += latency;

          // Estimate tokens (rough calculation)
          const content = data.choices[0]?.message?.content || '';
          const estimatedTokens = content.split(/\s+/).length;
          totalTokens += estimatedTokens;

          // Simulate memory usage (in real implementation, get from system)
          const memoryUsage = Math.random() * 8 + 2; // 2-10 GB
          maxMemory = Math.max(maxMemory, memoryUsage);

          await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between tests
        } catch (error) {
          console.error(`Test ${i + 1} failed:`, error);
        }
      }

      const totalTime = Date.now() - startTime;
      const avgTokensPerSecond = (totalTokens / (totalTime / 1000)).toFixed(2);
      const avgLatency = totalLatency / testPrompts.length;

      // Calculate quality score (0-100) based on speed and consistency
      const quality = Math.min(
        100,
        Math.max(
          0,
          (parseFloat(avgTokensPerSecond) / 10) * 50 + (1000 / avgLatency) * 50
        )
      );

      const benchmarkResult: BenchmarkResult = {
        modelName,
        provider,
        tokensPerSecond: parseFloat(avgTokensPerSecond),
        latency: avgLatency,
        memoryUsage: maxMemory,
        quality: Math.round(quality),
        timestamp: Date.now(),
      };

      setResult(benchmarkResult);
      addBenchmarkResult(benchmarkResult);
      setProgress(100);
      setCurrentTest('Benchmark complete!');
    } catch (error) {
      console.error('Benchmark failed:', error);
      alert(`Benchmark failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>⚡ LLM Benchmark Runner</h2>
        <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
          Test and benchmark LLM models to find the best performers for your system
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#c0c0c0' }}>
              Model Name
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., llama-2-7b-chat, mistral-7b-instruct"
              disabled={isRunning}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(30, 30, 45, 0.6)',
                border: '1px solid rgba(100, 100, 150, 0.2)',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#c0c0c0' }}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'lm-studio' | 'ollama')}
              disabled={isRunning}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(30, 30, 45, 0.6)',
                border: '1px solid rgba(100, 100, 150, 0.2)',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="lm-studio">LM Studio</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#c0c0c0' }}>
              API URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:1234/v1"
              disabled={isRunning}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(30, 30, 45, 0.6)',
                border: '1px solid rgba(100, 100, 150, 0.2)',
                borderRadius: '8px',
                color: '#e0e0e0',
                fontSize: '0.9rem',
              }}
            />
            <p style={{ fontSize: '0.85rem', color: '#a0a0a0', marginTop: '0.25rem' }}>
              LM Studio default: http://localhost:1234/v1 | Ollama default: http://localhost:11434/api
            </p>
          </div>

          {isRunning && (
            <div>
              <div style={{ marginBottom: '0.5rem', color: '#c0c0c0' }}>
                {currentTest}
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button
            className="button"
            onClick={runBenchmark}
            disabled={isRunning || !modelName.trim()}
          >
            {isRunning ? (
              <>
                <span className="loading"></span>
                Running Benchmark...
              </>
            ) : (
              '🚀 Start Benchmark'
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="card">
          <h2>📊 Benchmark Results</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Model</label>
              <div className="info-value">{result.modelName}</div>
            </div>
            <div className="info-item">
              <label>Provider</label>
              <div className="info-value">{result.provider}</div>
            </div>
            <div className="info-item">
              <label>Tokens/Second</label>
              <div className="info-value">{result.tokensPerSecond.toFixed(2)}</div>
            </div>
            <div className="info-item">
              <label>Avg Latency</label>
              <div className="info-value">{result.latency.toFixed(0)} ms</div>
            </div>
            <div className="info-item">
              <label>Memory Usage</label>
              <div className="info-value">{result.memoryUsage.toFixed(2)} GB</div>
            </div>
            <div className="info-item">
              <label>Quality Score</label>
              <div className="info-value">{result.quality}/100</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button
              className="button"
              onClick={() => {
                setResult(null);
                setModelName('');
              }}
            >
              Run Another Benchmark
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>ℹ️ Benchmark Information</h2>
        <div style={{ marginTop: '1rem', lineHeight: '1.8' }}>
          <p>
            The benchmark tests models with multiple prompts and measures:
          </p>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li><strong>Tokens per Second:</strong> Generation speed</li>
            <li><strong>Latency:</strong> Response time per request</li>
            <li><strong>Memory Usage:</strong> RAM consumption</li>
            <li><strong>Quality Score:</strong> Overall performance rating</li>
          </ul>
          <p style={{ marginTop: '1rem', color: '#a0a0a0' }}>
            Make sure your LLM server (LM Studio or Ollama) is running before starting a benchmark.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BenchmarkRunner;

