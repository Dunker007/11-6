import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { HardDrive, Trash2, Download, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { storageService } from '@/services/storage/storageService';
import { logger } from '@/services/logging/loggerService';
import '../../styles/StorageDiagnostics.css';

interface StorageStats {
  usage: { used: number; total: number; percentage: number };
  itemCount: number;
  indexedDBAvailable: boolean;
}

const StorageDiagnostics: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    const currentStats = storageService.getStats();
    setStats(currentStats);
  };

  const handleClearStorage = async () => {
    if (!confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      const success = await storageService.clear();
      if (success) {
        setLastCleared(new Date());
        logger.info('Storage cleared successfully');
        loadStats();
      }
    } catch (error) {
      logger.error('Failed to clear storage', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      alert('Failed to clear storage. Check console for details.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportDiagnostics = () => {
    if (!stats) return;

    const diagnostics = {
      timestamp: new Date().toISOString(),
      stats,
      userAgent: navigator.userAgent,
      storagePersistence: navigator.storage ? 'available' : 'not available',
      localStorageKeys: Object.keys(localStorage).filter(k => k.startsWith('dlx-')),
    };

    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storage-diagnostics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage < 0.5) return 'var(--success-color)';
    if (percentage < 0.8) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  if (!stats) {
    return (
      <div className="storage-diagnostics">
        <div className="loading-state">Loading storage diagnostics...</div>
      </div>
    );
  }

  return (
    <div className="storage-diagnostics">
      <div className="diagnostics-header">
        <HardDrive size={20} />
        <h3>Storage Diagnostics</h3>
      </div>

      <div className="diagnostics-grid">
        {/* Storage Usage */}
        <div className="diagnostic-card">
          <div className="card-header">
            <Info size={16} />
            <span>Usage</span>
          </div>
          <div className="usage-bar-container">
            <div 
              className="usage-bar" 
              style={{ 
                width: `${(stats.usage.percentage * 100).toFixed(1)}%`,
                backgroundColor: getUsageColor(stats.usage.percentage)
              }}
            />
          </div>
          <div className="usage-stats">
            <span>{formatBytes(stats.usage.used)} used</span>
            <span style={{ color: getUsageColor(stats.usage.percentage) }}>
              {(stats.usage.percentage * 100).toFixed(1)}%
            </span>
            <span>{formatBytes(stats.usage.total)} total</span>
          </div>
        </div>

        {/* Item Count */}
        <div className="diagnostic-card">
          <div className="card-header">
            <CheckCircle size={16} />
            <span>Stored Items</span>
          </div>
          <div className="card-value">{stats.itemCount}</div>
          <div className="card-description">
            Items in localStorage
          </div>
        </div>

        {/* IndexedDB Status */}
        <div className="diagnostic-card">
          <div className="card-header">
            {stats.indexedDBAvailable ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>IndexedDB</span>
          </div>
          <div className="card-value" style={{ 
            color: stats.indexedDBAvailable ? 'var(--success-color)' : 'var(--warning-color)' 
          }}>
            {stats.indexedDBAvailable ? 'Available' : 'Not Available'}
          </div>
          <div className="card-description">
            Fallback for large data
          </div>
        </div>
      </div>

      {lastCleared && (
        <div className="last-cleared-notice">
          <CheckCircle size={16} />
          <span>Last cleared: {lastCleared.toLocaleTimeString()}</span>
        </div>
      )}

      <div className="diagnostics-actions">
        <Button
          variant="ghost"
          onClick={handleExportDiagnostics}
          leftIcon={Download}
        >
          Export Diagnostics
        </Button>
        <Button
          variant="danger"
          onClick={handleClearStorage}
          disabled={isClearing}
          leftIcon={Trash2}
        >
          {isClearing ? 'Clearing...' : 'Clear All Storage'}
        </Button>
      </div>

      <div className="diagnostics-info">
        <Info size={14} />
        <p>
          Storage is automatically managed. Low-priority items are removed when space is needed.
          IndexedDB is used as fallback for large data.
        </p>
      </div>
    </div>
  );
};

export default StorageDiagnostics;

