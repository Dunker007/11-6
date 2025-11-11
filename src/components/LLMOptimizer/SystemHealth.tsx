import { useState } from 'react';
import { Trash2, HardDrive, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { llmOptimizerService } from '@/services/ai/llmOptimizerService';
import type { CleanupResult, SystemCleanupResults } from '@/types/optimizer';
import DevelopmentToolsSection from './DevelopmentToolsSection';
import '../../styles/LLMOptimizer.css';

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const SystemHealth = () => {
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<SystemCleanupResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCleanTempFiles = async () => {
    setIsCleaning(true);
    setError(null);
    try {
      const result = await llmOptimizerService.cleanTempFiles();
      setCleanupResults({
        tempFiles: result,
        cache: { filesDeleted: 0, spaceFreed: 0, errors: [] },
        registry: { cleaned: 0, errors: [] },
        oldInstallations: { found: [], removed: 0, errors: [] },
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleCleanCache = async () => {
    setIsCleaning(true);
    setError(null);
    try {
      const result = await llmOptimizerService.cleanCache();
      setCleanupResults({
        tempFiles: { filesDeleted: 0, spaceFreed: 0, errors: [] },
        cache: result,
        registry: { cleaned: 0, errors: [] },
        oldInstallations: { found: [], removed: 0, errors: [] },
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDeepClean = async () => {
    setIsCleaning(true);
    setError(null);
    try {
      const result = await llmOptimizerService.deepCleanSystem();
      setCleanupResults(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCleaning(false);
    }
  };

  const renderCleanupResult = (label: string, result: CleanupResult) => {
    if (result.filesDeleted === 0 && result.spaceFreed === 0) return null;
    return (
      <div className="cleanup-result-card">
        <div className="cleanup-result-header">
          <CheckCircle size={18} className="success-icon" />
          <span className="cleanup-result-label">{label}</span>
        </div>
        <div className="cleanup-result-stats">
          <span>{result.filesDeleted} files deleted</span>
          <span className="space-freed">{formatBytes(result.spaceFreed)} freed</span>
        </div>
        {result.errors.length > 0 && (
          <div className="cleanup-errors">
            {result.errors.slice(0, 3).map((err, idx) => (
              <div key={idx} className="cleanup-error">
                <AlertCircle size={14} />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="system-health-panel">
      <header className="system-health-header">
        <HardDrive size={20} />
        <h3>System Health</h3>
        <p>Clean up temporary files and caches to free disk space</p>
      </header>

      <div className="cleanup-actions">
        <button
          className="cleanup-button"
          onClick={handleCleanTempFiles}
          disabled={isCleaning}
        >
          {isCleaning ? <Loader size={16} className="spinning" /> : <Trash2 size={16} />}
          Clean Temp Files
        </button>
        <button
          className="cleanup-button"
          onClick={handleCleanCache}
          disabled={isCleaning}
        >
          {isCleaning ? <Loader size={16} className="spinning" /> : <Trash2 size={16} />}
          Clean Cache
        </button>
        <button
          className="cleanup-button primary"
          onClick={handleDeepClean}
          disabled={isCleaning}
        >
          {isCleaning ? <Loader size={16} className="spinning" /> : <Trash2 size={16} />}
          Deep Clean
        </button>
      </div>

      {error && (
        <div className="cleanup-error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <DevelopmentToolsSection />

      {cleanupResults && (
        <div className="cleanup-results">
          {renderCleanupResult('Temp Files', cleanupResults.tempFiles)}
          {renderCleanupResult('Cache', cleanupResults.cache)}
          {cleanupResults.tempFiles.filesDeleted === 0 &&
            cleanupResults.cache.filesDeleted === 0 && (
              <div className="cleanup-no-results">
                <CheckCircle size={18} />
                <span>No cleanup needed - system is clean!</span>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SystemHealth;

