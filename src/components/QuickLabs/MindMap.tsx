import { useState, useEffect, useRef, useCallback } from 'react';
import { useMindMapStore } from '../../services/mindmap/mindMapStore';
import type { MindMapNode } from '@/types/mindmap';
import '../../styles/MindMap.css';

function MindMap() {
  const {
    mindMaps,
    currentMindMap,
    selectedNode,
    loadMindMaps,
    createMindMap,
    selectMindMap,
    updateNode,
    deleteNode,
    selectNode,
    clearSelection,
  } = useMindMapStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<MindMapNode | null>(null);
  const [showNewMapDialog, setShowNewMapDialog] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    loadMindMaps();
  }, [loadMindMaps]);

  const handleCreateMap = () => {
    if (newMapName.trim()) {
      createMindMap(newMapName.trim());
      setNewMapName('');
      setShowNewMapDialog(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      clearSelection();
    }
  };

  const handleNodeClick = (e: React.MouseEvent, node: MindMapNode) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  const handleNodeDragStart = (e: React.MouseEvent, node: MindMapNode) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedNode(node);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y,
      });
    }
  };

  const handleNodeDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedNode || !isDragging || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - dragStart.x) / scale;
      const y = (e.clientY - rect.top - dragStart.y) / scale;

      updateNode(draggedNode.id, { x, y });
    },
    [draggedNode, isDragging, dragStart, scale, updateNode]
  );


  const handleDeleteNode = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selectedNode && currentMindMap) {
      deleteNode(selectedNode.id);
    }
  };

  if (!currentMindMap && mindMaps.length === 0) {
    return (
      <div className="mind-map-container">
        <div className="mind-map-empty">
          <h2>No Mind Maps</h2>
          <p>Create your first mind map to get started</p>
          <button onClick={() => setShowNewMapDialog(true)} className="create-btn">
            + Create Mind Map
          </button>
        </div>

        {showNewMapDialog && (
          <div className="modal-overlay" onClick={() => setShowNewMapDialog(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Create New Mind Map</h3>
              <input
                type="text"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                placeholder="Mind map name..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateMap()}
                autoFocus
              />
              <div className="modal-actions">
                <button onClick={handleCreateMap} className="confirm-btn">
                  Create
                </button>
                <button onClick={() => setShowNewMapDialog(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mind-map-container" onKeyDown={handleDeleteNode} tabIndex={0}>
      <div className="mind-map-header">
        <div className="header-left">
          <select
            value={currentMindMap?.id || ''}
            onChange={(e) => selectMindMap(e.target.value)}
            className="map-selector"
          >
            {mindMaps.map((map) => (
              <option key={map.id} value={map.id}>
                {map.name}
              </option>
            ))}
          </select>
          <button onClick={() => setShowNewMapDialog(true)} className="new-map-btn">
            + New Map
          </button>
        </div>
        <div className="header-right">
          <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="zoom-btn">
            −
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(2, scale + 0.1))} className="zoom-btn">
            +
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="mind-map-canvas"
        onClick={handleCanvasClick}
        onMouseUp={() => {
          setIsDragging(false);
          setDraggedNode(null);
        }}
        onMouseMove={handleNodeDrag}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {currentMindMap?.nodes.map((node) => (
          <div
            key={node.id}
            className={`mind-map-node ${selectedNode?.id === node.id ? 'selected' : ''}`}
            style={{
              left: node.x,
              top: node.y,
              backgroundColor: node.color || '#8B5CF6',
            }}
            onClick={(e) => handleNodeClick(e, node)}
            onMouseDown={(e) => handleNodeDragStart(e, node)}
          >
            <div className="node-text">{node.text}</div>
            {node.connections.length > 0 && (
              <div className="node-connections">{node.connections.length}</div>
            )}
          </div>
        ))}
      </div>

      {selectedNode && (
        <div className="mind-map-sidebar">
          <h3>Node Properties</h3>
          <div className="property-group">
            <label>Text</label>
            <input
              type="text"
              value={selectedNode.text}
              onChange={(e) => updateNode(selectedNode.id, { text: e.target.value })}
            />
          </div>
          <div className="property-group">
            <label>Color</label>
            <input
              type="color"
              value={selectedNode.color || '#8B5CF6'}
              onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
            />
          </div>
          <div className="property-group">
            <label>Size</label>
            <select
              value={selectedNode.size || 'medium'}
              onChange={(e) => updateNode(selectedNode.id, { size: e.target.value as any })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="property-group">
            <label>Shape</label>
            <select
              value={selectedNode.shape || 'circle'}
              onChange={(e) => updateNode(selectedNode.id, { shape: e.target.value as any })}
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="diamond">Diamond</option>
              <option value="hexagon">Hexagon</option>
            </select>
          </div>
          <button onClick={() => deleteNode(selectedNode.id)} className="delete-btn">
            Delete Node
          </button>
        </div>
      )}

      {showNewMapDialog && (
        <div className="modal-overlay" onClick={() => setShowNewMapDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Mind Map</h3>
            <input
              type="text"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              placeholder="Mind map name..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreateMap()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={handleCreateMap} className="confirm-btn">
                Create
              </button>
              <button onClick={() => setShowNewMapDialog(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MindMap;