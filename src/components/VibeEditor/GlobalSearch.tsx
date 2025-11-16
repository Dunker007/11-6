import { useEffect, useMemo, useRef, useState } from 'react';
import { useProjectStore } from '@/services/project/projectStore';
import TechIcon from '../Icons/TechIcon';
import { Search, Eye, SplitSquareHorizontal } from 'lucide-react';
import '@/styles/GlobalSearch.css';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (path: string, split?: boolean) => void;
  onRevealInSidebar?: (path: string) => void;
}

export default function GlobalSearch({ isOpen, onClose, onOpenFile, onRevealInSidebar }: GlobalSearchProps) {
  const { activeProject, getFileContent } = useProjectStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!activeProject) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const items: Array<{ path: string; name: string; snippet?: string }> = [];
    const walk = (file: any) => {
      if (file.isDirectory && file.children) {
        file.children.forEach(walk);
      } else if (!file.isDirectory) {
        const name = file.name || '';
        const content = (getFileContent(file.path) || '').slice(0, 4000);
        const hay = (name + ' ' + content).toLowerCase();
        if (hay.includes(q)) {
          // find snippet
          const idx = content.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 40);
          const end = Math.min(content.length, idx + 80);
          const snippet = idx >= 0 ? content.slice(start, end) : undefined;
          items.push({ path: file.path, name, snippet });
        }
      }
    };
    activeProject.files.forEach(walk);
    return items.slice(0, 50);
  }, [activeProject, getFileContent, query]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, Math.max(0, results.length - 1)));
        scrollIntoView(Math.min(selected + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(0, s - 1));
        scrollIntoView(Math.max(0, selected - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[selected];
        if (item) {
          onOpenFile(item.path, false);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, results, selected, onClose, onOpenFile]);

  const scrollIntoView = (idx: number) => {
    if (!listRef.current) return;
    const child = listRef.current.children[idx] as HTMLElement | undefined;
    child?.scrollIntoView({ block: 'nearest' });
  };

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search" onClick={(e) => e.stopPropagation()}>
        <div className="gs-header">
          <TechIcon icon={Search} size={18} glow="none" />
          <input
            ref={inputRef}
            className="gs-input"
            placeholder="Search files and content…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
          />
          <button className="gs-close" onClick={onClose}>×</button>
        </div>
        <div className="gs-results" ref={listRef}>
          {results.length === 0 && (
            <div className="gs-empty">Type to search across filenames and content…</div>
          )}
          {results.map((r, i) => (
            <div key={r.path} className={`gs-item ${i === selected ? 'active' : ''}`} onMouseEnter={() => setSelected(i)}>
              <div className="gs-row">
                <div className="gs-name">{r.name}</div>
                <div className="gs-actions">
                  <button onClick={() => onOpenFile(r.path, false)} title="Open">
                    <TechIcon icon={Eye} size={14} glow="none" />
                  </button>
                  <button onClick={() => onOpenFile(r.path, true)} title="Open in split">
                    <TechIcon icon={SplitSquareHorizontal} size={14} glow="none" />
                  </button>
                  {onRevealInSidebar && (
                    <button onClick={() => onRevealInSidebar(r.path)} title="Reveal in sidebar">
                      📂
                    </button>
                  )}
                </div>
              </div>
              {r.snippet && <div className="gs-snippet">{r.snippet}</div>}
              <div className="gs-path">{r.path}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


