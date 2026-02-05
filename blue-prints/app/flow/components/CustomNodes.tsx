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

import { memo, useState } from 'react';
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
  onEdit?: (nodeId: string, label: string) => void;
}

// ============================================================================
// Edit Button Component
// ============================================================================

interface EditButtonProps {
  nodeId: string;
  label: string;
  onEdit?: (nodeId: string, label: string) => void;
  className?: string;
}

function EditButton({ nodeId, label, onEdit, className = '' }: EditButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!onEdit) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onEdit(nodeId, label);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`absolute p-1.5 rounded-lg transition-all ${className}`}
      style={{
        background: isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
        boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
      title="Edit node"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke={isHovered ? '#3b82f6' : '#6b7280'}
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    </button>
  );
}

// ============================================================================
// Step Node (Rectangle)
// ============================================================================

export const StepNode = memo(function StepNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const colors = LANE_COLORS[nodeData.lane] || LANE_COLORS.User;

  return (
    <div
      className="px-6 py-5 rounded-2xl border-[3px] relative group"
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
      <Handle type="target" position={Position.Top} id="top" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <EditButton
        nodeId={id}
        label={nodeData.label}
        onEdit={nodeData.onEdit}
        className="top-2 right-2 opacity-0 group-hover:opacity-100"
      />
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
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
    </div>
  );
});

// ============================================================================
// Decision Node (Diamond)
// ============================================================================

export const DecisionNode = memo(function DecisionNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const colors = LANE_COLORS[nodeData.lane] || LANE_COLORS.User;

  return (
    <div className="relative group" style={{ width: 260, height: 180 }}>
      <EditButton
        nodeId={id}
        label={nodeData.label}
        onEdit={nodeData.onEdit}
        className="top-0 right-0 opacity-0 group-hover:opacity-100 z-10"
      />
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
        id="top"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ top: 6, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}
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

export const SystemNode = memo(function SystemNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const colors = LANE_COLORS.System;

  return (
    <div
      className="px-6 py-5 rounded-2xl border-[3px] border-dashed relative group"
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
      <Handle type="target" position={Position.Top} id="top" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <EditButton
        nodeId={id}
        label={nodeData.label}
        onEdit={nodeData.onEdit}
        className="top-2 right-2 opacity-0 group-hover:opacity-100"
      />
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
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
    </div>
  );
});

// ============================================================================
// Start Node (Circle)
// ============================================================================

export const StartNode = memo(function StartNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const colors = LANE_COLORS[nodeData.lane] || LANE_COLORS.User;

  return (
    <div
      className="px-8 py-5 rounded-full flex items-center justify-center border-[3px] relative group"
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
      <EditButton
        nodeId={id}
        label={nodeData.label}
        onEdit={nodeData.onEdit}
        className="-top-1 -right-1 opacity-0 group-hover:opacity-100"
      />
      <div className="flex items-center gap-3">
        <span style={{ color: colors.accent }} className="text-lg flex-shrink-0">▶</span>
        <p
          className="text-sm font-bold text-center leading-snug break-words"
          style={{ color: colors.text, wordWrap: 'break-word', maxWidth: 150 }}
        >
          {nodeData.label}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
    </div>
  );
});

// ============================================================================
// End Node (Circle)
// ============================================================================

export const EndNode = memo(function EndNode({ id, data }: NodeProps) {
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
      className="px-8 py-5 rounded-full flex items-center justify-center border-[3px] relative group"
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
      <Handle type="target" position={Position.Top} id="top" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <EditButton
        nodeId={id}
        label={nodeData.label}
        onEdit={nodeData.onEdit}
        className="-top-1 -right-1 opacity-0 group-hover:opacity-100"
      />
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
