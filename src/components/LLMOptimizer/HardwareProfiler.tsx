import { useCallback, useMemo, useState, useEffect } from 'react';
import { Cpu, HardDrive, MonitorDot, RefreshCw, Save, XCircle, Wrench, CheckCircle, X, Database } from 'lucide-react';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
import { llmOptimizerService } from '@/services/ai/llmOptimizerService';
import type { HardwareProfile, DevToolsStatus, StorageDriversStatus } from '@/types/optimizer';
import '../../styles/LLMOptimizer.css';

const formatNumber = (value: number | null | undefined, unit = ''): string => {
  if (value == null) return 'Unknown';
  return `${value}${unit}`;
};

const HardwareProfiler = () => {
  const hardwareProfile = useLLMOptimizerStore((state) => state.hardwareProfile);
  const isProfiling = useLLMOptimizerStore((state) => state.isProfiling);
  const profilerError = useLLMOptimizerStore((state) => state.profilerError);
  const detectHardware = useLLMOptimizerStore((state) => state.detectHardware);
  const setHardwareOverride = useLLMOptimizerStore((state) => state.setHardwareOverride);
  const clearHardwareOverride = useLLMOptimizerStore((state) => state.clearHardwareOverride);

  const [overrideDraft, setOverrideDraft] = useState<Partial<HardwareProfile>>({});
  const [devToolsStatus, setDevToolsStatus] = useState<DevToolsStatus | null>(null);
  const [isDetectingDevTools, setIsDetectingDevTools] = useState(false);
  const [storageDriversStatus, setStorageDriversStatus] = useState<StorageDriversStatus | null>(null);
  const [isDetectingStorage, setIsDetectingStorage] = useState(false);

  useEffect(() => {
    const loadDevTools = async () => {
      setIsDetectingDevTools(true);
      try {
        const status = await llmOptimizerService.detectDevTools();
        setDevToolsStatus(status);
      } catch {
        // Ignore errors
      } finally {
        setIsDetectingDevTools(false);
      }
    };
    loadDevTools();

    const loadStorageDrivers = async () => {
      setIsDetectingStorage(true);
      try {
        const status = await llmOptimizerService.detectStorageDrivers();
        setStorageDriversStatus(status);
      } catch {
        // Ignore errors
      } finally {
        setIsDetectingStorage(false);
      }
    };
    loadStorageDrivers();
  }, []);

  const hasOverrideChanges = useMemo(() => {
    return Object.keys(overrideDraft).length > 0;
  }, [overrideDraft]);

  const handleRefresh = useCallback(() => {
    detectHardware(true);
  }, [detectHardware]);

  const handleInputChange = useCallback(
    (field: keyof HardwareProfile) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setOverrideDraft((prev) => {
        let parsed: string | number | undefined = value;
        if (value.trim().length === 0) {
          parsed = undefined;
        } else if (['cpuCores', 'cpuThreads', 'systemMemoryGB', 'gpuMemoryGB'].includes(field)) {
          const numeric = Number(value);
          parsed = Number.isFinite(numeric) ? numeric : undefined;
        }
        return {
          ...prev,
          [field]: parsed,
        };
      });
    },
    []
  );

  const handleCheckboxChange = useCallback(
    (field: keyof HardwareProfile) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.checked;
      setOverrideDraft((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const applyOverrides = useCallback(() => {
    if (!hardwareProfile) return;
    setHardwareOverride(overrideDraft);
    setOverrideDraft({});
  }, [hardwareProfile, overrideDraft, setHardwareOverride]);

  const resetOverrides = useCallback(() => {
    setOverrideDraft({});
    clearHardwareOverride();
  }, [clearHardwareOverride]);

  return (
    <div className="hardware-profiler-card">
      <div className="hardware-profiler-header">
        <div className="hardware-profiler-title">
          <MonitorDot size={18} />
          <h3>Hardware Profiler</h3>
          <span className="hardware-profiler-source">
            {hardwareProfile?.source === 'manual' ? 'Manual override' : 'Auto detected'}
          </span>
        </div>
        <div className="hardware-profiler-actions">
          <button
            className="hp-action-button"
            onClick={handleRefresh}
            disabled={isProfiling}
            title="Re-run hardware detection"
          >
            <RefreshCw size={16} className={isProfiling ? 'spinning' : ''} />
            {isProfiling ? 'Detecting…' : 'Refresh'}
          </button>
          <button
            className="hp-action-button subtle"
            onClick={resetOverrides}
            disabled={!hardwareProfile || hardwareProfile?.source !== 'manual'}
            title="Clear manual overrides"
          >
            <XCircle size={16} />
            Reset
          </button>
        </div>
      </div>

      {profilerError && (
        <div className="hardware-profiler-error">
          <XCircle size={16} />
          <span>{profilerError}</span>
        </div>
      )}

      <div className="hardware-profiler-grid">
        <div className="hardware-profiler-tile">
          <div className="tile-header">
            <Cpu size={18} />
            <span>CPU</span>
          </div>
          <div className="tile-content">
            <span className="tile-primary">{hardwareProfile?.cpuModel ?? 'Unknown CPU'}</span>
            <div className="tile-meta">
              <span>{formatNumber(hardwareProfile?.cpuCores, ' cores')}</span>
              <span>{formatNumber(hardwareProfile?.cpuThreads, ' threads')}</span>
            </div>
          </div>
        </div>

        <div className="hardware-profiler-tile">
          <div className="tile-header">
            <HardDrive size={18} />
            <span>Memory</span>
          </div>
          <div className="tile-content">
            <span className="tile-primary">{formatNumber(hardwareProfile?.systemMemoryGB, ' GB')}</span>
            <div className="tile-meta">
              <span>{hardwareProfile?.operatingSystem ?? 'Unknown OS'}</span>
              <span>{hardwareProfile?.storageType ?? 'Storage unreported'}</span>
            </div>
          </div>
        </div>

        <div className="hardware-profiler-tile">
          <div className="tile-header">
            <MonitorDot size={18} />
            <span>GPU</span>
          </div>
          <div className="tile-content">
            <span className="tile-primary">{hardwareProfile?.gpuModel ?? 'Unknown GPU'}</span>
            <div className="tile-meta">
              <span>{formatNumber(hardwareProfile?.gpuMemoryGB, ' GB VRAM')}</span>
              <span>{hardwareProfile?.hasDiscreteGPU ? 'Discrete GPU' : 'Integrated / Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hardware-override-form">
        <h4>Manual overrides (optional)</h4>
        <div className="override-grid">
          <label>
            <span>System Memory (GB)</span>
            <input
              type="number"
              min={8}
              placeholder="e.g. 32"
              onChange={handleInputChange('systemMemoryGB')}
            />
          </label>
          <label>
            <span>GPU Memory (GB)</span>
            <input
              type="number"
              min={0}
              placeholder="e.g. 16"
              onChange={handleInputChange('gpuMemoryGB')}
            />
          </label>
          <label>
            <span>CPU Cores</span>
            <input
              type="number"
              min={2}
              placeholder="e.g. 12"
              onChange={handleInputChange('cpuCores')}
            />
          </label>
          <label>
            <span>OS</span>
            <input
              type="text"
              placeholder="macOS, Windows, Linux…"
              onChange={handleInputChange('operatingSystem')}
            />
          </label>
          <label className="override-checkbox">
            <input type="checkbox" onChange={handleCheckboxChange('hasDiscreteGPU')} />
            <span>Discrete GPU available</span>
          </label>
          <label>
            <span>Notes</span>
            <input
              type="text"
              placeholder="Custom build notes…"
              onChange={handleInputChange('notes')}
            />
          </label>
        </div>
        <div className="override-actions">
          <button
            className="hp-action-button primary"
            onClick={applyOverrides}
            disabled={!hasOverrideChanges}
          >
            <Save size={16} />
            Apply Override
          </button>
        </div>
      </div>

      {devToolsStatus && (
        <div className="dev-tools-section">
          <div className="dev-tools-header">
            <Wrench size={18} />
            <h4>Development Tools</h4>
            <button
              className="hp-action-button subtle"
              onClick={async () => {
                setIsDetectingDevTools(true);
                try {
                  const status = await llmOptimizerService.detectDevTools();
                  setDevToolsStatus(status);
                } finally {
                  setIsDetectingDevTools(false);
                }
              }}
              disabled={isDetectingDevTools}
              title="Refresh dev tools detection"
            >
              <RefreshCw size={14} className={isDetectingDevTools ? 'spinning' : ''} />
            </button>
          </div>
          <div className="dev-tools-list">
            {devToolsStatus.tools.map((tool) => (
              <div key={tool.name} className={`dev-tool-item ${tool.installed ? 'installed' : 'missing'}`}>
                <div className="dev-tool-status">
                  {tool.installed ? (
                    <CheckCircle size={14} className="success-icon" />
                  ) : (
                    <X size={14} className="error-icon" />
                  )}
                </div>
                <div className="dev-tool-info">
                  <span className="dev-tool-name">{tool.name}</span>
                  {tool.version && <span className="dev-tool-version">{tool.version}</span>}
                </div>
                {!tool.installed && tool.installUrl && (
                  <a
                    href={tool.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dev-tool-install-link"
                  >
                    Install
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {storageDriversStatus && (storageDriversStatus.controllers.length > 0 || storageDriversStatus.drivers.length > 0) && (
        <div className="dev-tools-section">
          <div className="dev-tools-header">
            <Database size={18} />
            <h4>Storage Controllers & Drivers</h4>
            <button
              className="hp-action-button subtle"
              onClick={async () => {
                setIsDetectingStorage(true);
                try {
                  const status = await llmOptimizerService.detectStorageDrivers();
                  setStorageDriversStatus(status);
                } finally {
                  setIsDetectingStorage(false);
                }
              }}
              disabled={isDetectingStorage}
              title="Refresh storage detection"
            >
              <RefreshCw size={14} className={isDetectingStorage ? 'spinning' : ''} />
            </button>
          </div>
          {storageDriversStatus.controllers.length > 0 && (
            <div className="dev-tools-list" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                CONTROLLERS
              </div>
              {storageDriversStatus.controllers.map((controller, idx) => (
                <div key={idx} className={`dev-tool-item ${controller.driverInstalled ? 'installed' : 'missing'}`}>
                  <div className="dev-tool-status">
                    {controller.driverInstalled ? (
                      <CheckCircle size={14} className="success-icon" />
                    ) : (
                      <X size={14} className="error-icon" />
                    )}
                  </div>
                  <div className="dev-tool-info">
                    <span className="dev-tool-name">{controller.name}</span>
                    <span className="dev-tool-version">{controller.type}</span>
                    {controller.model && <span className="dev-tool-version">{controller.model}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {storageDriversStatus.drivers.length > 0 && (
            <div className="dev-tools-list">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                DRIVERS
              </div>
              {storageDriversStatus.drivers.map((driver, idx) => (
                <div key={idx} className={`dev-tool-item ${driver.installed ? 'installed' : 'missing'}`}>
                  <div className="dev-tool-status">
                    {driver.installed ? (
                      <CheckCircle size={14} className="success-icon" />
                    ) : (
                      <X size={14} className="error-icon" />
                    )}
                  </div>
                  <div className="dev-tool-info">
                    <span className="dev-tool-name">{driver.name}</span>
                    {driver.version && <span className="dev-tool-version">{driver.version}</span>}
                    {driver.description && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                        {driver.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HardwareProfiler;

