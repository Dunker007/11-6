/**
 * Hardware Status HUD
 * Compact display of LuxRig system status
 */

import { useLLMOptimizerStore } from '../services/ai/llmOptimizerStore';
import { Cpu, HardDrive, Activity } from 'lucide-react';
import '../styles-new/hw-status.css';

export default function HWStatus() {
  const hardwareProfile = useLLMOptimizerStore((state) => state.hardwareProfile);
  const isProfiling = useLLMOptimizerStore((state) => state.isProfiling);

  const formatMemory = (gb: number | null | undefined) => {
    if (!gb) return 'Unknown';
    return gb >= 1024 ? `${(gb / 1024).toFixed(1)}TB` : `${gb}GB`;
  };

  const getStatusColor = () => {
    if (isProfiling) return '#f59e0b'; // yellow
    if (hardwareProfile) return '#10b981'; // green
    return '#ef4444'; // red
  };

  return (
    <div className="hw-status-hud">
      <div className="hw-metric">
        <Cpu size={14} />
        <span>{hardwareProfile?.cpuModel?.split(' ')[0] || 'CPU'}</span>
      </div>

      <div className="hw-metric">
        <HardDrive size={14} />
        <span>{formatMemory(hardwareProfile?.systemMemoryGB)}</span>
      </div>

      <div className="hw-metric">
        <Activity size={14} />
        <span>{hardwareProfile?.gpuModel?.split(' ')[0] || 'GPU'}</span>
      </div>

      <div className="hw-status">
        <div
          className="status-dot"
          style={{ backgroundColor: getStatusColor() }}
        ></div>
        <span>LuxRig</span>
        {isProfiling && <span className="status-text">Scanning...</span>}
      </div>
    </div>
  );
}
