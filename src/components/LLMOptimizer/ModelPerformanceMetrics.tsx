import { useMemo } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
import '../../styles/LLMOptimizer.css';

const ModelPerformanceMetrics = () => {
  const { benchmarks } = useLLMOptimizerStore();

  const sortedBenchmarks = useMemo(() => {
    return [...benchmarks].sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [benchmarks]);

  const handleExport = () => {
    const data = JSON.stringify(benchmarks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-results-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (benchmarks.length === 0) {
    return (
      <div className="performance-metrics-card">
        <div className="card-header">
          <BarChart3 size={18} />
          <h3>Model Performance Metrics</h3>
        </div>
        <div className="card-content">
          <p className="empty-message">No benchmark results available. Run benchmarks to see performance metrics.</p>
        </div>
      </div>
    );
  }

  // Calculate averages
  const avgLatency = useMemo(() => {
    const latencies = benchmarks
      .map((b) => b.averageLatencyMs)
      .filter((l) => l !== null) as number[];
    return latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;
  }, [benchmarks]);

  const avgThroughput = useMemo(() => {
    const throughputs = benchmarks
      .map((b) => b.averageThroughput)
      .filter((t) => t !== null && t !== undefined) as number[];
    return throughputs.length > 0
      ? Math.round((throughputs.reduce((a, b) => a + b, 0) / throughputs.length) * 100) / 100
      : null;
  }, [benchmarks]);

  return (
    <div className="performance-metrics-card">
      <div className="card-header">
        <div className="header-left">
          <BarChart3 size={18} />
          <h3>Model Performance Metrics</h3>
        </div>
        <button className="export-btn" onClick={handleExport} title="Export benchmark results">
          <Download size={14} />
          Export
        </button>
      </div>

      <div className="card-content">
        <div className="metrics-summary">
          <div className="summary-item">
            <div className="summary-label">Total Benchmarks</div>
            <div className="summary-value">{benchmarks.length}</div>
          </div>
          {avgLatency !== null && (
            <div className="summary-item">
              <div className="summary-label">Avg Latency</div>
              <div className="summary-value">{avgLatency}ms</div>
            </div>
          )}
          {avgThroughput !== null && (
            <div className="summary-item">
              <div className="summary-label">Avg Throughput</div>
              <div className="summary-value">{avgThroughput} tok/s</div>
            </div>
          )}
        </div>

        <div className="benchmarks-table">
          <div className="table-header">
            <div className="table-col">Model</div>
            <div className="table-col">Provider</div>
            <div className="table-col">Latency</div>
            <div className="table-col">Throughput</div>
            <div className="table-col">Status</div>
            <div className="table-col">Date</div>
          </div>
          <div className="table-body">
            {sortedBenchmarks.map((benchmark) => (
              <div key={benchmark.modelId} className="table-row">
                <div className="table-col" title={benchmark.modelName}>
                  <span className="model-name-truncated">
                    {benchmark.modelName.length > 25
                      ? `${benchmark.modelName.substring(0, 25)}...`
                      : benchmark.modelName}
                  </span>
                </div>
                <div className="table-col">
                  <span className="provider-badge">{benchmark.provider}</span>
                </div>
                <div className="table-col">
                  {benchmark.averageLatencyMs !== null ? (
                    <span className="metric-value">
                      {benchmark.averageLatencyMs}ms
                    </span>
                  ) : (
                    <span className="metric-na">N/A</span>
                  )}
                </div>
                <div className="table-col">
                  {benchmark.averageThroughput ? (
                    <span className="metric-value">
                      {benchmark.averageThroughput.toFixed(2)} tok/s
                    </span>
                  ) : (
                    <span className="metric-na">N/A</span>
                  )}
                </div>
                <div className="table-col">
                  <span className={`status-badge ${benchmark.status}`}>
                    {benchmark.status}
                  </span>
                </div>
                <div className="table-col">
                  <span className="date-text">
                    {benchmark.completedAt
                      ? new Date(benchmark.completedAt).toLocaleDateString()
                      : 'In progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelPerformanceMetrics;

