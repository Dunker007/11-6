/**
 * PlanningCanvas.tsx
 *
 * PURPOSE:
 * Interactive drag-and-drop canvas for brainstorming and idea planning.
 * Allows users to create, position, and organize sticky notes on a visual board.
 *
 * FEATURES:
 * ✅ Drag-and-drop sticky notes
 * ✅ Multiple color themes for categorization
 * ✅ Text editing on notes
 * ✅ Delete notes
 * ✅ LocalStorage persistence per idea
 * ✅ Export/import canvas state
 * ✅ Pan canvas
 * ✅ Zoom controls
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Download, Upload, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import '../../styles/PlanningCanvas.css';

interface CanvasNote {
  id: string;
  content: string;
  x: number;
  y: number;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';
  width: number;
  height: number;
}

interface PlanningCanvasProps {
  ideaId: string;
  ideaTitle: string;
}

const COLORS: CanvasNote['color'][] = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'];

export function PlanningCanvas({ ideaId, ideaTitle }: PlanningCanvasProps) {
  const [notes, setNotes] = useState<CanvasNote[]>([]);
  const [selectedColor, setSelectedColor] = useState<CanvasNote['color']>('yellow');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const storageKey = `planning-canvas-${ideaId}`;

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setNotes(data.notes || []);
        setZoom(data.zoom || 1);
        setPan(data.pan || { x: 0, y: 0 });
      } catch (error) {
        console.error('Failed to load canvas:', error);
      }
    }
  }, [storageKey]);

  // Save to localStorage
  useEffect(() => {
    const data = { notes, zoom, pan };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [notes, zoom, pan, storageKey]);

  const addNote = useCallback(() => {
    const newNote: CanvasNote = {
      id: crypto.randomUUID(),
      content: 'Double-click to edit',
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
      color: selectedColor,
      width: 200,
      height: 150,
    };
    setNotes(prev => [...prev, newNote]);
  }, [selectedColor]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingId === id) setEditingId(null);
  }, [editingId]);

  const updateNote = useCallback((id: string, updates: Partial<CanvasNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, noteId: string) => {
    if (editingId) return;

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    setDraggingId(noteId);
    setDragOffset({
      x: e.clientX - note.x * zoom - pan.x,
      y: e.clientY - note.y * zoom - pan.y,
    });
  }, [notes, editingId, zoom, pan]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingId) {
      const newX = (e.clientX - dragOffset.x - pan.x) / zoom;
      const newY = (e.clientY - dragOffset.y - pan.y) / zoom;
      updateNote(draggingId, { x: newX, y: newY });
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [draggingId, dragOffset, updateNote, isPanning, panStart, zoom, pan]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (draggingId || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, isPanning, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = useCallback((noteId: string) => {
    setEditingId(noteId);
  }, []);

  const handleBlur = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleContentChange = useCallback((noteId: string, content: string) => {
    updateNote(noteId, { content });
  }, [updateNote]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  }, [pan]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleExport = useCallback(() => {
    const data = { notes, zoom, pan, ideaTitle, ideaId };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-${ideaTitle.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [notes, zoom, pan, ideaTitle, ideaId]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.notes) {
            setNotes(data.notes);
            setZoom(data.zoom || 1);
            setPan(data.pan || { x: 0, y: 0 });
          }
        } catch (error) {
          alert('Failed to import canvas: Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return (
    <div className="planning-canvas-container">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <div className="toolbar-section">
          <button className="canvas-btn primary" onClick={addNote} title="Add Note">
            <Plus size={16} />
            <span>Add Note</span>
          </button>

          <div className="color-picker">
            {COLORS.map(color => (
              <button
                key={color}
                className={`color-btn ${color} ${selectedColor === color ? 'active' : ''}`}
                onClick={() => setSelectedColor(color)}
                title={`${color} note`}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <button className="canvas-btn" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button className="canvas-btn" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="toolbar-section">
          <button className="canvas-btn" onClick={handleExport} title="Export Canvas">
            <Download size={16} />
          </button>
          <button className="canvas-btn" onClick={handleImport} title="Import Canvas">
            <Upload size={16} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="planning-canvas"
        onMouseDown={handleCanvasMouseDown}
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
      >
        <div
          className="canvas-content"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {notes.length === 0 && (
            <div className="canvas-empty-state">
              <Plus size={48} />
              <p>Click "Add Note" to start brainstorming</p>
              <p className="hint">Drag notes to organize, double-click to edit</p>
            </div>
          )}

          {notes.map(note => (
            <div
              key={note.id}
              className={`canvas-note ${note.color} ${draggingId === note.id ? 'dragging' : ''}`}
              style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
                width: `${note.width}px`,
                minHeight: `${note.height}px`,
              }}
              onMouseDown={(e) => handleMouseDown(e, note.id)}
              onDoubleClick={() => handleDoubleClick(note.id)}
            >
              <button
                className="note-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                title="Delete note"
              >
                <Trash2 size={14} />
              </button>

              {editingId === note.id ? (
                <textarea
                  className="note-editor"
                  value={note.content}
                  onChange={(e) => handleContentChange(note.id, e.target.value)}
                  onBlur={handleBlur}
                  autoFocus
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="note-content">{note.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="canvas-instructions">
        <strong>Tips:</strong> Drag notes to move • Double-click to edit • Drag canvas background to pan • Use zoom controls
      </div>
    </div>
  );
}

export default PlanningCanvas;
