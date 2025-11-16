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

function ModelLibrary() {
  const { results, clearResults, removeResult, loadResults } = useModelLibrary();
  const [sortBy, setSortBy] = useState<'quality' | 'speed' | 'memory' | 'date'>('quality');
  const [filterProvider, setFilterProvider] = useState<'all' | 'lm-studio' | 'ollama'>('all');

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const sortedResults = [...results]
    .filter((r) => filterProvider === 'all' || r.provider === filterProvider)
    .sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.quality - a.quality;
        case 'speed':
          return b.tokensPerSecond - a.tokensPerSecond;
        case 'memory':
          return a.memoryUsage - b.memoryUsage;
        case 'date':
          return b.timestamp - a.timestamp;
        default:
          return 0;
      }
    });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return '#4ade80';
    if (quality >= 60) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div>
      <div className="card">
        <h2>📚 Model Library</h2>
        <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
          Your personal library of benchmarked LLM models
        </p>

        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a0a0a0' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No benchmarks yet</p>
            <p>Run benchmarks to build your model library</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#c0c0c0', fontSize: '0.85rem' }}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(30, 30, 45, 0.6)',
                    border: '1px solid rgba(100, 100, 150, 0.2)',
                    borderRadius: '8px',
                    color: '#e0e0e0',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="quality">Quality Score</option>
                  <option value="speed">Speed (Tokens/s)</option>
                  <option value="memory">Memory Usage</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#c0c0c0', fontSize: '0.85rem' }}>
                  Filter Provider
                </label>
                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value as any)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(30, 30, 45, 0.6)',
                    border: '1px solid rgba(100, 100, 150, 0.2)',
                    borderRadius: '8px',
                    color: '#e0e0e0',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Providers</option>
                  <option value="lm-studio">LM Studio</option>
                  <option value="ollama">Ollama</option>
                </select>
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  className="button"
                  onClick={clearResults}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Model Name</th>
                    <th>Provider</th>
                    <th>Quality</th>
                    <th>Speed</th>
                    <th>Latency</th>
                    <th>Memory</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((result, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{result.modelName}</strong>
                      </td>
                      <td>
                        <span className={`status-badge ${result.provider === 'lm-studio' ? 'installed' : 'not-installed'}`}>
                          {result.provider}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: getQualityColor(result.quality), fontWeight: '600' }}>
                          {result.quality}/100
                        </span>
                      </td>
                      <td>{result.tokensPerSecond.toFixed(2)} tok/s</td>
                      <td>{result.latency.toFixed(0)} ms</td>
                      <td>{result.memoryUsage.toFixed(2)} GB</td>
                      <td style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
                        {formatDate(result.timestamp)}
                      </td>
                      <td>
                        <button
                          onClick={() => removeResult(index)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(30, 30, 45, 0.4)', borderRadius: '8px' }}>
              <strong>Total Models:</strong> {results.length} |{' '}
              <strong>Best Quality:</strong>{' '}
              {results.length > 0
                ? `${sortedResults[0].modelName} (${sortedResults[0].quality}/100)`
                : 'N/A'}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>💡 Tips</h2>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Benchmark models multiple times to get accurate averages</li>
          <li>Compare models with similar parameter counts for fair comparison</li>
          <li>Consider memory usage when choosing models for your system</li>
          <li>Quality scores combine speed and latency for overall performance</li>
        </ul>
      </div>
    </div>
  );
}

export default ModelLibrary;

