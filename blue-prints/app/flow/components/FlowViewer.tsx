'use client';

/**
 * FlowViewer Component
 *
 * Renders a FlowGraph as an interactive React Flow diagram.
 * Supports:
 * - Multiple swimlanes (horizontal grouping)
 * - Different node types with custom styling
 * - Edge labels
 * - Pan and zoom
 */

import { useCallback, useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowGraph, FlowNode, FlowEdge, LANE_COLORS, NodeType, CANVAS_BG } from '@/lib/flowgraph-types';
import { nodeTypes } from './CustomNodes';

// ============================================================================
// Layout Configuration
// ============================================================================

const LANE_WIDTH = 340;
const NODE_SPACING_Y = 200;
const START_OFFSET_Y = 80;

// Node widths for centering (must match CustomNodes)
const NODE_WIDTHS: Record<string, number> = {
  step: 280,
  system: 280,
  decision: 220,
  start: 200,
  end: 200,
};

// ============================================================================
// Types
// ============================================================================

interface FlowViewerProps {
  flowGraph: FlowGraph;
}

// ============================================================================
// Layout Functions
// ============================================================================

/**
 * Calculate X position based on lane - center node in lane column.
 * Centers different node types based on their actual widths.
 */
function getLaneX(lane: string, lanes: string[], nodeType: string): number {
  const index = lanes.indexOf(lane);
  if (index === -1) return 0;
  const nodeWidth = NODE_WIDTHS[nodeType] || 280;
  // Center the node within the lane
  return index * LANE_WIDTH + (LANE_WIDTH - nodeWidth) / 2;
}

/**
 * Compute the depth (level) of each node using BFS from start nodes.
 * This ensures proper vertical ordering based on graph structure.
 */
function computeNodeLevels(
  nodes: FlowNode[],
  edges: FlowEdge[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Build adjacency list
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from)!.push(edge.to);
  }

  // Find start nodes and nodes with no incoming edges
  const hasIncoming = new Set<string>();
  for (const edge of edges) {
    hasIncoming.add(edge.to);
  }

  const startNodes = nodes.filter(n => n.type === 'start' || !hasIncoming.has(n.id));

  // BFS to compute levels
  const queue: { id: string; level: number }[] = [];
  for (const node of startNodes) {
    queue.push({ id: node.id, level: 0 });
    levels.set(node.id, 0);
  }

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const neighbors = adjacency.get(id) || [];

    for (const neighbor of neighbors) {
      const currentLevel = levels.get(neighbor);
      const newLevel = level + 1;

      // Only update if we found a longer path (ensures proper ordering)
      if (currentLevel === undefined || newLevel > currentLevel) {
        levels.set(neighbor, newLevel);
        queue.push({ id: neighbor, level: newLevel });
      }
    }
  }

  // Handle any unvisited nodes (disconnected)
  for (const node of nodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  }

  return levels;
}

/**
 * Auto-layout nodes in swimlanes using graph-based level assignment.
 * Nodes are positioned vertically based on their depth in the flow graph,
 * and horizontally centered within their assigned lane.
 */
function layoutNodes(flowGraph: FlowGraph): Node[] {
  const { lanes, nodes, edges } = flowGraph;
  const result: Node[] = [];

  // Compute levels based on graph structure
  const nodeLevels = computeNodeLevels(nodes, edges);

  // Create a map for quick node lookup
  const nodeMap = new Map<string, FlowNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Build reverse adjacency (who points to me)
  const incomingEdges = new Map<string, string[]>();
  for (const edge of edges) {
    if (!incomingEdges.has(edge.to)) {
      incomingEdges.set(edge.to, []);
    }
    incomingEdges.get(edge.to)!.push(edge.from);
  }

  // Group nodes by level
  const nodesByLevel = new Map<number, FlowNode[]>();
  for (const node of nodes) {
    const level = nodeLevels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  }

  // Sort levels
  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

  // Track Y positions for each node (to be computed)
  const nodePositions = new Map<string, { x: number; y: number }>();

  // Track the next available Y position in each lane
  const laneNextY: Record<string, number> = {};
  lanes.forEach(lane => {
    laneNextY[lane] = START_OFFSET_Y;
  });

  // Position nodes level by level
  for (const level of sortedLevels) {
    const levelNodes = nodesByLevel.get(level)!;

    // Sort nodes within level by lane order for consistent layout
    levelNodes.sort((a, b) => {
      const laneA = a.type === 'system' ? 'System' : a.lane;
      const laneB = b.type === 'system' ? 'System' : b.lane;
      return lanes.indexOf(laneA) - lanes.indexOf(laneB);
    });

    // Position each node
    for (const node of levelNodes) {
      const lane = node.type === 'system' ? 'System' : node.lane;
      const x = getLaneX(lane, lanes, node.type);

      // Find the Y position: use next available slot in this lane
      const y = laneNextY[lane];

      // Update lane's next Y
      laneNextY[lane] = y + NODE_SPACING_Y;

      nodePositions.set(node.id, { x, y });

      result.push({
        id: node.id,
        type: node.type,
        position: { x, y },
        data: { label: node.label, lane, nodeType: node.type },
      });
    }
  }

  return result;
}

