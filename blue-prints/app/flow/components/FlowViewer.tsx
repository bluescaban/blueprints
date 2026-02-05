'use client';

/**
 * FlowViewer Component v2.0
 *
 * Renders a FlowGraph as an interactive React Flow diagram.
 * Supports:
 * - Multiple flow groups with tab navigation
 * - Multiple swimlanes (horizontal grouping)
 * - Different node types with custom styling
 * - Edge labels
 * - Pan and zoom
 * - Info panel for assumptions, questions, risks
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionLineType,
  Connection,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowGraph, FlowNode, FlowEdge, FlowGroupOutput, LANE_COLORS, CANVAS_BG } from '@/lib/flowgraph-types';
import { nodeTypes } from './CustomNodes';

// ============================================================================
// Layout Configuration (Left-to-Right Flow with Row Wrapping)
// ============================================================================

const LEVEL_SPACING_X = 380; // Horizontal spacing between levels
const NODE_SPACING_Y = 140; // Vertical spacing between nodes at same level
const ROW_SPACING_Y = 100; // Vertical spacing between rows
const START_OFFSET_X = 60; // Left margin
const START_OFFSET_Y = 60; // Top margin
const LEVELS_PER_ROW = 4; // Number of levels before wrapping to next row

// Node heights for vertical stacking
const NODE_HEIGHTS: Record<string, number> = {
  step: 90,
  system: 80,
  decision: 120,
  start: 70,
  end: 70,
  exit: 70,
};

// ============================================================================
// Types
// ============================================================================

interface FlowViewerProps {
  flowGraph: FlowGraph;
  onRegisterSave?: (callback: () => void) => void;
  onRegisterReset?: (callback: () => void) => void;
  onLayoutStateChange?: (hasChanges: boolean, hasSavedLayout: boolean) => void;
  showLayoutToolbar?: boolean;
  // External flow selection control (when managed by parent)
  activeFlowId?: string;
  onSelectFlow?: (flowId: string) => void;
}

// ============================================================================
// Layout Functions (Left-to-Right Flow)
// ============================================================================

/**
 * Compute the depth (level) of each node using BFS from start nodes.
 * Level determines horizontal position (left to right).
 */
function computeNodeLevels(
  nodes: FlowNode[],
  edges: FlowEdge[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from)!.push(edge.to);
  }

  const hasIncoming = new Set<string>();
  for (const edge of edges) {
    hasIncoming.add(edge.to);
  }

  // Start nodes are at level 0
  const startNodes = nodes.filter(n => n.type === 'start' || !hasIncoming.has(n.id));

  const queue: { id: string; level: number }[] = [];
  for (const node of startNodes) {
    queue.push({ id: node.id, level: 0 });
    levels.set(node.id, 0);
  }

  // Track visit counts to detect cycles and prevent infinite loops
  const visitCount = new Map<string, number>();
  const MAX_VISITS_PER_NODE = 2;
  const MAX_ITERATIONS = nodes.length * 3;
  let iterations = 0;

  while (queue.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const { id, level } = queue.shift()!;
    const neighbors = adjacency.get(id) || [];

    for (const neighbor of neighbors) {
      const visits = visitCount.get(neighbor) || 0;
      if (visits >= MAX_VISITS_PER_NODE) {
        continue;
      }

      const currentLevel = levels.get(neighbor);
      const newLevel = level + 1;

      if (currentLevel === undefined || newLevel > currentLevel) {
        levels.set(neighbor, newLevel);
        visitCount.set(neighbor, visits + 1);
        queue.push({ id: neighbor, level: newLevel });
      }
    }
  }

  // Ensure all nodes have a level
  for (const node of nodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  }

  return levels;
}

/**
 * Count outgoing edges per node for layout adjustments.
 */
function countOutgoingEdges(edges: FlowEdge[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of edges) {
    counts.set(edge.from, (counts.get(edge.from) || 0) + 1);
  }
  return counts;
}

/**
 * Auto-layout nodes in a left-to-right flow.
 * X position based on graph depth (level), Y position spreads nodes vertically.
 * Start nodes on left, End/Exit nodes on right.
 */
