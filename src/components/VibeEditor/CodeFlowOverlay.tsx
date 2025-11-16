import React, { useMemo, useState } from 'react';
import '@/styles/CodeFlowOverlay.css';

export interface CodeFlowNode {
  id: string;
  label: string;
  filePath: string;
}

export interface CodeFlowEdge {
  from: string;
  to: string;
}

export interface CodeFlowGraphData {
  nodes: CodeFlowNode[];
  edges: CodeFlowEdge[];
}

interface CodeFlowOverlayProps {
  visible: boolean;
  data: CodeFlowGraphData;
  onClose: () => void;
  onNodeClick: (filePath: string) => void;
  onOpenInSplit?: (filePath: string) => void;
}

/**
 * Minimal SVG graph renderer for code flow overlay.
 * Layout: simple circle layout for MVP; edges drawn between node positions.
 */
function CodeFlowOverlay({ visible, data, onClose, onNodeClick, onOpenInSplit }: CodeFlowOverlayProps) {
  const radius = 220;
  const center = { x: 300, y: 260 };
  const [query, setQuery] = useState('');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState<{ active: boolean; startX: number; startY: number }>({ active: false, startX: 0, startY: 0 });
  const [filter, setFilter] = useState<'all' | 'deps' | 'dependents'>('all');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; filePath: string } | null>(null);
  const [edgeTip, setEdgeTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const count = data.nodes.length || 1;
    data.nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / count;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      map.set(node.id, { x, y });
    });
    return map;
  }, [data.nodes]);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    const nodes = data.nodes.filter(n => n.label.toLowerCase().includes(q));
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = data.edges.filter(e => nodeIds.has(e.from) || nodeIds.has(e.to));
    return { nodes, edges };
  }, [data, query]);

  if (!visible) return null;

  return (
    <div className="codeflow-overlay">
      <div className="codeflow-header">
        <h3>Code Flow</h3>
        <input
          placeholder="Filter files…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, margin: '0 8px', padding: '4px 8px', background: 'var(--bg-tertiary,#242936)', color: 'white', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6 }}
        />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className={`loader-item ${filter==='all'?'active':''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`loader-item ${filter==='deps'?'active':''}`} onClick={() => setFilter('deps')}>Dependencies</button>
          <button className={`loader-item ${filter==='dependents'?'active':''}`} onClick={() => setFilter('dependents')}>Dependents</button>
          <button className="loader-item" onClick={() => { setScale(1); setOffset({x:0,y:0}); }}>Reset</button>
        </div>
        <button className="codeflow-close" onClick={onClose} title="Close">×</button>
      </div>
      <div
        className="codeflow-canvas"
        onClick={() => setCtx(null)}
        onMouseDown={(e) => { setPanning({ active: true, startX: e.clientX - offset.x, startY: e.clientY - offset.y }); }}
        onMouseMove={(e) => { if (panning.active) setOffset({ x: e.clientX - panning.startX, y: e.clientY - panning.startY }); }}
        onMouseUp={() => setPanning({ active: false, startX: 0, startY: 0 })}
        onMouseLeave={() => setPanning({ active: false, startX: 0, startY: 0 })}
        onWheel={(e) => {
          e.preventDefault();
          const delta = -Math.sign(e.deltaY) * 0.1;
          const next = Math.min(2.5, Math.max(0.5, scale + delta));
          setScale(next);
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 600 520" preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
          {/* edges */}
          {filtered.edges.map((edge, idx) => {
            const fromPos = positions.get(edge.from);
            const toPos = positions.get(edge.to);
            if (!fromPos || !toPos) return null;
            const highlight = hoverId && (edge.from === hoverId || edge.to === hoverId);
            if (filter === 'deps' && hoverId && edge.from !== hoverId) return null;
            if (filter === 'dependents' && hoverId && edge.to !== hoverId) return null;
            return (
              <line
                key={`edge-${idx}`}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="var(--accent-primary, #00d4ff)"
                strokeOpacity={highlight ? 0.85 : 0.35}
                strokeWidth={highlight ? 2.5 : 2}
                onMouseEnter={(ev) => {
                  const from = data.nodes.find(n => n.id === edge.from)?.label || edge.from;
                  const to = data.nodes.find(n => n.id === edge.to)?.label || edge.to;
                  const r = (ev.target as SVGLineElement).getBoundingClientRect();
                  setEdgeTip({ x: r.left + r.width / 2, y: r.top + 12, text: `${from} → ${to}` });
                }}
                onMouseLeave={() => setEdgeTip(null)}
              />
            );
          })}
          {/* nodes */}
          {filtered.nodes.map((node) => {
            const pos = positions.get(node.id) || center;
            const isHover = hoverId === node.id;
            if (filter === 'deps' && hoverId && node.id !== hoverId && !data.edges.find(e => e.from === hoverId && e.to === node.id)) return null;
            if (filter === 'dependents' && hoverId && node.id !== hoverId && !data.edges.find(e => e.to === hoverId && e.from === node.id)) return null;
            return (
              <g
                key={node.id}
                className="codeflow-node"
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onNodeClick(node.filePath)}
                onMouseEnter={() => setHoverId(node.id)}
                onMouseLeave={() => setHoverId(null)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCtx({ x: e.clientX, y: e.clientY, filePath: node.filePath });
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle r={isHover ? 20 : 18} fill="var(--bg-secondary, #1a1f2e)" stroke="var(--accent-primary, #00d4ff)" strokeWidth={isHover ? 3 : 2} />
                <text
                  x="0"
                  y="36"
                  textAnchor="middle"
                  style={{ fill: 'var(--text-primary, #ffffff)', fontSize: 10 }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
          </g>
        </svg>
        {edgeTip && (
          <div style={{ position: 'fixed', left: edgeTip.x, top: edgeTip.y, background: 'rgba(26,31,46,0.95)', color: 'white', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', pointerEvents: 'none' }}>
            {edgeTip.text}
          </div>
        )}
        {ctx && (
          <div style={{ position: 'fixed', left: ctx.x, top: ctx.y, background: 'var(--bg-secondary,#1a1f2e)', color: 'white', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 6, zIndex: 10001 }} onClick={(e) => e.stopPropagation()}>
            <button className="loader-item" onClick={() => { onOpenInSplit?.(ctx.filePath); setCtx(null); }}>
              Open in split
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeFlowOverlay;


