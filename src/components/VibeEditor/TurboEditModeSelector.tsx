/**
 * TurboEditModeSelector.tsx
 * 
 * Mode selector UI for Turbo Edit modes: Single File, Multi-File, Refactor, Generate, Test, Document.
 */

import { useState } from 'react';
import TechIcon from '../Icons/TechIcon';
import { FileText, Files, RefreshCw, Sparkles, TestTube, FileCheck } from 'lucide-react';
import '@/styles/TurboEditModeSelector.css';

export type TurboEditMode = 'single' | 'multi' | 'refactor' | 'generate' | 'test' | 'document';

interface TurboEditModeSelectorProps {
  selectedMode: TurboEditMode;
  onModeChange: (mode: TurboEditMode) => void;
}

const MODES: Array<{ id: TurboEditMode; label: string; icon: typeof FileText; description: string }> = [
  {
    id: 'single',
    label: 'Single File',
    icon: FileText,
    description: 'Edit the selected code in one file',
  },
  {
    id: 'multi',
    label: 'Multi-File',
    icon: Files,
    description: 'Apply changes across multiple files',
  },
  {
    id: 'refactor',
    label: 'Refactor',
    icon: RefreshCw,
    description: 'Rename symbols across the project',
  },
  {
    id: 'generate',
    label: 'Generate',
    icon: Sparkles,
    description: 'Create new features from prompts',
  },
  {
    id: 'test',
    label: 'Test',
    icon: TestTube,
    description: 'Generate test suites',
  },
  {
    id: 'document',
    label: 'Document',
    icon: FileCheck,
    description: 'Add JSDoc/TSDoc comments',
  },
];

function TurboEditModeSelector({ selectedMode, onModeChange }: TurboEditModeSelectorProps) {
  return (
    <div className="turbo-edit-mode-selector">
      <div className="mode-selector-header">
        <h4>Select Mode</h4>
      </div>
      <div className="mode-options">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={`mode-option ${selectedMode === mode.id ? 'active' : ''}`}
            onClick={() => onModeChange(mode.id)}
            title={mode.description}
          >
            <TechIcon icon={mode.icon} size={20} glow={selectedMode === mode.id ? 'cyan' : 'none'} />
            <div className="mode-option-content">
              <span className="mode-label">{mode.label}</span>
              <span className="mode-description">{mode.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TurboEditModeSelector;