function layoutNodes(nodes: FlowNode[], edges: FlowEdge[]): Node[] {
  const result: Node[] = [];
  const nodeLevels = computeNodeLevels(nodes, edges);
  const outgoingCounts = countOutgoingEdges(edges);

  // Find the maximum level
  let maxLevel = 0;
  for (const level of nodeLevels.values()) {
    if (level > maxLevel) maxLevel = level;
  }

  // Push end/exit nodes to the rightmost level
  const adjustedLevels = new Map<string, number>();
  for (const node of nodes) {
    const baseLevel = nodeLevels.get(node.id) || 0;
    if (node.type === 'end' || node.type === 'exit') {
      // End nodes go to the last column
      adjustedLevels.set(node.id, maxLevel + 1);
    } else {
      adjustedLevels.set(node.id, baseLevel);
    }
  }

  // Recalculate max level after adjustment
  maxLevel = 0;
  for (const level of adjustedLevels.values()) {
    if (level > maxLevel) maxLevel = level;
  }

  // Group nodes by their level
  const nodesByLevel = new Map<number, FlowNode[]>();
  for (const node of nodes) {
    const level = adjustedLevels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  }

  // Sort levels
  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

  // Sort nodes within each level by type priority
  const typePriority: Record<string, number> = {
    start: 0,
    step: 1,
    decision: 2,
    system: 3,
    end: 4,
    exit: 5,
  };

  for (const level of sortedLevels) {
    const levelNodes = nodesByLevel.get(level)!;
    levelNodes.sort((a, b) => {
      const priorityDiff = (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.lane || '').localeCompare(b.lane || '');
    });
  }

  // Calculate the height of each level (for row layout)
  const levelHeights = new Map<number, number>();
  for (const level of sortedLevels) {
    const levelNodes = nodesByLevel.get(level)!;
    let height = 0;
    for (const node of levelNodes) {
      height += (NODE_HEIGHTS[node.type] || 80) + NODE_SPACING_Y;
    }
    levelHeights.set(level, height);
  }

  // Group levels into rows
  const rows: number[][] = [];
  let currentRow: number[] = [];

  for (const level of sortedLevels) {
    currentRow.push(level);
    if (currentRow.length >= LEVELS_PER_ROW) {
      rows.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Calculate row Y offsets based on max height in each row
  const rowYOffsets: number[] = [];
  let accumulatedY = START_OFFSET_Y;

  for (const row of rows) {
    rowYOffsets.push(accumulatedY);
    // Find the maximum height in this row
    let maxRowHeight = 0;
    for (const level of row) {
      const height = levelHeights.get(level) || 0;
      if (height > maxRowHeight) maxRowHeight = height;
    }
    accumulatedY += maxRowHeight + ROW_SPACING_Y;
  }

  // Calculate positions with row wrapping
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowBaseY = rowYOffsets[rowIndex];

    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const level = row[colIndex];
      const levelNodes = nodesByLevel.get(level)!;

      let currentY = rowBaseY;

      for (const node of levelNodes) {
        const x = START_OFFSET_X + colIndex * LEVEL_SPACING_X;
        const y = currentY;

        // Add slight offset for decision nodes with multiple outputs
        const outCount = outgoingCounts.get(node.id) || 0;
        let xOffset = 0;
        if (node.type === 'decision' && outCount > 1) {
          xOffset = -20;
        }

        const nodeHeight = NODE_HEIGHTS[node.type] || 80;
        currentY += nodeHeight + NODE_SPACING_Y;

        result.push({
          id: node.id,
          type: node.type,
          position: { x: x + xOffset, y },
          data: {
            label: node.label,
            lane: node.lane || 'User',
            nodeType: node.type,
            inferred: node.inferred,
            hasMultipleConnections: outCount > 1,
          },
        });
      }
    }
  }

  return result;
}

/**
 * Convert FlowGraph edges to React Flow edges.
 * Uses different routing for Yes/No branches to improve visibility.
 */
