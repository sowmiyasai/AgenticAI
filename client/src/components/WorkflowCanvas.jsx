import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import {
  Play,
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  Send,
  Table,
  GitFork,
  Shuffle,
  Cpu,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
} from 'lucide-react';

export default function WorkflowCanvas({ readOnly = false, activeNodeId = null }) {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedNode,
    setSelectedNode,
    addNode,
    removeNode,
  } = useWorkflowStore();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // For connecting edges between nodes
  const [connectingSource, setConnectingSource] = useState(null);

  const containerRef = useRef(null);

  // Pan controls
  const handleMouseDown = (e) => {
    if (e.target === containerRef.current || e.target.tagName === 'svg' || e.target.classList.contains('canvas-bg')) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingNodeId && !readOnly) {
      const newX = (e.clientX - pan.x) / zoom - dragOffset.x;
      const newY = (e.clientY - pan.y) / zoom - dragOffset.y;
      setNodes(
        nodes.map((n) => (n.id === draggingNodeId ? { ...n, position: { x: Math.round(newX), y: Math.round(newY) } } : n))
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Dragging inside canvas
  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setSelectedNode(node);
    if (!readOnly) {
      setDraggingNodeId(node.id);
      const nodeX = node.position?.x || 0;
      const nodeY = node.position?.y || 0;
      setDragOffset({
        x: (e.clientX - pan.x) / zoom - nodeX,
        y: (e.clientY - pan.y) / zoom - nodeY,
      });
    }
  };

  // Drag & Drop from NodePalette
  const handleDrop = (e) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/reactflow-template');
    if (!rawData) return;

    try {
      const template = JSON.parse(rawData);
      const bounds = containerRef.current.getBoundingClientRect();
      const dropX = (e.clientX - bounds.left - pan.x) / zoom - 100;
      const dropY = (e.clientY - bounds.top - pan.y) / zoom - 40;

      const newNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: template.type,
        position: { x: Math.round(dropX), y: Math.round(dropY) },
        data: {
          label: template.label,
          description: template.description,
          agentType: template.agentType,
          action: template.action,
          config: template.config || {},
        },
      };

      addNode(newNode);
    } catch (err) {
      console.error('Failed to parse dropped node:', err);
    }
  };

  // Edge Connection Handling
  const handlePortClick = (e, nodeId, isSource) => {
    e.stopPropagation();
    if (readOnly) return;

    if (isSource) {
      setConnectingSource(nodeId);
    } else if (connectingSource && connectingSource !== nodeId) {
      // Create new edge
      const newEdgeId = `edge_${connectingSource}_${nodeId}`;
      const exists = edges.some((edge) => edge.source === connectingSource && edge.target === nodeId);
      if (!exists) {
        setEdges([...edges, { id: newEdgeId, source: connectingSource, target: nodeId, animated: true }]);
      }
      setConnectingSource(null);
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'trigger':
        return <Play className="w-4 h-4 text-indigo-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'gmail':
        return <Mail className="w-4 h-4 text-red-400" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'discord':
        return <Send className="w-4 h-4 text-blue-400" />;
      case 'google-sheets':
        return <Table className="w-4 h-4 text-emerald-400" />;
      case 'condition':
        return <GitFork className="w-4 h-4 text-yellow-400" />;
      case 'transform':
        return <Shuffle className="w-4 h-4 text-cyan-400" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  const getAgentBadgeColor = (agentType) => {
    switch (agentType) {
      case 'planner':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
      case 'validation':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'recovery':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'monitoring':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="w-full h-full relative overflow-hidden bg-[#090d16] select-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Zoom / Canvas Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-semibold text-slate-300 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Minimap Card */}
      <div className="absolute bottom-4 right-4 z-20 w-36 h-28 bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md p-2 hidden sm:block">
        <div className="relative w-full h-full bg-slate-900/60 rounded border border-slate-800/60">
          {nodes.map((n) => (
            <div
              key={n.id}
              className="absolute w-2 h-1.5 rounded-xs bg-indigo-500"
              style={{
                left: `${Math.min(Math.max(((n.position?.x || 0) + 100) / 10, 2), 85)}%`,
                top: `${Math.min(Math.max(((n.position?.y || 0) + 50) / 10, 2), 85)}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* SVG Canvas Transform Container */}
      <div
        className="w-full h-full origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Curved Connection Edges */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const sx = (sourceNode.position?.x || 0) + 120;
            const sy = (sourceNode.position?.y || 0) + 110;
            const tx = (targetNode.position?.x || 0) + 120;
            const ty = (targetNode.position?.y || 0) + 5;

            const cy1 = sy + Math.max((ty - sy) / 2, 40);
            const cy2 = ty - Math.max((ty - sy) / 2, 40);
            const pathD = `M ${sx} ${sy} C ${sx} ${cy1}, ${tx} ${cy2}, ${tx} ${ty}`;

            const isEdgeActive = activeNodeId === edge.source || activeNodeId === edge.target;

            return (
              <g key={edge.id || `${edge.source}_${edge.target}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isEdgeActive ? '#38bdf8' : '#6366f1'}
                  strokeWidth="2.5"
                  strokeDasharray={isEdgeActive || edge.animated ? '6,6' : 'none'}
                  markerEnd="url(#arrow)"
                  className={isEdgeActive ? 'animate-pulse' : ''}
                />
                {edge.label && (
                  <text
                    x={(sx + tx) / 2}
                    y={(sy + ty) / 2 - 8}
                    fill="#94a3b8"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="bg-slate-900 px-1 py-0.5 rounded"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isActive = activeNodeId === node.id;
          const pos = node.position || { x: 250, y: 100 };
          const data = node.data || {};

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              className={`absolute w-60 rounded-2xl bg-slate-900/95 border transition-all duration-150 shadow-2xl cursor-pointer ${
                isActive
                  ? 'border-cyan-400 ring-4 ring-cyan-500/50 shadow-cyan-950/60 scale-105 animate-glow'
                  : isSelected
                  ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-indigo-950/50 scale-[1.02]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
              }}
            >
              {/* Top Connection Handle (Target) */}
              <div
                onClick={(e) => handlePortClick(e, node.id, false)}
                className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-slate-900 cursor-pointer transition ${
                  connectingSource && connectingSource !== node.id
                    ? 'bg-emerald-400 ring-4 ring-emerald-500/40 animate-ping'
                    : 'bg-indigo-500 hover:scale-125'
                }`}
                title="Connect input port"
              />

              <div className="p-3.5">
                {/* Node Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                      {getNodeIcon(node.type)}
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight truncate">
                      {data.label || 'Workflow Step'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border shrink-0 ${getAgentBadgeColor(
                      data.agentType
                    )}`}
                  >
                    {data.agentType || 'Exec'}
                  </span>
                </div>

                {/* Node Description preview */}
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {data.description || data.action || 'Workflow step node'}
                </p>

                {/* Node Action Status */}
                {data.action && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono text-indigo-400">{data.action}</span>
                    <span className="flex items-center text-emerald-400 font-medium">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Connection Handle (Source) */}
              <div
                onClick={(e) => handlePortClick(e, node.id, true)}
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-slate-900 cursor-pointer transition ${
                  connectingSource === node.id
                    ? 'bg-amber-400 ring-4 ring-amber-500/40 animate-pulse'
                    : 'bg-indigo-500 hover:scale-125'
                }`}
                title="Connect output port"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
