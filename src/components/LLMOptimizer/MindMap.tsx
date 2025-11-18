/**
 * MindMap.tsx
 *
 * PURPOSE:
 * Interactive mind map visualization for exploring idea relationships and structure.
 * Visual node-based interface with drag-and-drop, connections, and hierarchy.
 *
 * FEATURES:
 * ✅ Central idea node with child nodes
 * ✅ Drag nodes to reposition
 * ✅ Add/edit/delete nodes
 * ✅ Visual connections (SVG lines) between nodes
 * ✅ Node types (idea, feature, task, note)
 * ✅ LocalStorage persistence per idea
 * ✅ Export/import mind map
 * ✅ Auto-layout suggestions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Download, Upload, Trash2, Edit2, Save, X } from 'lucide-react';
import '../../styles/MindMap.css';

interface MindMapNode {
  id: string;
  content: string;
  x: number;
  y: number;
  type: 'central' | 'feature' | 'task' | 'note';
  parentId: string | null;
  color: string;
}

interface MindMapProps {
  ideaId: string;
  ideaTitle: string;
}

const NODE_COLORS = {
  central: '#8b5cf6', // purple
  feature: '#3b82f6', // blue
  task: '#10b981', // green
  note: '#f59e0b', // amber
};

export function MindMap({ ideaId, ideaTitle }: MindMapProps) {
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const storageKey = `mindmap-${ideaId}`;

  // Initialize with central node
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setNodes(data.nodes || []);
        setPan(data.pan || { x: 0, y: 0 });
      } catch (error) {
        console.error('Failed to load mind map:', error);
      }
    } else {
      // Create central node
      const centralNode: MindMapNode = {
        id: 'central',
        content: ideaTitle,
        x: 400,
        y: 300,
        type: 'central',
        parentId: null,
        color: NODE_COLORS.central,
      };
      setNodes([centralNode]);
    }
  }, [storageKey, ideaTitle]);

  // Save to localStorage
  useEffect(() => {
    if (nodes.length > 0) {
      const data = { nodes, pan };
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [nodes, pan, storageKey]);

  const addNode = useCallback((type: MindMapNode['type'], parentId: string | null = null) => {
    const parent = parentId ? nodes.find(n => n.id === parentId) : nodes.find(n => n.type === 'central');
    if (!parent) return;

    // Calculate position around parent
    const childrenCount = nodes.filter(n => n.parentId === parent.id).length;
    const angle = (childrenCount * 60) * (Math.PI / 180);
    const distance = 200;

    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      content: `New ${type}`,
      x: parent.x + Math.cos(angle) * distance,
      y: parent.y + Math.sin(angle) * distance,
      type,
      parentId: parent.id,
      color: NODE_COLORS[type],
    };

    setNodes(prev => [...prev, newNode]);
    setEditingId(newNode.id);
    setEditContent(newNode.content);
  }, [nodes]);

  const deleteNode = useCallback((id: string) => {
    if (id === 'central') return; // Can't delete central node

    // Delete node and all its children
    const deleteWithChildren = (nodeId: string) => {
      const children = nodes.filter(n => n.parentId === nodeId);
      children.forEach(child => deleteWithChildren(child.id));
      setNodes(prev => prev.filter(n => n.id !== nodeId));
    };

    deleteWithChildren(id);
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (editingId === id) setEditingId(null);
  }, [nodes, selectedNodeId, editingId]);

  const updateNode = useCallback((id: string, updates: Partial<MindMapNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const startEdit = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditingId(nodeId);
      setEditContent(node.content);
    }
  }, [nodes]);

  const saveEdit = useCallback(() => {
    if (editingId) {
      updateNode(editingId, { content: editContent });
      setEditingId(null);
    }
  }, [editingId, editContent, updateNode]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent('');
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (editingId) return;

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingId(nodeId);
    setSelectedNodeId(nodeId);
    setDragOffset({
      x: e.clientX - node.x - pan.x,
      y: e.clientY - node.y - pan.y,
    });
  }, [nodes, editingId, pan]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingId) {
      const newX = e.clientX - dragOffset.x - pan.x;
      const newY = e.clientY - dragOffset.y - pan.y;
      updateNode(draggingId, { x: newX, y: newY });
    }
  }, [draggingId, dragOffset, updateNode, pan]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const handleExport = useCallback(() => {
    const data = { nodes, pan, ideaTitle, ideaId };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${ideaTitle.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, pan, ideaTitle, ideaId]);

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
          if (data.nodes) {
            setNodes(data.nodes);
            setPan(data.pan || { x: 0, y: 0 });
          }
        } catch (error) {
          alert('Failed to import mind map: Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const autoLayout = useCallback(() => {
    const central = nodes.find(n => n.type === 'central');
    if (!central) return;

    const newNodes = [...nodes];
    const children = newNodes.filter(n => n.parentId === central.id);

    // Arrange children in a circle
    children.forEach((child, index) => {
      const angle = (index / children.length) * 2 * Math.PI;
      const distance = 250;
      child.x = central.x + Math.cos(angle) * distance;
      child.y = central.y + Math.sin(angle) * distance;

      // Arrange grandchildren
      const grandchildren = newNodes.filter(n => n.parentId === child.id);
      grandchildren.forEach((grandchild, gIndex) => {
        const gAngle = angle + (gIndex - (grandchildren.length - 1) / 2) * 0.5;
        const gDistance = 150;
        grandchild.x = child.x + Math.cos(gAngle) * gDistance;
        grandchild.y = child.y + Math.sin(gAngle) * gDistance;
      });
    });

    setNodes(newNodes);
  }, [nodes]);

  // Render connections (SVG lines)
  const renderConnections = () => {
    return nodes
      .filter(node => node.parentId)
      .map(node => {
        const parent = nodes.find(n => n.id === node.parentId);
        if (!parent) return null;

        return (
          <line
            key={`line-${node.id}`}
            x1={parent.x + pan.x + 60}
            y1={parent.y + pan.y + 40}
            x2={node.x + pan.x + 60}
            y2={node.y + pan.y + 40}
            stroke={node.color}
            strokeWidth="2"
            opacity="0.5"
          />
        );
      });
  };

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  return (
    <div className="mindmap-container">
      {/* Toolbar */}
      <div className="mindmap-toolbar">
        <div className="toolbar-section">
          <button
            className="mindmap-btn feature"
            onClick={() => addNode('feature', selectedNodeId)}
            title="Add Feature"
            disabled={!selectedNodeId && nodes.length > 1}
          >
            <Plus size={16} />
            Feature
          </button>
          <button
            className="mindmap-btn task"
            onClick={() => addNode('task', selectedNodeId)}
            title="Add Task"
            disabled={!selectedNodeId && nodes.length > 1}
          >
            <Plus size={16} />
            Task
          </button>
          <button
            className="mindmap-btn note"
            onClick={() => addNode('note', selectedNodeId)}
            title="Add Note"
            disabled={!selectedNodeId && nodes.length > 1}
          >
            <Plus size={16} />
            Note
          </button>
        </div>

        <div className="toolbar-section">
          <button className="mindmap-btn" onClick={autoLayout} title="Auto Layout">
            Auto Layout
          </button>
        </div>

        <div className="toolbar-section">
          <button className="mindmap-btn" onClick={handleExport} title="Export">
            <Download size={16} />
          </button>
          <button className="mindmap-btn" onClick={handleImport} title="Import">
            <Upload size={16} />
          </button>
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div className="mindmap-canvas">
        {/* SVG for connections */}
        <svg ref={svgRef} className="mindmap-connections">
          {renderConnections()}
        </svg>

        {/* Nodes */}
        <div className="mindmap-nodes">
          {nodes.map(node => (
            <div
              key={node.id}
              className={`mindmap-node ${node.type} ${selectedNodeId === node.id ? 'selected' : ''} ${draggingId === node.id ? 'dragging' : ''}`}
              style={{
                left: `${node.x + pan.x}px`,
                top: `${node.y + pan.y}px`,
                borderColor: node.color,
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
            >
              {editingId === node.id ? (
                <div className="node-editor" onMouseDown={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                    className="node-input"
                  />
                  <div className="editor-actions">
                    <button onClick={saveEdit} className="editor-btn save">
                      <Save size={14} />
                    </button>
                    <button onClick={cancelEdit} className="editor-btn cancel">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="node-content">{node.content}</div>
                  <div className="node-actions">
                    {node.id !== 'central' && (
                      <>
                        <button
                          className="node-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(node.id);
                          }}
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="node-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {nodes.length === 1 && (
          <div className="mindmap-empty-state">
            <p>Click a node type button to add child nodes</p>
            <p className="hint">Features, Tasks, and Notes will connect to the selected node</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mindmap-instructions">
        <strong>Tips:</strong> Click node to select • Drag to move • Add children by selecting parent first • Use Auto Layout to organize
        {selectedNode && <span className="selected-info"> | Selected: {selectedNode.content}</span>}
      </div>
    </div>
  );
}

export default MindMap;
