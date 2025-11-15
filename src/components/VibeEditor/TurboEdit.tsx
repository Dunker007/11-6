import { useState } from 'react';
import { agentPairService } from '@/services/agents/agentPairService';
import { useAgentStore } from '@/services/agents/agentStore';
import EdAvatar from '@/components/Agents/EdAvatar';
import ItorAvatar from '@/components/Agents/ItorAvatar';
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
  const { edStatus, itorStatus, currentWorkflow } = useAgentStore();

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    
    setIsProcessing(true);
    try {
      // Use agent pair service for Ed → Itor workflow
      const workflow = await agentPairService.generateAndReview(
        `Edit this code: ${instruction.trim()}\n\nCurrent code:\n\`\`\`\n${selectedCode}\n\`\`\``,
        {
          filePath,
          existingCode: selectedCode,
          maxIterations: 2, // Quick iteration for Turbo Edit
        }
      );

      if (workflow.refinedCode || workflow.edResult.code) {
        const editedCode = workflow.refinedCode || workflow.edResult.code;
        const diff = calculateDiff(selectedCode, editedCode);
        setPreview({ editedCode, diff });
      } else {
        setPreview({ error: 'Failed to generate edited code' });
      }
    } catch (error) {
      setPreview({ error: (error as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateDiff = (oldCode: string, newCode: string): string => {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const diff: string[] = [];
    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      if (oldLine !== newLine) {
        if (oldLine) diff.push(`- ${oldLine}`);
        if (newLine) diff.push(`+ ${newLine}`);
      }
    }
    return diff.join('\n');
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
        {/* Agent Status Display */}
        <div className="turbo-edit-agents">
          <div className="agent-status agent-ed">
            <EdAvatar 
              status={edStatus} 
              size="sm" 
              animated={isProcessing && currentWorkflow === 'ed-generating'} 
            />
            <span className="agent-label">Ed</span>
            {currentWorkflow === 'ed-generating' && <span className="agent-status-text">Generating...</span>}
            {currentWorkflow === 'ed-refining' && <span className="agent-status-text">Refining...</span>}
          </div>
          <div className="agent-arrow">→</div>
          <div className="agent-status agent-itor">
            <ItorAvatar 
              status={itorStatus} 
              size="sm" 
              animated={isProcessing && currentWorkflow === 'itor-reviewing'} 
            />
            <span className="agent-label">Itor</span>
            {currentWorkflow === 'itor-reviewing' && <span className="agent-status-text">Reviewing...</span>}
          </div>
        </div>

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

