'use client';

/**
 * Custom Node Components for React Flow
 *
 * Defines visual representations for different node types:
 * - StepNode: Regular flow step (rectangle)
 * - DecisionNode: Branching point (diamond)
 * - SystemNode: System action (rectangle with icon)
 * - StartNode: Entry point (circle)
 * - EndNode: Terminal state (circle)
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { LANE_COLORS, NodeType } from '@/lib/flowgraph-types';

// ============================================================================
// Common Types
// ============================================================================

interface CustomNodeData {
  label: string;
  lane: string;
  nodeType: NodeType;
  description?: string;
}

// ============================================================================
// Step Node (Rectangle)
// ============================================================================

export const StepNode = memo(function StepNode({ data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const colors = LANE_COLORS[nodeData.lane] || LANE_COLORS.User;

  return (
    <div
      className="px-6 py-5 rounded-2xl border-[3px]"
      style={{
        width: 300,
        minHeight: 90,
        background: `linear-gradient(135deg, ${colors.bg}ee, ${colors.bg}cc)`,
        borderColor: '#ffffff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <div className="flex items-start gap-2">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: colors.accent, color: 'white' }}
        >
          {nodeData.lane}
        </span>
      </div>
      <p
        className="mt-3 text-sm font-medium leading-relaxed break-words"
        style={{ color: colors.text, wordWrap: 'break-word', maxWidth: 260 }}
      >
        {nodeData.label}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
    </div>
  );
});

// ============================================================================
// Decision Node (Diamond)
// ============================================================================

export const DecisionNode = memo(function DecisionNode({ data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const colors = LANE_COLORS[nodeData.lane] || LANE_COLORS.User;

  return (
    <div className="relative" style={{ width: 260, height: 180 }}>
      {/* Diamond shape container */}
      <div
        className="w-full h-full flex items-center justify-center"
      >
        <div
          className="border-[3px] flex items-center justify-center"
          style={{
            width: 220,
            height: 160,
            background: `linear-gradient(135deg, ${colors.bg}ee, ${colors.bg}cc)`,
            borderColor: '#ffffff',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <p
            className="text-sm font-semibold text-center px-6 py-2 leading-snug break-words"
            style={{ color: colors.text, maxWidth: 160, wordWrap: 'break-word' }}
          >
            {nodeData.label}
          </p>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ top: 6, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ bottom: 6, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ right: 16, top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
});

// ============================================================================
// System Node (Rectangle with gear icon)
// ============================================================================

export const SystemNode = memo(function SystemNode({ data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const colors = LANE_COLORS.System;

  return (
    <div
      className="px-6 py-5 rounded-2xl border-[3px] border-dashed"
      style={{
        width: 300,
        minHeight: 90,
        background: `linear-gradient(135deg, ${colors.bg}ee, ${colors.bg}cc)`,
        borderColor: '#ffffff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <span className="text-lg">⚙️</span>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: colors.accent, color: 'white' }}
        >
          System
        </span>
      </div>
      <p
        className="mt-3 text-sm font-medium leading-relaxed break-words"
        style={{ color: colors.text, wordWrap: 'break-word', maxWidth: 260 }}
      >
        {nodeData.label}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
    </div>
  );
});

// ============================================================================
// Start Node (Circle)
// ============================================================================

export const StartNode = memo(function StartNode({ data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const colors = LANE_COLORS[nodeData.lane] || LANE_COLORS.User;

  return (
    <div
      className="px-8 py-5 rounded-full flex items-center justify-center border-[3px]"
      style={{
        width: 220,
        minHeight: 70,
        background: `linear-gradient(135deg, ${colors.bg}ee, ${colors.bg}cc)`,
        borderColor: '#ffffff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: colors.accent }} className="text-lg flex-shrink-0">▶</span>
        <p
          className="text-sm font-bold text-center leading-snug break-words"
          style={{ color: colors.text, wordWrap: 'break-word', maxWidth: 150 }}
        >
          {nodeData.label}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
    </div>
  );
});

// ============================================================================
// End Node (Circle)
// ============================================================================

export const EndNode = memo(function EndNode({ data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;

  // Determine color based on end type - higher contrast
  let bgColor = '#f5d8d8'; // light red
  let accentColor = '#c94040'; // vivid red
  let textColor = '#7a2020'; // dark red text
  let icon = '⬤';

  if (nodeData.label.toLowerCase().includes('success') || nodeData.label.toLowerCase().includes('complete')) {
    bgColor = '#d0ebd8'; // light green
    accentColor = '#2d9a4e'; // vivid green
    textColor = '#1a4d2e'; // dark green text
    icon = '✓';
  } else if (nodeData.label.toLowerCase().includes('exit') || nodeData.label.toLowerCase().includes('left')) {
    bgColor = '#f7ead4'; // light amber
    accentColor = '#d4a12d'; // vivid amber
    textColor = '#5c4a1f'; // dark amber text
    icon = '↩';
  }

  return (
    <div
      className="px-8 py-5 rounded-full flex items-center justify-center border-[3px]"
      style={{
        width: 220,
        minHeight: 70,
        background: `linear-gradient(135deg, ${bgColor}ee, ${bgColor}cc)`,
        borderColor: '#ffffff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <span className="text-lg flex-shrink-0" style={{ color: accentColor }}>{icon}</span>
        <p
          className="text-sm font-bold text-center leading-snug break-words"
          style={{ color: textColor, wordWrap: 'break-word', maxWidth: 150 }}
        >
          {nodeData.label}
        </p>
      </div>
    </div>
  );
});

// ============================================================================
// Node Type Registry
// ============================================================================

export const nodeTypes = {
  step: StepNode,
  decision: DecisionNode,
  system: SystemNode,
  start: StartNode,
  end: EndNode,
  exit: EndNode, // Exit nodes use same styling as end (with exit detection)
};
