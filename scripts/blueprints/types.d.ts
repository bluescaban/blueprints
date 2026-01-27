/**
 * types.d.ts
 *
 * TypeScript type definitions for BluePrints Card Grammar
 *
 * These types are used by the parsing and rendering modules.
 */

// ============================================================================
// Card Labels
// ============================================================================

/**
 * All supported card label types
 */
export type CardLabel =
  | 'CTX'   // Context
  | 'G'     // Goal
  | 'P'     // Persona
  | 'PR'    // Problem
  | 'R'     // Requirement (functional)
  | 'NFR'   // Non-functional requirement
  | 'S'     // Step
  | 'D'     // Decision
  | 'E'     // Edge
  | 'F'     // Flow group / scenario
  | 'A'     // Actor / lane declaration
  | 'UI'    // UI element
  | 'DATA'  // Data object
  | 'RULE'  // Business rule
  | 'RISK'  // Risk
  | 'Q'     // Question
  | 'OUT'   // Output artifact
  | 'NOTE'; // Unlabeled content

// ============================================================================
// Parsed Structures
// ============================================================================

/**
 * Result of parsing a single line of card text
 */
export interface ParsedCardLine {
  /** Original line text */
  raw: string;
  /** Parsed label (or 'NOTE' if none recognized) */
  label: CardLabel;
  /** Text content after the label */
  value: string;
  /** FigJam node ID (if from extraction) */
  nodeId?: string;
  /** FigJam node name (if from extraction) */
  nodeName?: string;
  /** Line index within multi-line sticky */
  lineIndex?: number;
}

/**
 * A persona definition
 */
export interface Persona {
  /** Persona name */
  name: string;
  /** Additional details about the persona */
  details?: string;
}

/**
 * A step in the user flow
 */
export interface Step {
  /** Step identifier (e.g., "S1", "S2") */
  id?: string;
  /** Step description */
  text: string;
  /** Associated persona name */
  persona?: string;
  /** Swimlane name */
  lane?: string;
}

/**
 * A decision point (branching logic)
 */
export interface Decision {
  /** Decision question */
  question: string;
  /** Step/outcome if yes */
  yes?: string;
  /** Step/outcome if no */
  no?: string;
}

/**
 * An edge connecting two nodes
 */
export interface Edge {
  /** Source node/step */
  from: string;
  /** Target node/step */
  to: string;
  /** Edge label */
  label?: string;
  /** Edge condition */
  condition?: string;
}

// ============================================================================
// FlowSpec Structure
// ============================================================================

/**
 * Metadata about the FlowSpec generation
 */
export interface FlowSpecMeta {
  /** FigJam file key */
  fileKey: string;
  /** ISO timestamp of generation */
  generatedAt: string;
  /** Grammar version used */
  grammarVersion: string;
}

/**
 * Requirements grouped by type
 */
export interface Requirements {
  /** Functional requirements (R:) */
  functional: string[];
  /** Non-functional requirements (NFR:) */
  nonFunctional: string[];
}

/**
 * Complete FlowSpec structure
 *
 * This is the main output format of the card grammar parser.
 */
export interface FlowSpec {
  /** Metadata about the extraction */
  meta: FlowSpecMeta;
  /** Context notes (CTX:) */
  context: string[];
  /** Goals (G:) */
  goals: string[];
  /** Personas (P:) */
  personas: Persona[];
  /** Requirements */
  requirements: Requirements;
  /** Steps in the flow (S:) */
  steps: Step[];
  /** Decisions (D:) */
  decisions: Decision[];
  /** Edges/connections (E:) */
  edges: Edge[];
  /** Unparsed or NOTE: items */
  notes: string[];
  /** Problems (PR:) */
  problems: string[];
  /** UI elements (UI:) */
  uiElements: string[];
  /** Data objects (DATA:) */
  dataObjects: string[];
  /** Business rules (RULE:) */
  rules: string[];
  /** Risks (RISK:) */
  risks: string[];
  /** Open questions (Q:) */
  questions: string[];
  /** Expected outputs (OUT:) */
  outputs: string[];
}

