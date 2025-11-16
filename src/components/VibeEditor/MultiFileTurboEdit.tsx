/**
 * MultiFileTurboEdit.tsx
 * 
 * Multi-file Turbo Edit component for editing across multiple files.
 */

import { useState, useEffect } from 'react';
import { multiFileTurboEditService } from '@/services/ai/multiFileTurboEditService';
import TechIcon from '../Icons/TechIcon';
import { Files, Loader, AlertCircle } from 'lucide-react';
import '@/styles/MultiFileTurboEdit.css';

interface MultiFileTurboEditProps {
  instruction: string;
  onApply: (files: Array<{ path: string; newContent: string }>) => void;
  onCancel: () => void;
}

function MultiFileTurboEdit({ instruction, onApply, onCancel }: MultiFileTurboEditProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof multiFileTurboEditService.applyMultiFileEdit> extends Promise<infer T> ? T : never | null>(null);

  const handleGenerate = async () => {
    setIsProcessing(true);
    try {
      const result = await multiFileTurboEditService.previewMultiFileEdit(instruction);
      setResult(result as any);
    } catch (error) {
      setResult({
        success: false,
        files: [],
        error: (error as Error).message,
      } as any);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (result?.success && result.files) {
      onApply(result.files.map(f => ({ path: f.path, newContent: f.newContent })));
    }
  };

  // Auto-generate on mount
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="multi-file-turbo-edit">
      <div className="multi-file-header">
        <TechIcon icon={Files} size={20} glow="cyan" />
        <h3>Multi-File Edit</h3>
      </div>

      <div className="multi-file-content">
        {isProcessing ? (
          <div className="processing-state">
            <Loader size={24} className="spinning" />
            <p>Analyzing project and generating changes...</p>
          </div>
        ) : result ? (
          result.success ? (
            <div className="multi-file-results">
              <div className="results-summary">
                <p>Found {result.files.length} file(s) to modify:</p>
              </div>
              <div className="files-list">
                {result.files.map((file, index) => (
                  <div key={index} className="file-change-item">
                    <div className="file-change-header">
                      <span className="file-path">{file.path}</span>
                      <span className="changes-count">{file.changes.length} change(s)</span>
                    </div>
                    <div className="changes-list">
                      {file.changes.map((change, i) => (
                        <div key={i} className="change-item">• {change}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="error-state">
              <TechIcon icon={AlertCircle} size={24} glow="red" />
              <p>Error: {result.error || 'Failed to generate edits'}</p>
            </div>
          )
        ) : null}
      </div>

      <div className="multi-file-footer">
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        {result?.success && (
          <button className="apply-btn" onClick={handleApply}>
            Apply to {result.files.length} File(s)
          </button>
        )}
      </div>
    </div>
  );
}

export default MultiFileTurboEdit;

