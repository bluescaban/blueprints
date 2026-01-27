/**
 * FlowGraph Types
 *
 * TypeScript types for the SpecKit FlowGraph structure.
 */

export type NodeType = 'step' | 'decision' | 'system' | 'start' | 'end';

export interface FlowNode {
  id: string;
  type: NodeType;
  lane: string;
  label: string;
  description?: string;
  requirements?: string[];
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface FlowGraphMeta {
  project: string;
  feature: string;
  generatedAt: string;
  sourceFileKey: string;
  specKitVersion: string;
}

export interface FlowGraph {
  meta: FlowGraphMeta;
  lanes: string[];
  starts: string[];
  ends: string[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  assumptions: string[];
  openQuestions: string[];
  risks: string[];
}

// Lane color mapping - higher contrast with white borders
export const LANE_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  User: { bg: '#d4e4f7', border: '#ffffff', text: '#1e3a5f', accent: '#3b7dd8' },
  Host: { bg: '#d0ebd8', border: '#ffffff', text: '#1a4d2e', accent: '#2d9a4e' },
  Guest: { bg: '#f7ead4', border: '#ffffff', text: '#5c4a1f', accent: '#d4a12d' },
  System: { bg: '#e8d8f5', border: '#ffffff', text: '#4a2070', accent: '#8b4fc7' },
};

// Background color for the flow canvas
export const CANVAS_BG = '#4A85C8'; // rich blue

// Node type to shape/style mapping
export const NODE_STYLES: Record<NodeType, { shape: string; icon: string }> = {
  start: { shape: 'circle', icon: '▶' },
  end: { shape: 'circle', icon: '⬤' },
  step: { shape: 'rectangle', icon: '' },
  decision: { shape: 'diamond', icon: '◇' },
  system: { shape: 'rectangle', icon: '⚙' },
};
