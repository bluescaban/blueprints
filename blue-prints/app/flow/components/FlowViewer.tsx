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

import { useCallback, useMemo, useState } from 'react';
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

import { FlowGraph, FlowNode, FlowEdge, FlowGroupOutput, LANE_COLORS, CANVAS_BG } from '@/lib/flowgraph-types';
import { nodeTypes } from './CustomNodes';

// ============================================================================
// Layout Configuration
// ============================================================================

const LANE_WIDTH = 380;
const NODE_SPACING_Y = 200;
const START_OFFSET_Y = 80;

// Node widths for centering (must match CustomNodes)
const NODE_WIDTHS: Record<string, number> = {
  step: 300,
  system: 300,
  decision: 260,
  start: 220,
  end: 220,
  exit: 220,
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
 */
function getLaneX(lane: string, lanes: string[], nodeType: string): number {
  const index = lanes.indexOf(lane);
  if (index === -1) return 0;
  const nodeWidth = NODE_WIDTHS[nodeType] || 280;
  return index * LANE_WIDTH + (LANE_WIDTH - nodeWidth) / 2;
}

/**
 * Compute the depth (level) of each node using BFS from start nodes.
 * Handles cycles by limiting iterations and tracking visit counts.
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

  const startNodes = nodes.filter(n => n.type === 'start' || !hasIncoming.has(n.id));

  const queue: { id: string; level: number }[] = [];
  for (const node of startNodes) {
    queue.push({ id: node.id, level: 0 });
    levels.set(node.id, 0);
  }

  // Track visit counts to detect cycles and prevent infinite loops
  const visitCount = new Map<string, number>();
  const MAX_VISITS_PER_NODE = 2; // Allow revisiting once for back-edges
  const MAX_ITERATIONS = nodes.length * 3; // Safety limit
  let iterations = 0;

  while (queue.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const { id, level } = queue.shift()!;
    const neighbors = adjacency.get(id) || [];

    for (const neighbor of neighbors) {
      const visits = visitCount.get(neighbor) || 0;
      if (visits >= MAX_VISITS_PER_NODE) {
        // Already visited enough times, skip to avoid cycle
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

  for (const node of nodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  }

  return levels;
}

/**
 * Auto-layout nodes in swimlanes using graph-based level assignment.
 */
function layoutNodes(nodes: FlowNode[], edges: FlowEdge[], lanes: string[]): Node[] {
  const result: Node[] = [];
  const nodeLevels = computeNodeLevels(nodes, edges);

  const nodesByLevel = new Map<number, FlowNode[]>();
  for (const node of nodes) {
    const level = nodeLevels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  }

  const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

  const laneNextY: Record<string, number> = {};
  lanes.forEach(lane => {
    laneNextY[lane] = START_OFFSET_Y;
  });

  for (const level of sortedLevels) {
    const levelNodes = nodesByLevel.get(level)!;

    levelNodes.sort((a, b) => {
      const laneA = a.type === 'system' ? 'System' : a.lane;
      const laneB = b.type === 'system' ? 'System' : b.lane;
      return lanes.indexOf(laneA) - lanes.indexOf(laneB);
    });

    for (const node of levelNodes) {
      const lane = node.type === 'system' ? 'System' : node.lane;
      const x = getLaneX(lane, lanes, node.type);
      const y = laneNextY[lane];

      laneNextY[lane] = y + NODE_SPACING_Y;

      result.push({
        id: node.id,
        type: node.type,
        position: { x, y },
        data: {
          label: node.label,
          lane,
          nodeType: node.type,
          inferred: node.inferred,
        },
      });
    }
  }

  return result;
}

/**
 * Convert FlowGraph edges to React Flow edges.
 */
function convertEdges(edges: FlowEdge[], nodes: FlowNode[]): Edge[] {
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
    <div className="absolute top-16 left-4 z-20 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
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
// Main Component
// ============================================================================

export default function FlowViewer({ flowGraph }: FlowViewerProps) {
  // State for flow group selection
  const flows = flowGraph.flows || [];
  const [activeFlowId, setActiveFlowId] = useState<string>(flows[0]?.id || 'main');

  // Get active flow's nodes and edges, or fall back to combined
  const activeFlow = flows.find(f => f.id === activeFlowId);
  const displayNodes = activeFlow?.nodes || flowGraph.nodes;
  const displayEdges = activeFlow?.edges || flowGraph.edges;

  // Convert FlowGraph to React Flow format
  const initialNodes = useMemo(
    () => layoutNodes(displayNodes, displayEdges, flowGraph.lanes),
    [displayNodes, displayEdges, flowGraph.lanes]
  );
  const initialEdges = useMemo(
    () => convertEdges(displayEdges, displayNodes),
    [displayEdges, displayNodes]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when active flow changes
  useMemo(() => {
    setNodes(layoutNodes(displayNodes, displayEdges, flowGraph.lanes));
    setEdges(convertEdges(displayEdges, displayNodes));
  }, [activeFlowId, displayNodes, displayEdges, flowGraph.lanes, setNodes, setEdges]);

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

      {/* Flow Group Tabs */}
      <FlowGroupTabs
        flows={flows}
        activeFlowId={activeFlowId}
        onSelectFlow={setActiveFlowId}
      />

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
