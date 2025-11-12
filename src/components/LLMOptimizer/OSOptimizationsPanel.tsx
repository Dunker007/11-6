/**
 * OS Optimizations Panel Component
 * UI for applying Windows OS-level optimizations based on hardware monitoring
 */

import { useState, useEffect } from 'react';
import { windowsOptimizer, type WindowsOptimization, type OptimizationResult } from '@/services/windows/windowsOptimizer';
import { useHealthStore } from '@/services/health/healthStore';
import { Button } from '@/components/ui';
import { Card, CardHeader, CardBody } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Settings, Zap, AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';
import '@/styles/OSOptimizations.css';

export function OSOptimizationsPanel() {
  const { stats } = useHealthStore();
  const { showToast } = useToast();
  const [optimizations, setOptimizations] = useState<WindowsOptimization[]>([]);
  const [recommended, setRecommended] = useState<WindowsOptimization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState<{ platform: string; isWindows: boolean; isAdmin: boolean } | null>(null);

  useEffect(() => {
    loadOptimizations();
    checkSystemInfo();
  }, []);

  useEffect(() => {
    if (stats) {
      const recommendations = windowsOptimizer.getRecommendedOptimizations(stats);
      setRecommended(recommendations);
    }
  }, [stats]);

  const loadOptimizations = async () => {
    const opts = windowsOptimizer.getOptimizations();
    setOptimizations(opts);
  };

  const checkSystemInfo = async () => {
    const info = await windowsOptimizer.getSystemInfo();
    setSystemInfo(info);
  };

  const handleApplyOptimization = async (optimizationId: string) => {
    setIsLoading(true);
    try {
      const result: OptimizationResult = await windowsOptimizer.applyOptimization(optimizationId);
      
      if (result.success) {
        showToast({
          title: 'Optimization Applied',
          description: `${result.optimization.name} has been applied successfully`,
          variant: 'success',
        });
        await loadOptimizations();
      } else {
        showToast({
          title: 'Failed to Apply',
          description: result.error || 'Failed to apply optimization',
          variant: 'error',
        });
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to apply optimization',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevertOptimization = async (optimizationId: string) => {
    setIsLoading(true);
    try {
      const result: OptimizationResult = await windowsOptimizer.revertOptimization(optimizationId);
      
      if (result.success) {
        showToast({
          title: 'Optimization Reverted',
          description: `${result.optimization.name} has been reverted`,
          variant: 'success',
        });
        await loadOptimizations();
      } else {
        showToast({
          title: 'Failed to Revert',
          description: result.error || 'Failed to revert optimization',
          variant: 'error',
        });
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revert optimization',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  if (!systemInfo?.isWindows) {
    return (
      <Card className="os-optimizations-card">
        <CardBody>
          <div className="os-optimizations-empty">
            <Settings size={48} className="os-optimizations-empty-icon" />
            <h3>Windows Only</h3>
            <p>OS-level optimizations are only available on Windows</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="os-optimizations">
      <Card className="os-optimizations-card">
        <CardHeader>
          <div className="os-optimizations-header">
            <Settings className="os-optimizations-icon" />
            <div>
              <h2>OS Optimizations</h2>
              <p className="os-optimizations-subtitle">
                Windows performance tweaks based on your system metrics
                {!systemInfo.isAdmin && (
                  <span className="os-optimizations-admin-warning">
                    <Shield size={14} />
                    Some optimizations require administrator privileges
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* Recommended Optimizations */}
          {recommended.length > 0 && (
            <div className="os-optimizations-section">
              <div className="os-optimizations-section-header">
                <Zap size={18} />
                <span>Recommended for Your System</span>
              </div>
              <div className="os-optimizations-list">
                {recommended.map((opt) => (
                  <div key={opt.id} className="os-optimization-item os-optimization-item--recommended">
                    <div className="os-optimization-content">
                      <div className="os-optimization-header-row">
                        <h4>{opt.name}</h4>
                        <div className="os-optimization-badges">
                          <Badge variant={getImpactColor(opt.impact)} size="sm">
                            {opt.impact} impact
                          </Badge>
                          {opt.requiresAdmin && (
                            <Badge variant="warning" size="sm">
                              <Shield size={12} />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="os-optimization-description">{opt.description}</p>
                      <div className="os-optimization-meta">
                        <Badge variant={getRiskColor(opt.risk)} size="sm">
                          {opt.risk} risk
                        </Badge>
                        <span className="os-optimization-category">{opt.category}</span>
                      </div>
                    </div>
                    <div className="os-optimization-actions">
                      {opt.enabled ? (
                        <>
                          <CheckCircle size={16} className="os-optimization-enabled-icon" />
                          <Button
                            onClick={() => handleRevertOptimization(opt.id)}
                            disabled={isLoading}
                            variant="secondary"
                            size="sm"
                          >
                            Revert
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleApplyOptimization(opt.id)}
                          disabled={isLoading || (opt.requiresAdmin && !systemInfo.isAdmin)}
                          variant="primary"
                          size="sm"
                          leftIcon={Zap}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Optimizations */}
          <div className="os-optimizations-section">
            <div className="os-optimizations-section-header">
              <Settings size={18} />
              <span>All Optimizations</span>
            </div>
            <div className="os-optimizations-list">
              {optimizations.map((opt) => {
                const isRecommended = recommended.some((r) => r.id === opt.id);
                if (isRecommended) return null; // Skip if already in recommended

                return (
                  <div key={opt.id} className="os-optimization-item">
                    <div className="os-optimization-content">
                      <div className="os-optimization-header-row">
                        <h4>{opt.name}</h4>
                        <div className="os-optimization-badges">
                          <Badge variant={getImpactColor(opt.impact)} size="sm">
                            {opt.impact} impact
                          </Badge>
                          {opt.requiresAdmin && (
                            <Badge variant="warning" size="sm">
                              <Shield size={12} />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="os-optimization-description">{opt.description}</p>
                      <div className="os-optimization-meta">
                        <Badge variant={getRiskColor(opt.risk)} size="sm">
                          {opt.risk} risk
                        </Badge>
                        <span className="os-optimization-category">{opt.category}</span>
                      </div>
                    </div>
                    <div className="os-optimization-actions">
                      {opt.enabled ? (
                        <>
                          <CheckCircle size={16} className="os-optimization-enabled-icon" />
                          <Button
                            onClick={() => handleRevertOptimization(opt.id)}
                            disabled={isLoading}
                            variant="secondary"
                            size="sm"
                          >
                            Revert
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleApplyOptimization(opt.id)}
                          disabled={isLoading || (opt.requiresAdmin && !systemInfo.isAdmin)}
                          variant="secondary"
                          size="sm"
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