function convertEdges(edges: FlowEdge[], nodes: FlowNode[]): Edge[] {
  const nodeLanes = new Map<string, string>();
  const nodeTypes = new Map<string, string>();
  for (const node of nodes) {
    nodeLanes.set(node.id, node.type === 'system' ? 'System' : node.lane);
    nodeTypes.set(node.id, node.type);
  }

  // Count edges from each source to detect branching nodes
  const edgesFromSource = new Map<string, FlowEdge[]>();
  for (const edge of edges) {
    if (!edgesFromSource.has(edge.from)) {
      edgesFromSource.set(edge.from, []);
    }
    edgesFromSource.get(edge.from)!.push(edge);
  }

  return edges.map((edge, index) => {
    const sourceLane = nodeLanes.get(edge.from);
    const targetLane = nodeLanes.get(edge.to);
    const sourceType = nodeTypes.get(edge.from);
    const isSameLane = sourceLane === targetLane;
    const isFromDecision = sourceType === 'decision';
    const sourceEdges = edgesFromSource.get(edge.from) || [];
    const hasSiblingEdges = sourceEdges.length > 1;

    // Determine edge type and styling based on context
    const isYesBranch = edge.label?.toLowerCase() === 'yes';
    const isNoBranch = edge.label?.toLowerCase() === 'no';

    // Use smoothstep for all decision branches and cross-lane edges
    // This creates curved paths that are easier to follow
    const edgeType = (isFromDecision || !isSameLane) ? 'smoothstep' : 'straight';

    // Different styling for Yes vs No branches to help distinguish them
    let strokeColor = '#ffffff';
    let strokeWidth = 3;

    if (isFromDecision && hasSiblingEdges) {
      if (isNoBranch) {
        // No branch: slightly different color (light red/coral tint)
        strokeColor = '#ffb3b3';
        strokeWidth = 3;
      } else if (isYesBranch) {
        // Yes branch: slightly different color (light green tint)
        strokeColor = '#b3ffb3';
        strokeWidth = 3;
      }
    }

    return {
      id: `e-${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      type: edgeType,
      markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
      style: { strokeWidth, stroke: strokeColor },
      labelStyle: { fontSize: 12, fontWeight: 700, fill: '#1e3a5f' },
      labelBgStyle: { fill: 'white', fillOpacity: 1 },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 6,
      animated: isYesBranch,
    };
  });
}

// ============================================================================
// Flow Group Tabs Component
// ============================================================================

interface FlowGroupTabsProps {
  flows: FlowGroupOutput[];
  activeFlowId: string;
  onSelectFlow: (flowId: string) => void;
}

function FlowGroupTabs({ flows, activeFlowId, onSelectFlow }: FlowGroupTabsProps) {
  if (flows.length <= 1) return null;

  return (
    <div className="absolute top-4 left-4 z-20 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
      {flows.map(flow => (
        <button
          key={flow.id}
          onClick={() => onSelectFlow(flow.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeFlowId === flow.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {flow.name}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Legend Component
// ============================================================================

interface LegendProps {
  lanes: string[];
}

function Legend({ lanes }: LegendProps) {
  return (
    <div
      className="absolute top-4 right-4 z-20 w-56 rounded-xl border border-white/30 overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="px-4 py-3 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-white">
        <h4 className="text-sm font-bold text-gray-800">Legend</h4>
      </div>
      <div className="p-3 space-y-3">
        {/* Node Types */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Node Types</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-5 rounded-md border-2 border-white bg-blue-100 shadow-sm" />
              <span className="text-xs text-gray-700">Step (User Action)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-5 rounded-md border-2 border-white border-dashed bg-slate-100 shadow-sm flex items-center justify-center">
                <span className="text-[8px]">⚙️</span>
              </div>
              <span className="text-xs text-gray-700">System Action</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 border-2 border-white bg-blue-100 shadow-sm"
                style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
              />
              <span className="text-xs text-gray-700">Decision Point</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-white bg-blue-100 shadow-sm flex items-center justify-center">
                <span className="text-[8px] text-blue-600">▶</span>
              </div>
              <span className="text-xs text-gray-700">Start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-white bg-green-100 shadow-sm flex items-center justify-center">
                <span className="text-[8px] text-green-600">✓</span>
              </div>
              <span className="text-xs text-gray-700">End / Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-white bg-amber-100 shadow-sm flex items-center justify-center">
                <span className="text-[8px] text-amber-600">↩</span>
              </div>
              <span className="text-xs text-gray-700">Exit / Alternative</span>
            </div>
          </div>
        </div>

        {/* Lanes/Actors */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Actors</p>
          <div className="space-y-1.5">
            {lanes.map(lane => {
              const colors = LANE_COLORS[lane] || LANE_COLORS.User;
              return (
                <div key={lane} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span className="text-xs text-gray-700">{lane}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edge Labels */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Edges</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-white rounded shadow-sm relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-white border-y-2 border-y-transparent" />
              </div>
              <span className="text-xs text-gray-700">Flow direction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 rounded" style={{ backgroundColor: '#b3ffb3' }} />
              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 rounded font-semibold text-green-700">Yes</span>
              <span className="text-xs text-gray-700">Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 rounded" style={{ backgroundColor: '#ffb3b3' }} />
              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 rounded font-semibold text-red-700">No</span>
              <span className="text-xs text-gray-700">Alternative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Layout Persistence
// ============================================================================

/**
 * Generate a storage key for the flowgraph layout.
 */
function getStorageKey(flowGraph: FlowGraph, flowId: string): string {
  const feature = flowGraph.meta.feature || 'unknown';
  const sanitized = feature.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
  return `blueprints-layout-${sanitized}-${flowId}`;
}

/**
 * Save node positions to localStorage.
 */
function saveNodePositions(key: string, nodes: Node[]): void {
  const positions: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    positions[node.id] = { x: node.position.x, y: node.position.y };
  }
  try {
    localStorage.setItem(key, JSON.stringify(positions));
  } catch {
    console.warn('Failed to save layout to localStorage');
  }
}

/**
 * Load saved node positions from localStorage.
 */
function loadNodePositions(key: string): Record<string, { x: number; y: number }> | null {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    console.warn('Failed to load layout from localStorage');
  }
  return null;
}

/**
 * Apply saved positions to nodes.
 */
function applyPositions(nodes: Node[], positions: Record<string, { x: number; y: number }>): Node[] {
  return nodes.map(node => {
    const savedPos = positions[node.id];
    if (savedPos) {
      return { ...node, position: savedPos };
    }
    return node;
  });
}

// ============================================================================
// Layout Toolbar Component
// ============================================================================

interface LayoutToolbarProps {
  onSave: () => void;
  onReset: () => void;
  hasChanges: boolean;
  hasSavedLayout: boolean;
}

function LayoutToolbar({ onSave, onReset, hasChanges, hasSavedLayout }: LayoutToolbarProps) {
  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2 rounded-xl p-2 border border-white/30"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      }}
    >
      <button
        onClick={onSave}
        disabled={!hasChanges}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
          hasChanges
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Save Layout
      </button>
      <button
        onClick={onReset}
        disabled={!hasSavedLayout && !hasChanges}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
          (hasSavedLayout || hasChanges)
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset
      </button>
    </div>
  );
}

// ============================================================================
// Node Edit Modal Component
// ============================================================================

interface NodeEditModalProps {
  nodeId: string;
  initialLabel: string;
  onSave: (nodeId: string, newLabel: string) => void;
  onClose: () => void;
}

function NodeEditModal({ nodeId, initialLabel, onSave, onClose }: NodeEditModalProps) {
  const [label, setLabel] = useState(initialLabel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (label.trim()) {
      onSave(nodeId, label.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl border border-white/30 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50"
          style={{
            background: 'linear-gradient(135deg, rgba(74, 133, 200, 0.1), rgba(74, 133, 200, 0.05))',
          }}
        >
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Node
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Node Label
          </label>
          <textarea
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-gray-800"
            rows={3}
            autoFocus
            placeholder="Enter node label..."
          />

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Edge Label Modal Component (for creating new edges)
// ============================================================================

interface EdgeLabelModalProps {
  connection: Connection;
  onSave: (connection: Connection, label: string) => void;
  onClose: () => void;
}

function EdgeLabelModal({ connection, onSave, onClose }: EdgeLabelModalProps) {
  const [label, setLabel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(connection, label.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl border border-white/30 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50"
          style={{
            background: 'linear-gradient(135deg, rgba(74, 133, 200, 0.1), rgba(74, 133, 200, 0.05))',
          }}
        >
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            New Connection
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Edge Label (optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800"
            autoFocus
            placeholder="e.g., Yes, No, Success, Error..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Common labels: Yes, No, Success, Error, Cancel
          </p>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
            >
              Create Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Edge Edit Modal Component (for editing existing edges)
// ============================================================================

interface EdgeEditModalProps {
  edgeId: string;
  initialLabel: string;
  onSave: (edgeId: string, newLabel: string) => void;
  onDelete: (edgeId: string) => void;
  onClose: () => void;
}

function EdgeEditModal({ edgeId, initialLabel, onSave, onDelete, onClose }: EdgeEditModalProps) {
  const [label, setLabel] = useState(initialLabel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(edgeId, label.trim());
    onClose();
  };

  const handleDelete = () => {
    onDelete(edgeId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl border border-white/30 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50"
          style={{
            background: 'linear-gradient(135deg, rgba(74, 133, 200, 0.1), rgba(74, 133, 200, 0.05))',
          }}
        >
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Connection
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Edge Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800"
            autoFocus
            placeholder="e.g., Yes, No, Success, Error..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Leave empty to remove the label
          </p>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              title="Delete this connection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FlowViewer({
  flowGraph,
  onRegisterSave,
  onRegisterReset,
  onLayoutStateChange,
  showLayoutToolbar = true,
  activeFlowId: externalActiveFlowId,
  onSelectFlow: externalOnSelectFlow,
}: FlowViewerProps) {
  // State for flow group selection
  const flows = flowGraph.flows || [];
  const isExternallyControlled = externalActiveFlowId !== undefined && externalOnSelectFlow !== undefined;

  // Default to the 'main' flow when available, otherwise fall back to the
  // first flow in the list (or 'main' if nothing present). Use an effect so
  // the selection will update if `flowGraph.flows` changes at runtime.
  const initialFlowId = flows.find(f => f.id === 'main') ? 'main' : (flows[0]?.id || 'main');
  const [internalActiveFlowId, setInternalActiveFlowId] = useState<string>(initialFlowId);

  // Use external or internal state
  const activeFlowId = isExternallyControlled ? externalActiveFlowId : internalActiveFlowId;
  const setActiveFlowId = isExternallyControlled ? externalOnSelectFlow : setInternalActiveFlowId;

  useEffect(() => {
    if (flows.length === 0 || isExternallyControlled) return;
    const defaultId = flows.find(f => f.id === 'main') ? 'main' : flows[0].id;
    setInternalActiveFlowId(defaultId);
  }, [flows, isExternallyControlled]);

  // Get active flow's nodes and edges, or fall back to combined
  const activeFlow = flows.find(f => f.id === activeFlowId);
  const displayNodes = activeFlow?.nodes || flowGraph.nodes;
  const displayEdges = activeFlow?.edges || flowGraph.edges;

  // Storage key for this flow
  const storageKey = getStorageKey(flowGraph, activeFlowId);

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const [hasSavedLayout, setHasSavedLayout] = useState(false);

  // Edit modal state
  const [editingNode, setEditingNode] = useState<{ id: string; label: string } | null>(null);

  // Edge creation state
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);

  // Edge edit state
  const [editingEdge, setEditingEdge] = useState<{ id: string; label: string } | null>(null);

  // Compute the default layout
  const defaultNodes = useMemo(
    () => layoutNodes(displayNodes, displayEdges),
    [displayNodes, displayEdges]
  );

  // Load saved positions or use default layout
  // Note: We don't check localStorage here during SSR to avoid hydration mismatch.
  // The useEffect below handles loading saved positions after hydration.
  const initialNodes = useMemo(
    () => defaultNodes,
    [defaultNodes]
  );

  const initialEdges = useMemo(
    () => convertEdges(displayEdges, displayNodes),
    [displayEdges, displayNodes]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Check for saved layout on mount/flow change
  useEffect(() => {
    const saved = loadNodePositions(storageKey);
    setHasSavedLayout(!!saved);
    setHasChanges(false);
  }, [storageKey]);

  // Update nodes/edges when active flow changes
  useEffect(() => {
    const saved = loadNodePositions(storageKey);
    const newNodes = saved ? applyPositions(defaultNodes, saved) : defaultNodes;
    setNodes(newNodes);
    setEdges(convertEdges(displayEdges, displayNodes));
    setHasChanges(false);
  }, [activeFlowId, defaultNodes, displayEdges, displayNodes, storageKey, setNodes, setEdges]);

  // Track node position changes
  const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes);
    // Check if any position changes occurred
    const hasPositionChange = changes.some(
      change => change.type === 'position' && change.dragging === false
    );
    if (hasPositionChange) {
      setHasChanges(true);
    }
  }, [onNodesChange]);

  // Save current layout
  const handleSave = useCallback(() => {
    saveNodePositions(storageKey, nodes);
    setHasChanges(false);
    setHasSavedLayout(true);
  }, [storageKey, nodes]);

  // Reset to default layout
  const handleReset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore errors
    }
    setNodes(defaultNodes);
    setHasChanges(false);
    setHasSavedLayout(false);
  }, [storageKey, defaultNodes, setNodes]);

  // Register callbacks for external control (menu shelf)
  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(handleSave);
    }
  }, [onRegisterSave, handleSave]);

  useEffect(() => {
    if (onRegisterReset) {
      onRegisterReset(handleReset);
    }
  }, [onRegisterReset, handleReset]);

  // Report layout state changes to parent
  useEffect(() => {
    if (onLayoutStateChange) {
      onLayoutStateChange(hasChanges, hasSavedLayout);
    }
  }, [onLayoutStateChange, hasChanges, hasSavedLayout]);

  // Handle node edit request
  const handleNodeEdit = useCallback((nodeId: string, label: string) => {
    setEditingNode({ id: nodeId, label });
  }, []);

  // Handle node label save
  const handleNodeLabelSave = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
    setHasChanges(true);
  }, [setNodes]);

  // Handle new edge connection - show modal to get label
  const handleConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection);
  }, []);

  // Create the actual edge after user provides label
  const handleCreateEdge = useCallback((connection: Connection, label: string) => {
    const newEdge: Edge = {
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      label: label || undefined,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' },
      style: { strokeWidth: 3, stroke: '#ffffff' },
      labelStyle: { fontSize: 12, fontWeight: 700, fill: '#1e3a5f' },
      labelBgStyle: { fill: 'white', fillOpacity: 1 },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 6,
    };
    setEdges((eds) => addEdge(newEdge, eds));
    setHasChanges(true);
  }, [setEdges]);

  // Handle edge deletion
  const handleEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    if (deletedEdges.length > 0) {
      setHasChanges(true);
    }
  }, []);

  // Handle edge click - open edit modal
  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    const label = typeof edge.label === 'string' ? edge.label : '';
    setEditingEdge({ id: edge.id, label });
  }, []);

  // Handle edge label save
  const handleEdgeLabelSave = useCallback((edgeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            label: newLabel || undefined,
          };
        }
        return edge;
      })
    );
    setHasChanges(true);
  }, [setEdges]);

  // Handle edge delete from modal
  const handleEdgeDelete = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    setHasChanges(true);
  }, [setEdges]);

  // Add onEdit callback to all nodes
  const nodesWithEditCallback = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onEdit: handleNodeEdit,
      },
    }));
  }, [nodes, handleNodeEdit]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '100vh' }}>
      {/* Flow Group Tabs - only shown when not externally controlled */}
      {!isExternallyControlled && (
        <FlowGroupTabs
          flows={flows}
          activeFlowId={activeFlowId}
          onSelectFlow={setActiveFlowId}
        />
      )}

      {/* Legend */}
      <Legend lanes={flowGraph.lanes} />

      {/* Layout Toolbar - conditionally shown */}
      {showLayoutToolbar && (
        <LayoutToolbar
          onSave={handleSave}
          onReset={handleReset}
          hasChanges={hasChanges}
          hasSavedLayout={hasSavedLayout}
        />
      )}

      {/* Node Edit Modal */}
      {editingNode && (
        <NodeEditModal
          nodeId={editingNode.id}
          initialLabel={editingNode.label}
          onSave={handleNodeLabelSave}
          onClose={() => setEditingNode(null)}
        />
      )}

      {/* Edge Label Modal */}
      {pendingConnection && (
        <EdgeLabelModal
          connection={pendingConnection}
          onSave={handleCreateEdge}
          onClose={() => setPendingConnection(null)}
        />
      )}

      {/* Edge Edit Modal */}
      {editingEdge && (
        <EdgeEditModal
          edgeId={editingEdge.id}
          initialLabel={editingEdge.label}
          onSave={handleEdgeLabelSave}
          onDelete={handleEdgeDelete}
          onClose={() => setEditingEdge(null)}
        />
      )}

      {/* React Flow Canvas */}
      <div style={{ height: '100vh' }}>
        <ReactFlow
          nodes={nodesWithEditCallback}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onEdgesDelete={handleEdgesDelete}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          edgesReconnectable
          deleteKeyCode={['Backspace', 'Delete']}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
          connectionLineStyle={{ stroke: '#ffffff', strokeWidth: 3 }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="rgba(255,255,255,0.3)"
            style={{ backgroundColor: CANVAS_BG }}
          />
          <Controls
            position="bottom-right"
            style={{
              marginRight: '16px',
              marginBottom: '80px',
            }}
          />
          <MiniMap
            position="bottom-left"
            nodeColor={(node) => {
              const lane = (node.data as { lane?: string })?.lane || 'User';
              return LANE_COLORS[lane]?.accent || '#3b82f6';
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid rgba(74, 133, 200, 0.6)',
              borderRadius: '12px',
              marginLeft: '16px',
              marginBottom: '80px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            maskColor="rgba(200, 220, 240, 0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