// ============================================================================
// Input Structures
// ============================================================================

/**
 * A single extracted node from FigJam
 */
export interface ExtractedNode {
  /** Node ID */
  id: string;
  /** Node name */
  name: string;
  /** Node text content */
  text: string;
}

/**
 * Input for parseExtractedNodes function
 */
export interface ExtractionInput {
  /** FigJam file key */
  fileKey: string;
  /** Array of extracted nodes */
  extracted: ExtractedNode[];
}

// ============================================================================
// FlowGraph Types (v2.0)
// ============================================================================

/**
 * Node types in FlowGraph
 */
export type NodeType = 'step' | 'decision' | 'system' | 'start' | 'end';

/**
 * A node in the FlowGraph
 */
export interface FlowNode {
  /** Unique node identifier */
  id: string;
  /** Node type */
  type: NodeType;
  /** Swimlane (actor) */
  lane: string;
  /** Human-readable label */
  label: string;
  /** Extended description */
  description?: string;
  /** Related requirement IDs */
  requirements?: string[];
  /** Whether this node was inferred by SpecKit */
  inferred?: boolean;
  /** Flow group this node belongs to */
  flowGroup?: string;
  /** Original text from FlowSpec */
  sourceText?: string;
  /** Mark as intentionally disconnected */
  disconnected?: boolean;
}

/**
 * An edge in the FlowGraph
 */
export interface FlowEdge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Edge label (Yes/No/condition) */
  label?: string;
  /** Condition expression */
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

/**
 * Metadata about the FlowGraph generation
 */
export interface FlowGraphMeta {
  /** Project name */
  project: string;
  /** Feature name */
  feature: string;
  /** ISO timestamp of generation */
  generatedAt: string;
  /** Original FigJam file key */
  sourceFileKey: string;
  /** SpecKit version */
  specKitVersion: string;
}

/**
 * Complete FlowGraph structure
 */
export interface FlowGraph {
  /** Metadata */
  meta: FlowGraphMeta;
  /** Individual flow groups */
  flows: FlowGroupOutput[];
  /** Swimlane names in order */
  lanes: string[];
  /** All entry point node IDs (combined) */
  starts: string[];
  /** All end state node IDs (combined) */
  ends: string[];
  /** All nodes (combined) */
  nodes: FlowNode[];
  /** All edges (combined) */
  edges: FlowEdge[];
  /** Assumptions made during expansion */
  assumptions: string[];
  /** Unresolved questions */
  openQuestions: string[];
  /** Identified risks */
  risks: string[];
}

// ============================================================================
// Validation Types (v1.0)
// ============================================================================

/**
 * Validation issue severity
 */
export type ValidationSeverity = 'error' | 'warning';

/**
 * A single validation issue
 */
export interface ValidationIssue {
  /** Issue severity */
  severity: ValidationSeverity;
  /** Unique error code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Related node ID */
  nodeId?: string;
  /** Related edge ID (from->to) */
  edgeId?: string;
  /** Related flow group ID */
  flowId?: string;
  /** Actionable fix suggestion */
  suggestion?: string;
}

/**
 * Validation statistics
 */
export interface ValidationStats {
  /** Total number of nodes */
  totalNodes: number;
  /** Total number of edges */
  totalEdges: number;
  /** Total number of flow groups */
  totalFlows: number;
  /** Nodes grouped by type */
  nodesByType: Record<string, number>;
  /** Nodes grouped by lane */
  nodesByLane: Record<string, number>;
  /** Number of errors */
  errorCount: number;
  /** Number of warnings */
  warningCount: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Critical errors (fail generation) */
  errors: ValidationIssue[];
  /** Non-critical warnings */
  warnings: ValidationIssue[];
  /** Validation statistics */
  stats: ValidationStats;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Fail on any error (default: true) */
  strict?: boolean;
  /** Allow disconnected nodes (default: false) */
  allowDisconnected?: boolean;
  /** Allow empty System lane (default: false) */
  allowEmptySystem?: boolean;
}
