import { useState, useEffect } from 'react';
import { X, Zap, Shield, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
import { windowsOptimizer } from '@/services/windows/windowsOptimizer';
import { useToast } from '@/components/ui';
import type { WindowsOptimization } from '@/services/windows/windowsOptimizer';
import '../../styles/LLMOptimizer.css';

interface WindowsOptimizerProps {
  onClose: () => void;
}

const WindowsOptimizer = ({ onClose }: WindowsOptimizerProps) => {
  const [optimizations, setOptimizations] = useState<WindowsOptimization[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<{ platform: string; isWindows: boolean; isAdmin: boolean } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      const info = await windowsOptimizer.getSystemInfo();
      setSystemInfo(info);
      setOptimizations(windowsOptimizer.getOptimizations());
    };
    loadData();
  }, []);

  const handleApply = async (optimizationId: string) => {
    setApplying(optimizationId);
    try {
      const result = await windowsOptimizer.applyOptimization(optimizationId);
      if (result.success) {
        setOptimizations(windowsOptimizer.getOptimizations());
        showToast({
          variant: 'success',
          title: 'Optimization applied',
          message: `${result.optimization.name} has been applied successfully`,
        });
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to apply optimization',
          message: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to apply optimization: ${(error as Error).message}`,
      });
    } finally {
      setApplying(null);
    }
  };

  const handleRevert = async (optimizationId: string) => {
    setApplying(optimizationId);
    try {
      const result = await windowsOptimizer.revertOptimization(optimizationId);
      if (result.success) {
        setOptimizations(windowsOptimizer.getOptimizations());
        showToast({
          variant: 'success',
          title: 'Optimization reverted',
          message: `${result.optimization.name} has been reverted successfully`,
        });
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to revert optimization',
          message: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to revert optimization: ${(error as Error).message}`,
      });
    } finally {
      setApplying(null);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'var(--emerald-500)';
      case 'medium': return 'var(--amber-500)';
      case 'low': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'var(--emerald-500)';
      case 'medium': return 'var(--amber-500)';
      case 'high': return 'var(--red-500)';
      default: return 'var(--text-muted)';
    }
  };

  const categories: Array<{ id: WindowsOptimization['category']; name: string; icon: typeof Zap }> = [
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'startup', name: 'Startup', icon: Zap },
    { id: 'visual', name: 'Visual', icon: Zap },
    { id: 'network', name: 'Network', icon: Zap },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  const [selectedCategory, setSelectedCategory] = useState<WindowsOptimization['category'] | 'all'>('all');

  const filteredOptimizations = selectedCategory === 'all'
    ? optimizations
    : optimizations.filter(opt => opt.category === selectedCategory);

  if (!systemInfo || !systemInfo.isWindows) {
    return (
      <div className="benchmark-suite-card" style={{ marginTop: '1.5rem' }}>
        <div className="benchmark-header">
          <div className="benchmark-title">
            <AlertTriangle size={18} />
            <h4>Windows Optimizer</h4>
          </div>
          <button className="hp-action-button subtle" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Windows optimization is only available on Windows systems.
        </div>
      </div>
    );
  }

  return (
    <div className="benchmark-suite-card" style={{ marginTop: '1.5rem' }}>
      <div className="benchmark-header">
        <div className="benchmark-title">
          <Zap size={18} />
          <h4>Windows Optimization</h4>
        </div>
        <button className="hp-action-button subtle" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* Category Filter */}
      <div className="optimization-categories">
        <button
          className={`category-filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <cat.icon size={14} />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Optimizations List */}
      <div className="optimizations-list">
        {filteredOptimizations.map(opt => (
          <div key={opt.id} className={`optimization-item ${opt.enabled ? 'enabled' : ''}`}>
            <div className="optimization-info">
              <div className="optimization-header">
                <h5>{opt.name}</h5>
                <div className="optimization-badges">
                  <span 
                    className="impact-badge"
                    style={{ color: getImpactColor(opt.impact) }}
                  >
                    {opt.impact} impact
                  </span>
                  <span 
                    className="risk-badge"
                    style={{ color: getRiskColor(opt.risk) }}
                  >
                    {opt.risk} risk
                  </span>
                  {opt.requiresAdmin && (
                    <span className="admin-badge">
                      <Shield size={12} />
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <p className="optimization-description">{opt.description}</p>
            </div>
            <div className="optimization-actions">
              {opt.enabled ? (
                <button
                  className="hp-action-button subtle"
                  onClick={() => handleRevert(opt.id)}
                  disabled={applying === opt.id}
                >
                  {applying === opt.id ? (
                    <Loader size={14} className="spinning" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  Revert
                </button>
              ) : (
                <button
                  className="hp-action-button"
                  onClick={() => handleApply(opt.id)}
                  disabled={applying === opt.id}
                >
                  {applying === opt.id ? (
                    <Loader size={14} className="spinning" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  Apply
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {optimizations.some(opt => opt.requiresAdmin) && !systemInfo.isAdmin && (
        <div className="hardware-profiler-error" style={{ marginTop: '1rem' }}>
          <AlertTriangle size={16} />
          <span>Some optimizations require administrator privileges. Please run the application as administrator.</span>
        </div>
      )}
    </div>
  );
};

export default WindowsOptimizer;

