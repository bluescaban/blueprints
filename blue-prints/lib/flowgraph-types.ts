/**
 * FlowGraph Types
 *
 * TypeScript types for the SpecKit FlowGraph structure (v2.0).
 */

export type NodeType = 'step' | 'decision' | 'system' | 'start' | 'end';

export interface FlowNode {
  id: string;
  type: NodeType;
  lane: string;
  label: string;
  description?: string;
  requirements?: string[];
  /** Whether this node was inferred by SpecKit */
  inferred?: boolean;
  /** Flow group this node belongs to */
  flowGroup?: string;
  /** Original text from FlowSpec */
  sourceText?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  condition?: string;
  /** Flow group this edge belongs to */
  flowGroup?: string;
}

/**
 * A flow group (scenario) output
 */
export interface FlowGroupOutput {
  /** Flow group identifier */
  id: string;
  /** Flow group display name */
  name: string;
  /** Entry point node IDs for this flow */
  starts: string[];
  /** End state node IDs for this flow */
  ends: string[];
  /** Nodes in this flow */
  nodes: FlowNode[];
  /** Edges in this flow */
  edges: FlowEdge[];
}

export interface FlowGraphMeta {
  project: string;
  feature: string;
  generatedAt: string;
  sourceFileKey: string;
  specKitVersion: string;
}

/**
 * A persona definition
 */
export interface Persona {
  name: string;
  details?: string;
}

export interface FlowGraph {
  meta: FlowGraphMeta;
  /** Individual flow groups (v2.0) */
  flows?: FlowGroupOutput[];
  lanes: string[];
  /** Personas involved in the flow */
  personas?: Persona[];
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
