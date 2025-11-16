/**
 * TurboEdit.tsx
 * 
 * Enhanced Turbo Edit component with multiple modes: Single File, Multi-File, Refactor, Generate, Test, Document.
 */

import { useState } from 'react';
import { agentPairService } from '@/services/agents/agentPairService';
import { useAgentStore } from '@/services/agents/agentStore';
import { llmRouter } from '@/services/ai/router';
import { refactoringService } from '@/services/ai/refactoringService';
import EdAvatar from '@/components/Agents/EdAvatar';
import ItorAvatar from '@/components/Agents/ItorAvatar';
import TurboEditModeSelector, { type TurboEditMode } from './TurboEditModeSelector';
import MultiFileTurboEdit from './MultiFileTurboEdit';
import TechIcon from '../Icons/TechIcon';
import { Zap, X, Check, Loader } from 'lucide-react';
import '@/styles/TurboEdit.css';
import { prettierService } from '@/services/formatting/prettierService';
import { useSettingsStore } from '@/services/settings/settingsStore';
import DiffViewer from '../shared/DiffViewer';
import '@/styles/MultiFileTurboEdit.css';

interface TurboEditProps {
  selectedCode: string;
  filePath?: string;
  onApply: (editedCode: string) => void;
  onCancel: () => void;
}

