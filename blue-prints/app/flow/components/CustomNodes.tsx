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
  isHighlighted?: boolean;
}

// ============================================================================
// Persona Icon Component
// ============================================================================

interface PersonaIconProps {
  lane: string;
  size?: 'sm' | 'md';
}

function PersonaIcon({ lane, size = 'md' }: PersonaIconProps) {
  const colors = LANE_COLORS[lane] || LANE_COLORS.User;
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const svgSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  // Determine icon based on lane type
  const getIcon = () => {
    const lowerLane = lane.toLowerCase();

    // Host icon - star/crown
    if (lowerLane === 'host' || lowerLane.includes('host')) {
      return (
        <svg className={svgSize} viewBox="0 0 24 24" fill={colors.accent}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    // Guest icon - person with badge
    if (lowerLane === 'guest' || lowerLane.includes('guest') || lowerLane.includes('visitor')) {
      return (
        <svg className={svgSize} viewBox="0 0 24 24" fill={colors.accent}>
          <circle cx="12" cy="7" r="4" />
          <path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
          <circle cx="18" cy="8" r="3" fill="white" stroke={colors.accent} strokeWidth="1.5" />
          <text x="18" y="10" textAnchor="middle" fontSize="6" fill={colors.accent} fontWeight="bold">?</text>
        </svg>
      );
    }

    // System icon - gear
    if (lowerLane === 'system') {
      return (
        <svg className={svgSize} viewBox="0 0 24 24" fill={colors.accent}>
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      );
    }

    // Default: User icon - person
    return (
      <svg className={svgSize} viewBox="0 0 24 24" fill={colors.accent}>
        <circle cx="12" cy="7" r="4" />
        <path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
      </svg>
    );
  };

  return (
    <div
      className={`${iconSize} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    >
      {getIcon()}
    </div>
  );
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
        borderColor: nodeData.isHighlighted ? '#fbbf24' : '#ffffff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: nodeData.isHighlighted
          ? '0 0 0 4px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.6), 0 10px 30px rgba(0,0,0,0.3)'
          : '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
        animation: nodeData.isHighlighted ? 'pulse-highlight 1.5s ease-in-out infinite' : undefined,
      }}
    >
      {/* Bidirectional handles - each position has both source and target */}
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <EditButton
        nodeId={id}
        label={nodeData.label}
        onEdit={nodeData.onEdit}
        className="top-2 right-2 opacity-0 group-hover:opacity-100"
      />
      <div className="flex items-start gap-3">
        <PersonaIcon lane={nodeData.lane} />
        <p
          className="text-sm font-medium leading-relaxed break-words flex-1"
          style={{ color: colors.text, wordWrap: 'break-word' }}
        >
          {nodeData.label}
        </p>
      </div>
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
    <div
      className="relative group"
      style={{
        width: 260,
        height: 180,
        animation: nodeData.isHighlighted ? 'pulse-highlight 1.5s ease-in-out infinite' : undefined,
      }}
    >
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
            borderColor: nodeData.isHighlighted ? '#fbbf24' : '#ffffff',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: nodeData.isHighlighted
              ? '0 0 30px rgba(251, 191, 36, 0.6), 0 10px 30px rgba(0,0,0,0.3)'
              : '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <PersonaIcon lane={nodeData.lane} size="sm" />
            <p
              className="text-sm font-semibold text-center px-4 leading-snug break-words"
              style={{ color: colors.text, maxWidth: 140, wordWrap: 'break-word' }}
            >
              {nodeData.label}
            </p>
          </div>
        </div>
      </div>
      {/* Bidirectional handles - each position has both source and target */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ top: 6, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ top: 6, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ bottom: 6, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ bottom: 6, left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!bg-white !border-2 !border-gray-300 !w-3 !h-3"
        style={{ right: 16, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
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
        borderColor: nodeData.isHighlighted ? '#fbbf24' : '#ffffff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: nodeData.isHighlighted
          ? '0 0 0 4px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.6), 0 10px 30px rgba(0,0,0,0.3)'
          : '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
        animation: nodeData.isHighlighted ? 'pulse-highlight 1.5s ease-in-out infinite' : undefined,
      }}
    >
      {/* Bidirectional handles - each position has both source and target */}
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
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
        borderColor: nodeData.isHighlighted ? '#fbbf24' : '#ffffff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: nodeData.isHighlighted
          ? '0 0 0 4px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.6), 0 10px 30px rgba(0,0,0,0.3)'
          : '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
        animation: nodeData.isHighlighted ? 'pulse-highlight 1.5s ease-in-out infinite' : undefined,
      }}
    >
      {/* Bidirectional handles - each position has both source and target */}
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <EditButton
        nodeId={id}
        label={nodeData.label}
        onEdit={nodeData.onEdit}
        className="-top-1 -right-1 opacity-0 group-hover:opacity-100"
      />
      <div className="flex items-center gap-2">
        <PersonaIcon lane={nodeData.lane} size="sm" />
        <span style={{ color: colors.accent }} className="text-base flex-shrink-0">▶</span>
        <p
          className="text-sm font-bold text-center leading-snug break-words"
          style={{ color: colors.text, wordWrap: 'break-word', maxWidth: 120 }}
        >
          {nodeData.label}
        </p>
      </div>
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
        borderColor: nodeData.isHighlighted ? '#fbbf24' : '#ffffff',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: nodeData.isHighlighted
          ? '0 0 0 4px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.6), 0 10px 30px rgba(0,0,0,0.3)'
          : '0 10px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)',
        animation: nodeData.isHighlighted ? 'pulse-highlight 1.5s ease-in-out infinite' : undefined,
      }}
    >
      {/* Bidirectional handles - each position has both source and target */}
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-white !border-2 !border-gray-300 !w-3 !h-3" />
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
