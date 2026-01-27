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