function TurboEdit({ selectedCode, filePath, onApply, onCancel }: TurboEditProps) {
  const [mode, setMode] = useState<TurboEditMode>('single');
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{ editedCode?: string; diff?: string; error?: string } | null>(null);
  const [refactorPreview, setRefactorPreview] = useState<any>(null);
  const [testCode, setTestCode] = useState<string>('');
  const [documentCode, setDocumentCode] = useState<string>('');
  const { edStatus, itorStatus, currentWorkflow } = useAgentStore();
  const { formatOnApply } = useSettingsStore();

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    
    setIsProcessing(true);
    setPreview(null);
    setRefactorPreview(null);
    setTestCode('');
    setDocumentCode('');
    
    try {
      switch (mode) {
        case 'single': {
          // Use agent pair service for Ed → Itor workflow
          const workflow = await agentPairService.generateAndReview(
            `Edit this code: ${instruction.trim()}\n\nCurrent code:\n\`\`\`\n${selectedCode}\n\`\`\``,
            {
              filePath,
              existingCode: selectedCode,
              maxIterations: 2,
            }
          );

          if (workflow.refinedCode || workflow.edResult.code) {
            const editedCode = workflow.refinedCode || workflow.edResult.code;
            const diff = calculateDiff(selectedCode, editedCode);
            setPreview({ editedCode, diff });
          } else {
            setPreview({ error: 'Failed to generate edited code' });
          }
          break;
        }
        
        case 'refactor': {
          // Refactor mode - extract symbol name and new name from instruction
          const match = instruction.match(/rename\s+["']?(\w+)["']?\s+to\s+["']?(\w+)["']?/i);
          if (match) {
            const [, oldName, newName] = match;
            const preview = await refactoringService.previewRename({
              symbolName: oldName,
              newName,
            });
            setRefactorPreview(preview);
          } else {
            setPreview({ error: 'Please provide: "rename SYMBOL_NAME to NEW_NAME"' });
          }
          break;
        }
        
        case 'test': {
          // Generate tests
          const prompt = `Generate comprehensive test suite for this code:\n\n\`\`\`\n${selectedCode}\n\`\`\`\n\n${instruction}`;
          try {
            const response = await llmRouter.generate(prompt, {
              temperature: 0.7,
              maxTokens: 2000,
            });
            
            if (response.text) {
              // Extract code from markdown
              const codeMatch = response.text.match(/```[\w]*\n([\s\S]*?)\n```/);
              setTestCode(codeMatch ? codeMatch[1] : response.text);
            } else {
              setPreview({ error: 'Failed to generate tests - no response text' });
            }
          } catch (error) {
            setPreview({ error: (error as Error).message || 'Failed to generate tests' });
          }
          break;
        }
        
        case 'document': {
          // Generate documentation
          const prompt = `Add comprehensive JSDoc/TSDoc comments to this code:\n\n\`\`\`\n${selectedCode}\n\`\`\`\n\n${instruction}`;
          try {
            const response = await llmRouter.generate(prompt, {
              temperature: 0.7,
              maxTokens: 2000,
            });
            
            if (response.text) {
              // Extract code from markdown
              const codeMatch = response.text.match(/```[\w]*\n([\s\S]*?)\n```/);
              setDocumentCode(codeMatch ? codeMatch[1] : response.text);
            } else {
              setPreview({ error: 'Failed to generate documentation - no response text' });
            }
          } catch (error) {
            setPreview({ error: (error as Error).message || 'Failed to generate documentation' });
          }
          break;
        }
        
        case 'generate': {
          // Generate new features
          const prompt = `${instruction}\n\nGenerate complete implementation.`;
          try {
            const response = await llmRouter.generate(prompt, {
              temperature: 0.9,
              maxTokens: 4000,
            });
            
            if (response.text) {
              const codeMatch = response.text.match(/```[\w]*\n([\s\S]*?)\n```/);
              const generatedCode = codeMatch ? codeMatch[1] : response.text;
              setPreview({ editedCode: generatedCode });
            } else {
              setPreview({ error: 'Failed to generate code - no response text' });
            }
          } catch (error) {
            setPreview({ error: (error as Error).message || 'Failed to generate code' });
          }
          break;
        }
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

  const handleApply = async () => {
    // Large edit confirm
    const newBody = preview?.editedCode || testCode || documentCode || '';
    const changeSize = Math.abs(newBody.length - selectedCode.length);
    if (newBody && changeSize > 2000) {
      const ok = window.confirm('This is a large change. Apply anyway?');
      if (!ok) return;
    }
    if (mode === 'refactor' && refactorPreview?.success) {
      // Refactor apply handled separately
      refactoringService.applyRename({
        symbolName: (instruction.match(/rename\s+["']?(\w+)["']?/i) || [])[1] || '',
        newName: (instruction.match(/to\s+["']?(\w+)["']?/i) || [])[1] || '',
      }).then(() => {
        onCancel(); // Close modal after apply
      });
      return;
    }
    
    if (preview?.editedCode) {
      const out = formatOnApply ? await prettierService.format(preview.editedCode, filePath) : preview.editedCode;
      onApply(out);
    } else if (testCode) {
      const out = formatOnApply ? await prettierService.format(testCode, filePath) : testCode;
      onApply(out);
    } else if (documentCode) {
      const out = formatOnApply ? await prettierService.format(documentCode, filePath) : documentCode;
      onApply(out);
    }
  };

  // Multi-file mode uses separate component
  if (mode === 'multi') {
    return (
      <div className="turbo-edit-modal">
        <div className="turbo-edit-header">
          <TechIcon icon={Zap} size={20} glow="cyan" />
          <h3>Turbo Edit - Multi-File</h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
        <TurboEditModeSelector selectedMode={mode} onModeChange={setMode} />
        <div className="instruction-input">
          <label>What would you like to change across multiple files?</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Replace all instances of oldPattern with newPattern, Add error handling to all API calls..."
            rows={3}
            disabled={isProcessing}
          />
        </div>
        <MultiFileTurboEdit
          instruction={instruction}
          onApply={(files: Array<{ path: string; newContent: string }>) => {
            // Handle multi-file apply
            const { useProjectStore } = require('@/services/project/projectStore');
            const { updateFile } = useProjectStore.getState();
            files.forEach((file: { path: string; newContent: string }) => {
              updateFile(file.path, file.newContent);
            });
            onCancel();
          }}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div className="turbo-edit-modal">
      <div className="turbo-edit-header">
        <TechIcon icon={Zap} size={20} glow="cyan" />
        <h3>Turbo Edit</h3>
        <button className="close-btn" onClick={onCancel}>
          <X size={16} />
        </button>
      </div>

      <TurboEditModeSelector selectedMode={mode} onModeChange={setMode} />

      <div className="turbo-edit-content">
        {/* Agent Status Display - only for single mode */}
        {mode === 'single' && (
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
        )}

        <div className="instruction-input">
          <label>
            {mode === 'refactor' && 'Rename instruction (e.g., "rename oldName to newName"):'}
            {mode === 'test' && 'Test requirements:'}
            {mode === 'document' && 'Documentation style/requirements:'}
            {mode === 'generate' && 'What to generate:'}
            {mode === 'single' && 'What would you like to change?'}
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={
              mode === 'refactor' ? 'e.g., rename getUserData to fetchUserProfile' :
              mode === 'test' ? 'e.g., Include unit tests and integration tests' :
              mode === 'document' ? 'e.g., Add JSDoc with parameter descriptions' :
              mode === 'generate' ? 'e.g., Create a React hook for API calls' :
              'e.g., Add error handling, Refactor to use async/await, Add TypeScript types...'
            }
            rows={3}
            disabled={isProcessing}
          />
          {mode === 'single' && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
              Tip: Select code in the editor before opening Turbo Edit to limit changes to that selection.
            </div>
          )}
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
                Generate {mode === 'test' ? 'Tests' : mode === 'document' ? 'Documentation' : mode === 'generate' ? 'Code' : 'Edit'}
              </>
            )}
          </button>
        </div>

        {/* Refactor preview */}
        {refactorPreview && refactorPreview.success && (
          <div className="preview-section">
            <div className="refactor-preview">
              <h4>Found {refactorPreview.occurrences.length} occurrence(s):</h4>
              <div className="occurrences-list">
                {refactorPreview.occurrences.map((occ: any, i: number) => (
                  <div key={i} className="occurrence-item">
                    <span className="occurrence-path">{occ.path}:{occ.line}:{occ.column}</span>
                    <pre className="occurrence-context">{occ.context}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Test code preview */}
        {testCode && (
          <div className="preview-section">
            <div className="code-preview">
              <h4>Generated Tests:</h4>
              <pre>{testCode}</pre>
            </div>
          </div>
        )}

        {/* Document code preview */}
        {documentCode && (
          <div className="preview-section">
            <div className="code-preview">
              <h4>Documented Code:</h4>
              <pre>{documentCode}</pre>
            </div>
          </div>
        )}

        {/* Single file preview with diff viewer */}
        {preview && !testCode && !documentCode && (
          <div className="preview-section">
            {preview.error ? (
              <div className="preview-error">
                <p>Error: {preview.error}</p>
              </div>
            ) : (
              <>
                {preview.editedCode && (
                  <div className="code-preview">
                    <h4>{mode === 'generate' ? 'Generated Code:' : 'Edited Code:'}</h4>
                    <DiffViewer oldText={selectedCode} newText={preview.editedCode} />
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
        {(preview?.editedCode || testCode || documentCode || (refactorPreview?.success)) && (
          <button className="apply-btn" onClick={handleApply}>
            <Check size={14} />
            Apply {mode === 'refactor' ? 'Refactoring' : mode === 'test' ? 'Tests' : mode === 'document' ? 'Documentation' : 'Changes'}
          </button>
        )}
      </div>
    </div>
  );
}

export default TurboEdit;
