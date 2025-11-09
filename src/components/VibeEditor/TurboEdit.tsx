import { useState } from 'react';
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';
import TechIcon from '@/components/Icons/TechIcon';
import { Zap, X, Check, Loader } from 'lucide-react';
import '@/styles/TurboEdit.css';

interface TurboEditProps {
  selectedCode: string;
  filePath?: string;
  onApply: (editedCode: string) => void;
  onCancel: () => void;
}

function TurboEdit({ selectedCode, filePath, onApply, onCancel }: TurboEditProps) {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{ editedCode?: string; diff?: string; error?: string } | null>(null);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await aiServiceBridge.turboEdit(selectedCode, instruction.trim(), filePath);
      setPreview(result);
    } catch (error) {
      setPreview({ error: (error as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (preview?.editedCode) {
      onApply(preview.editedCode);
    }
  };

  return (
    <div className="turbo-edit-modal">
      <div className="turbo-edit-header">
        <TechIcon icon={Zap} size={20} glow="cyan" />
        <h3>Turbo Edit</h3>
        <button className="close-btn" onClick={onCancel}>
          <X size={16} />
        </button>
      </div>

      <div className="turbo-edit-content">
        <div className="instruction-input">
          <label>What would you like to change?</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Add error handling, Refactor to use async/await, Add TypeScript types..."
            rows={3}
            disabled={isProcessing}
          />
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={!instruction.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader size={14} className="spinning" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={14} />
                Generate Edit
              </>
            )}
          </button>
        </div>

        {preview && (
          <div className="preview-section">
            {preview.error ? (
              <div className="preview-error">
                <p>Error: {preview.error}</p>
              </div>
            ) : (
              <>
                {preview.diff && (
                  <div className="diff-preview">
                    <h4>Changes:</h4>
                    <pre>{preview.diff}</pre>
                  </div>
                )}
                {preview.editedCode && (
                  <div className="code-preview">
                    <h4>Edited Code:</h4>
                    <pre>{preview.editedCode}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="turbo-edit-footer">
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        {preview?.editedCode && (
          <button className="apply-btn" onClick={handleApply}>
            <Check size={14} />
            Apply Changes
          </button>
        )}
      </div>
    </div>
  );
}

export default TurboEdit;

