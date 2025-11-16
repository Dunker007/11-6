import React, { useState } from 'react';
import '@/styles/DiffViewer.css';

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

function lineDiff(a: string, b: string): Array<{ type: 'add' | 'del' | 'eq'; text: string }> {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const max = Math.max(aLines.length, bLines.length);
  const out: Array<{ type: 'add' | 'del' | 'eq'; text: string }> = [];
  for (let i = 0; i < max; i++) {
    const l = aLines[i] ?? '';
    const r = bLines[i] ?? '';
    if (l === r) {
      out.push({ type: 'eq', text: r });
    } else {
      if (l) out.push({ type: 'del', text: l });
      if (r) out.push({ type: 'add', text: r });
    }
  }
  return out;
}

function wordDiff(a: string, b: string): Array<{ type: 'add' | 'del' | 'eq'; text: string }> {
  const aWords = a.split(/(\s+)/);
  const bWords = b.split(/(\s+)/);
  const max = Math.max(aWords.length, bWords.length);
  const out: Array<{ type: 'add' | 'del' | 'eq'; text: string }> = [];
  for (let i = 0; i < max; i++) {
    const l = aWords[i] ?? '';
    const r = bWords[i] ?? '';
    if (l === r) {
      out.push({ type: 'eq', text: r });
    } else {
      if (l) out.push({ type: 'del', text: l });
      if (r) out.push({ type: 'add', text: r });
    }
  }
  return out;
}

export default function DiffViewer({ oldText, newText }: DiffViewerProps) {
  const [mode, setMode] = useState<'line' | 'word'>('line');
  const chunks = mode === 'line' ? lineDiff(oldText, newText) : wordDiff(oldText, newText);
  return (
    <div className="diff-viewer">
      <div className="diff-toolbar">
        <span>Diff:</span>
        <button className={mode === 'line' ? 'active' : ''} onClick={() => setMode('line')}>Line</button>
        <button className={mode === 'word' ? 'active' : ''} onClick={() => setMode('word')}>Word</button>
      </div>
      <pre className="diff-pre">
        {chunks.map((c, i) => (
          <div key={i} className={`diff-line diff-${c.type}`}>
            {c.type === 'add' ? '+ ' : c.type === 'del' ? '- ' : '  '}
            {c.text}
          </div>
        ))}
      </pre>
    </div>
  );
}


