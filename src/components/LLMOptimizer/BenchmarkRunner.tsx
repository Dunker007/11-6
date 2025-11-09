import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Play, TimerReset, XCircle } from 'lucide-react';
import type { BenchmarkResult, ModelCatalogEntry } from '@/types/optimizer';
import '../../styles/LLMOptimizer.css';

interface BenchmarkRunnerProps {
  catalog: ModelCatalogEntry[];
  results: BenchmarkResult[];
  isRunning: boolean;
  onRun: (modelIds: string[]) => void;
  error?: string | null;
  initialSelection?: string[];
}

const BenchmarkRunner = ({ catalog = [], results = [], isRunning = false, onRun, error, initialSelection }: BenchmarkRunnerProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialSelection && initialSelection.length > 0) {
      setSelectedIds((prev) => {
        const merged = new Set([...prev, ...initialSelection]);
        return Array.from(merged);
      });
    }
  }, [initialSelection]);

  const handleToggleModel = (modelId: string) => {
    setSelectedIds((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  const handleRun = () => {
    if (selectedIds.length === 0) return;
    onRun(selectedIds);
  };

  const latestResults = useMemo(() => {
    const map = new Map<string, BenchmarkResult>();
    results.forEach((result) => map.set(result.modelId, result));
    return Array.from(map.values());
  }, [results]);

  return (
    <div className="benchmark-runner-card">
      <div className="benchmark-header">
        <div className="benchmark-title">
          <BarChart3 size={18} />
          <h3>Benchmark Runner</h3>
        </div>
        <button
          className="benchmark-run-button"
          onClick={handleRun}
          disabled={selectedIds.length === 0 || isRunning}
        >
          {isRunning ? (
            <>
              <Activity size={16} className="spinning" />
              Running…
            </>
          ) : (
            <>
              <Play size={16} />
              Run benchmark
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="benchmark-error">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="benchmark-select-list">
        {catalog.map((entry) => (
          <label key={entry.id} className="benchmark-select-item">
            <input
              type="checkbox"
              checked={selectedIds.includes(entry.id)}
              onChange={() => handleToggleModel(entry.id)}
            />
            <span className="benchmark-model-name">{entry.displayName}</span>
            <span className="benchmark-meta">
              {entry.provider} • {entry.sizeGB > 0 ? `${entry.sizeGB} GB` : 'Cloud'} •{' '}
              {entry.contextWindow.toLocaleString()} ctx
            </span>
          </label>
        ))}
      </div>

      {latestResults.length > 0 && (
        <div className="benchmark-results">
          <div className="results-header">
            <TimerReset size={16} />
            <span>Recent measurements</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Latency (ms)</th>
                <th>Throughput (tok/s)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {latestResults.map((result) => (
                <tr key={result.modelId}>
                  <td>
                    <div className="benchmark-model-cell">
                      <span className="model-name">{result.modelName}</span>
                      <span className="model-provider">{result.provider}</span>
                    </div>
                  </td>
                  <td>{result.averageLatencyMs ? result.averageLatencyMs.toFixed(0) : '—'}</td>
                  <td>
                    {result.averageThroughput
                      ? result.averageThroughput.toFixed(1)
                      : '—'}
                  </td>
                  <td>
                    <span className={`benchmark-status ${result.status}`}>
                      {result.status === 'success' && 'Success'}
                      {result.status === 'partial' && 'Partial'}
                      {result.status === 'error' && 'Error'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BenchmarkRunner;

