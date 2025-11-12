/**
 * Plan File Diff Component
 * Displays file changes in a diff view
 */

import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import '@/styles/PlanFileDiff.css';

interface PlanFileDiffProps {
  filePath: string;
  newContent: string;
  oldContent?: string;
}

function PlanFileDiff({ filePath, newContent, oldContent }: PlanFileDiffProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [diffLines, setDiffLines] = useState<Array<{ type: 'add' | 'remove' | 'context'; line: string; lineNumber?: number }>>([]);

  useEffect(() => {
    // Simple diff algorithm - split by lines and compare
    if (!oldContent) {
      // New file - all lines are additions
      const lines = newContent.split('\n');
      setDiffLines(lines.map((line, index) => ({
        type: 'add' as const,
        line,
        lineNumber: index + 1,
      })));
    } else {
      // Simple line-by-line diff
      const oldLines = oldContent.split('\n');
      const newLines = newContent.split('\n');
      const diff: Array<{ type: 'add' | 'remove' | 'context'; line: string; lineNumber?: number }> = [];

      const maxLines = Math.max(oldLines.length, newLines.length);
      for (let i = 0; i < maxLines; i++) {
        const oldLine = oldLines[i];
        const newLine = newLines[i];

        if (oldLine === undefined) {
          // New line added
          diff.push({ type: 'add', line: newLine, lineNumber: i + 1 });
        } else if (newLine === undefined) {
          // Line removed
          diff.push({ type: 'remove', line: oldLine, lineNumber: i + 1 });
        } else if (oldLine !== newLine) {
          // Line changed
          diff.push({ type: 'remove', line: oldLine, lineNumber: i + 1 });
          diff.push({ type: 'add', line: newLine, lineNumber: i + 1 });
        } else {
          // Line unchanged
          diff.push({ type: 'context', line: oldLine, lineNumber: i + 1 });
        }
      }

      setDiffLines(diff);
    }
  }, [filePath, newContent, oldContent]);

  return (
    <div className="plan-file-diff">
      <div className="plan-file-diff-header" onClick={() => setIsExpanded(!isExpanded)}>
        <FileText size={14} />
        <span className="plan-file-diff-path">{filePath}</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isExpanded && (
        <div className="plan-file-diff-content">
          <div className="plan-file-diff-lines">
            {diffLines.map((diffLine, index) => (
              <div
                key={index}
                className={`plan-file-diff-line plan-file-diff-line-${diffLine.type}`}
              >
                <span className="plan-file-diff-line-number">
                  {diffLine.lineNumber || ''}
                </span>
                <span className="plan-file-diff-line-content">{diffLine.line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanFileDiff;