/**
 * Convert FlowGraph edges to React Flow edges.
 * Uses straight lines for same-lane connections, smoothstep for cross-lane.
 */
function convertEdges(edges: FlowEdge[], nodes: FlowNode[]): Edge[] {
  // Build a map of node lanes
  const nodeLanes = new Map<string, string>();
  for (const node of nodes) {
    nodeLanes.set(node.id, node.type === 'system' ? 'System' : node.lane);
  }

  return edges.map((edge, index) => {
    const sourceLane = nodeLanes.get(edge.from);
    const targetLane = nodeLanes.get(edge.to);
    const isSameLane = sourceLane === targetLane;

    return {
      id: `e-${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      // Use straight for same-lane (vertical), smoothstep for cross-lane
      type: isSameLane ? 'straight' : 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' },
      style: { strokeWidth: 3, stroke: '#ffffff' },
      labelStyle: { fontSize: 12, fontWeight: 700, fill: '#1e3a5f' },
      labelBgStyle: { fill: 'white', fillOpacity: 1 },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 6,
      animated: edge.label?.toLowerCase() === 'yes',
    };
  });
}

// ============================================================================
// Lane Background Component
// ============================================================================

interface LaneBackgroundProps {
  lanes: string[];
  height: number;
}

function LaneBackground({ lanes, height }: LaneBackgroundProps) {
  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height }}>
      {lanes.map((lane, index) => {
        const colors = LANE_COLORS[lane] || LANE_COLORS.User;
        return (
          <div
            key={lane}
            className="absolute top-0 bottom-0"
            style={{
              left: index * LANE_WIDTH,
              width: LANE_WIDTH,
              backgroundColor: colors.bg,
              opacity: 0.3,
              borderRight: index < lanes.length - 1 ? '2px dashed #cbd5e1' : 'none',
            }}
          >
            <div
              className="text-center py-2 font-bold text-sm"
              style={{ color: colors.text, backgroundColor: colors.bg }}
            >
              {lane}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FlowViewer({ flowGraph }: FlowViewerProps) {
  // Convert FlowGraph to React Flow format
  const initialNodes = useMemo(() => layoutNodes(flowGraph), [flowGraph]);
  const initialEdges = useMemo(() => convertEdges(flowGraph.edges, flowGraph.nodes), [flowGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Calculate diagram dimensions
  const diagramWidth = flowGraph.lanes.length * LANE_WIDTH;
  const diagramHeight = Math.max(800, nodes.length * NODE_SPACING_Y);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '100vh' }}>
      {/* Lane headers - fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-10 flex border-b border-white/50">
        {flowGraph.lanes.map((lane) => {
          const colors = LANE_COLORS[lane] || LANE_COLORS.User;
          return (
            <div
              key={lane}
              className="flex-1 py-3 text-center font-bold text-sm border-r border-white/50 last:border-r-0"
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
              }}
            >
              {lane}
            </div>
          );
        })}
      </div>

      {/* React Flow Canvas */}
      <div className="pt-12" style={{ height: 'calc(100vh - 48px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="rgba(255,255,255,0.3)"
            style={{ backgroundColor: CANVAS_BG }}
          />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-left"
            nodeColor={(node) => {
              const lane = (node.data as { lane?: string })?.lane || 'User';
              return LANE_COLORS[lane]?.accent || '#3b82f6';
            }}
            style={{
              backgroundColor: 'rgba(74, 133, 200, 0.9)',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '8px',
            }}
            maskColor="rgba(74, 133, 200, 0.4)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
