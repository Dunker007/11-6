import { useEffect } from 'react';
import { X, BarChart3, Cpu, HardDrive, Zap, TrendingUp, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useBenchmarkStore } from '@/services/benchmark/benchmarkStore';
import '../../styles/LLMOptimizer.css';

interface BenchmarkSuiteProps {
  onClose: () => void;
}

const BenchmarkSuite = ({ onClose }: BenchmarkSuiteProps) => {
  const { suite, isRunning, currentTest, progress, error, runBenchmarkSuite, clearResults } = useBenchmarkStore();

  useEffect(() => {
    if (!suite && !isRunning) {
      runBenchmarkSuite();
    }
  }, []);

  const handleRerun = () => {
    clearResults();
    runBenchmarkSuite();
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'var(--emerald-500)';
      case 'good': return 'var(--cyan-500)';
      case 'average': return 'var(--amber-500)';
      case 'poor': return 'var(--red-500)';
      default: return 'var(--text-muted)';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent':
      case 'good':
        return <CheckCircle size={16} style={{ color: getRatingColor(rating) }} />;
      default:
        return <XCircle size={16} style={{ color: getRatingColor(rating) }} />;
    }
  };

  return (
    <div className="benchmark-suite-card" style={{ marginTop: '1.5rem' }}>
      <div className="benchmark-header">
        <div className="benchmark-title">
          <BarChart3 size={18} />
          <h4>PC Benchmark Suite</h4>
        </div>
        <button className="hp-action-button subtle" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {isRunning && (
        <div className="benchmark-progress">
          <div className="progress-info">
            <Loader size={16} className="spinning" />
            <span>Running {currentTest || 'benchmark'}...</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ 
                width: `${progress * 100}%`,
                background: 'var(--violet-500)'
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="hardware-profiler-error">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {suite && !isRunning && (
        <>
          <div className="benchmark-results">
            {/* Overall Score */}
            <div className="benchmark-overall">
              <div className="overall-score">
                <span className="score-value">{suite.overall.score}</span>
                <span className="score-label">Overall Score</span>
              </div>
              <div className="overall-rating">
                {getRatingIcon(suite.overall.rating)}
                <span style={{ color: getRatingColor(suite.overall.rating), textTransform: 'capitalize' }}>
                  {suite.overall.rating}
                </span>
              </div>
            </div>

            {/* Individual Test Results */}
            <div className="benchmark-tests">
              {/* CPU Test */}
              <div className="benchmark-test-card">
                <div className="test-header">
                  <Cpu size={18} />
                  <span>CPU Performance</span>
                  {suite.cpu.status === 'completed' ? (
                    <CheckCircle size={16} className="success-icon" />
                  ) : (
                    <XCircle size={16} className="error-icon" />
                  )}
                </div>
                <div className="test-result">
                  <span className="test-score">{suite.cpu.score.toLocaleString()}</span>
                  <span className="test-unit">{suite.cpu.unit}</span>
                </div>
                {suite.cpu.details && (
                  <div className="test-details">
                    <span>{suite.cpu.details.cores} cores</span>
                    {suite.cpu.details.duration && (
                      <span>{suite.cpu.details.duration}ms</span>
                    )}
                  </div>
                )}
              </div>

              {/* Memory Test */}
              <div className="benchmark-test-card">
                <div className="test-header">
                  <HardDrive size={18} />
                  <span>Memory Performance</span>
                  {suite.memory.status === 'completed' ? (
                    <CheckCircle size={16} className="success-icon" />
                  ) : (
                    <XCircle size={16} className="error-icon" />
                  )}
                </div>
                <div className="test-result">
                  <span className="test-score">{suite.memory.score.toLocaleString()}</span>
                  <span className="test-unit">{suite.memory.unit}</span>
                </div>
                {suite.memory.details && (
                  <div className="test-details">
                    <span>{suite.memory.details.totalGB}GB total</span>
                    {suite.memory.details.writeTime && (
                      <span>Write: {suite.memory.details.writeTime}ms</span>
                    )}
                  </div>
                )}
              </div>

              {/* Disk Test */}
              <div className="benchmark-test-card">
                <div className="test-header">
                  <Zap size={18} />
                  <span>Disk Performance</span>
                  {suite.disk.status === 'completed' ? (
                    <CheckCircle size={16} className="success-icon" />
                  ) : (
                    <XCircle size={16} className="error-icon" />
                  )}
                </div>
                <div className="test-result">
                  <span className="test-score">{suite.disk.score.toLocaleString()}</span>
                  <span className="test-unit">{suite.disk.unit}</span>
                </div>
                {suite.disk.details && (
                  <div className="test-details">
                    <span>{suite.disk.details.type}</span>
                    {suite.disk.details.rating && (
                      <span style={{ textTransform: 'capitalize' }}>{suite.disk.details.rating}</span>
                    )}
                  </div>
                )}
              </div>

              {/* GPU Test (if available) */}
              {suite.gpu && (
                <div className="benchmark-test-card">
                  <div className="test-header">
                    <TrendingUp size={18} />
                    <span>GPU Performance</span>
                    {suite.gpu.status === 'completed' ? (
                      <CheckCircle size={16} className="success-icon" />
                    ) : (
                      <XCircle size={16} className="error-icon" />
                    )}
                  </div>
                  <div className="test-result">
                    <span className="test-score">{suite.gpu.score.toLocaleString()}</span>
                    <span className="test-unit">{suite.gpu.unit}</span>
                  </div>
                  {suite.gpu.details && (
                    <div className="test-details">
                      <span>{suite.gpu.details.renderer}</span>
                      {suite.gpu.details.frames && (
                        <span>{suite.gpu.details.frames} frames</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="benchmark-footer">
              <span className="benchmark-timestamp">
                Completed in {Math.round(suite.duration / 1000)}s
              </span>
              <button className="hp-action-button" onClick={handleRerun}>
                <BarChart3 size={16} />
                Run Again
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BenchmarkSuite;

