/**
 * parseCards.mjs
 *
 * BluePrints Card Grammar Parser
 *
 * Parses sticky notes and text from FigJam extracts into structured FlowSpec format.
 * Supports labeled cards with prefixes like G:, S:, E:, etc.
 *
 * @module parseCards
 */

// ============================================================================
// Type Definitions (JSDoc)
// ============================================================================

/**
 * @typedef {'CTX'|'G'|'P'|'PR'|'R'|'NFR'|'S'|'D'|'E'|'UI'|'DATA'|'RULE'|'RISK'|'Q'|'OUT'|'NOTE'} CardLabel
 */

/**
 * @typedef {Object} ParsedCardLine
 * @property {string} raw - Original line text
 * @property {CardLabel} label - Parsed label (or 'NOTE' if none)
 * @property {string} value - Text content after the label
 * @property {string} [nodeId] - FigJam node ID (if from extraction)
 * @property {string} [nodeName] - FigJam node name (if from extraction)
 * @property {number} [lineIndex] - Line index within multi-line sticky
 */

/**
 * @typedef {Object} Persona
 * @property {string} name - Persona name
 * @property {string} [details] - Additional persona details
 */

/**
 * @typedef {Object} Step
 * @property {string} [id] - Step identifier like "S1", "S2"
 * @property {string} text - Step description
 * @property {string} [persona] - Associated persona name
 * @property {string} [lane] - Swimlane name
 */

/**
 * @typedef {Object} Decision
 * @property {string} question - Decision question
 * @property {string} [yes] - Step/outcome if yes
 * @property {string} [no] - Step/outcome if no
 */

/**
 * @typedef {Object} Edge
 * @property {string} from - Source node/step
 * @property {string} to - Target node/step
 * @property {string} [label] - Edge label
 * @property {string} [condition] - Edge condition
 */

/**
 * @typedef {Object} FlowSpecMeta
 * @property {string} fileKey - FigJam file key
 * @property {string} generatedAt - ISO timestamp
 * @property {string} grammarVersion - Grammar version string
 */

/**
 * @typedef {Object} FlowSpec
 * @property {FlowSpecMeta} meta - Metadata about the extraction
 * @property {string[]} context - Context notes (CTX:)
 * @property {string[]} goals - Goals (G:)
 * @property {Persona[]} personas - Personas (P:)
 * @property {{functional: string[], nonFunctional: string[]}} requirements - Requirements
 * @property {Step[]} steps - Steps in the flow (S:)
 * @property {Decision[]} decisions - Decisions (D:)
 * @property {Edge[]} edges - Edges/connections (E:)
 * @property {string[]} notes - Unparsed or NOTE: items
 * @property {string[]} problems - Problems (PR:)
 * @property {string[]} uiElements - UI elements (UI:)
 * @property {string[]} dataObjects - Data objects (DATA:)
 * @property {string[]} rules - Business rules (RULE:)
 * @property {string[]} risks - Risks (RISK:)
 * @property {string[]} questions - Open questions (Q:)
 * @property {string[]} outputs - Expected outputs (OUT:)
 */

/**
 * @typedef {Object} ExtractedNode
 * @property {string} id - Node ID
 * @property {string} name - Node name
 * @property {string} text - Node text content
 */

/**
 * @typedef {Object} ExtractionInput
 * @property {string} fileKey - FigJam file key
 * @property {ExtractedNode[]} extracted - Array of extracted nodes
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Grammar version for tracking changes
 * @type {string}
 */
export const GRAMMAR_VERSION = '1.0.0';

/**
 * Supported label prefixes (case-insensitive)
 * Maps lowercase prefix to canonical uppercase label
 * @type {Object.<string, CardLabel>}
 */
const LABEL_MAP = {
  'ctx': 'CTX',
  'g': 'G',
  'p': 'P',
  'pr': 'PR',
  'r': 'R',
  'nfr': 'NFR',
  's': 'S',
  'd': 'D',
  'e': 'E',
  'ui': 'UI',
  'data': 'DATA',
  'rule': 'RULE',
  'risk': 'RISK',
  'q': 'Q',
  'out': 'OUT'
};

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse a single line of card text to extract label and value.
 *
 * @param {string} line - Raw line of text
 * @param {Object} [metadata] - Optional metadata from extraction
 * @param {string} [metadata.nodeId] - FigJam node ID
 * @param {string} [metadata.nodeName] - FigJam node name
 * @param {number} [metadata.lineIndex] - Line index within the node
 * @returns {ParsedCardLine} Parsed card line
 *
 * @example
 * parseCardLine("G: Increase user engagement")
 * // => { raw: "G: Increase user engagement", label: "G", value: "Increase user engagement" }
 *
 * @example
 * parseCardLine("Just a note without label")
 * // => { raw: "Just a note without label", label: "NOTE", value: "Just a note without label" }
 */
export function parseCardLine(line, metadata = {}) {
  const raw = line;
  const trimmed = line.trim();

  // Default result for empty or whitespace-only lines
  if (!trimmed) {
    return {
      raw,
      label: /** @type {CardLabel} */ ('NOTE'),
      value: '',
      ...(metadata.nodeId && { nodeId: metadata.nodeId }),
      ...(metadata.nodeName && { nodeName: metadata.nodeName }),
      ...(metadata.lineIndex !== undefined && { lineIndex: metadata.lineIndex })
    };
  }

  // Try to match a label prefix pattern: "LABEL:" or "LABEL: value"
  // Label must be at the start, followed by colon, optionally followed by whitespace and value
  const labelMatch = trimmed.match(/^([a-zA-Z]+):\s*(.*)/);

  if (labelMatch) {
    const [, prefix, value] = labelMatch;
    const normalizedPrefix = prefix.toLowerCase();

    // Check if it's a recognized label
    if (LABEL_MAP[normalizedPrefix]) {
      return {
        raw,
        label: LABEL_MAP[normalizedPrefix],
        value: value.trim(),
        ...(metadata.nodeId && { nodeId: metadata.nodeId }),
        ...(metadata.nodeName && { nodeName: metadata.nodeName }),
        ...(metadata.lineIndex !== undefined && { lineIndex: metadata.lineIndex })
      };
    }
  }

  // No recognized label - classify as NOTE
  return {
    raw,
    label: /** @type {CardLabel} */ ('NOTE'),
    value: trimmed,
    ...(metadata.nodeId && { nodeId: metadata.nodeId }),
    ...(metadata.nodeName && { nodeName: metadata.nodeName }),
    ...(metadata.lineIndex !== undefined && { lineIndex: metadata.lineIndex })
  };
}

/**
 * Extract persona name and details from a P: line.
 * Splits on first " - " or " — " to separate name from details.
 *
 * @param {string} value - The value portion after "P:"
 * @returns {Persona} Parsed persona
 *
 * @example
 * parsePersona("Host - wants to organize fun karaoke nights")
 * // => { name: "Host", details: "wants to organize fun karaoke nights" }
 */
function parsePersona(value) {
  // Try to split on " - " or " — " (em-dash)
  const separators = [' - ', ' — ', ' – '];

  for (const sep of separators) {
    const idx = value.indexOf(sep);
    if (idx !== -1) {
      return {
        name: value.substring(0, idx).trim(),
        details: value.substring(idx + sep.length).trim()
      };
    }
  }

  // No separator found - entire value is the name
  return { name: value.trim() };
}

/**
 * Extract step ID and text from an S: line.
 * Looks for pattern like "(S1)" or "(1)" at the start.
 *
 * @param {string} value - The value portion after "S:"
 * @returns {Step} Parsed step
 *
 * @example
 * parseStep("(S1) User taps 'Karaoke' button")
 * // => { id: "S1", text: "User taps 'Karaoke' button" }
 */
function parseStep(value) {
  // Match patterns like "(S1)", "(1)", "(Step1)", etc.
  const idMatch = value.match(/^\(([^)]+)\)\s*(.*)/);

  if (idMatch) {
    return {
      id: idMatch[1].trim(),
      text: idMatch[2].trim() || value.trim()
    };
  }

  return { text: value.trim() };
}

/**
 * Parse a Decision line.
 * Format: "Question? | yes:action | no:action" or just "Question?"
 *
 * @param {string} value - The value portion after "D:"
 * @returns {Decision} Parsed decision
 *
 * @example
 * parseDecision("Has premium account? | yes:Show premium features | no:Show upgrade prompt")
 * // => { question: "Has premium account?", yes: "Show premium features", no: "Show upgrade prompt" }
 */
function parseDecision(value) {
  // Split by pipe to find yes/no branches
  const parts = value.split('|').map(p => p.trim());

  if (parts.length === 1) {
    // Simple decision question, no branches specified
    return { question: parts[0] };
  }

  // First part is the question, remaining parts are branches
  const question = parts[0];
  const result = { question };

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    // Look for "yes:" or "no:" prefixes
    const yesMatch = part.match(/^yes:\s*(.*)/i);
    const noMatch = part.match(/^no:\s*(.*)/i);

    if (yesMatch) {
      result.yes = yesMatch[1].trim();
    } else if (noMatch) {
      result.no = noMatch[1].trim();
    }
  }

  return result;
}

/**
 * Parse an Edge line.
 * Format: "from -> to" or "from -> to [label=..., condition=...]"
 *
 * @param {string} value - The value portion after "E:"
 * @returns {Edge|null} Parsed edge, or null if parsing fails
 *
 * @example
 * parseEdge("S1 -> S2")
 * // => { from: "S1", to: "S2" }
 *
 * @example
 * parseEdge("Login -> Dashboard [label=Success, condition=isAuthenticated]")
 * // => { from: "Login", to: "Dashboard", label: "Success", condition: "isAuthenticated" }
 */
function parseEdge(value) {
  // Match "from -> to" with optional bracket attributes
  const edgeMatch = value.match(/^(.+?)\s*->\s*(.+?)(?:\s*\[(.+)\])?$/);

  if (!edgeMatch) {
    return null;
  }

  const [, from, to, attrs] = edgeMatch;
  const edge = {
    from: from.trim(),
    to: to.trim()
  };

  // Parse bracket attributes if present
  if (attrs) {
    // Match patterns like "label=Value" or "condition=something"
    const labelMatch = attrs.match(/label\s*=\s*([^,\]]+)/i);
    const conditionMatch = attrs.match(/condition\s*=\s*([^,\]]+)/i);

    if (labelMatch) {
      edge.label = labelMatch[1].trim();
    }
    if (conditionMatch) {
      edge.condition = conditionMatch[1].trim();
    }
  }

  return edge;
}

/**
 * Extract lane information from node name.
 * Looks for patterns like "Lane: Host", "HOST / ...", "HOST:", etc.
 *
 * @param {string} nodeName - FigJam node name
 * @returns {string|null} Lane name or null if not found
 */
function extractLaneFromNodeName(nodeName) {
  if (!nodeName) return null;

  // Pattern: "Lane: Name" or "LANE: Name"
  const laneMatch = nodeName.match(/^lane:\s*(.+)/i);
  if (laneMatch) {
    return laneMatch[1].trim();
  }

  // Pattern: "NAME / ..." (common swimlane naming)
  const slashMatch = nodeName.match(/^([A-Z][A-Z0-9_]*)\s*\//);
  if (slashMatch) {
    return slashMatch[1];
  }

  // Pattern: "NAME:" at the start
  const colonMatch = nodeName.match(/^([A-Z][A-Z0-9_]*):/);
  if (colonMatch) {
    return colonMatch[1];
  }

  return null;
}

/**
 * Parse extracted nodes from FigJam into a FlowSpec structure.
 *
 * @param {ExtractionInput} input - Extraction input with fileKey and extracted nodes
 * @returns {FlowSpec} Structured FlowSpec
 */
export function parseExtractedNodes(input) {
  const { fileKey, extracted } = input;

  // Initialize FlowSpec structure
  /** @type {FlowSpec} */
  const flowSpec = {
    meta: {
      fileKey,
      generatedAt: new Date().toISOString(),
      grammarVersion: GRAMMAR_VERSION
    },
    context: [],
    goals: [],
    personas: [],
    requirements: {
      functional: [],
      nonFunctional: []
    },
    steps: [],
    decisions: [],
    edges: [],
    notes: [],
    problems: [],
    uiElements: [],
    dataObjects: [],
    rules: [],
    risks: [],
    questions: [],
    outputs: []
  };

  // Process each extracted node
  for (const node of extracted) {
    const { id: nodeId, name: nodeName, text } = node;

    // Check for lane info in node name
    const lane = extractLaneFromNodeName(nodeName);

    // Split text into lines and parse each independently
    const lines = text.split(/\r?\n/);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      // Skip empty lines
      if (!line.trim()) continue;

      // Parse the line
      const parsed = parseCardLine(line, { nodeId, nodeName, lineIndex });

      // Route to appropriate array based on label
      switch (parsed.label) {
        case 'CTX':
          flowSpec.context.push(parsed.value);
          break;

        case 'G':
          flowSpec.goals.push(parsed.value);
          break;

        case 'P':
          flowSpec.personas.push(parsePersona(parsed.value));
          break;

        case 'PR':
          flowSpec.problems.push(parsed.value);
          break;

        case 'R':
          flowSpec.requirements.functional.push(parsed.value);
          break;

        case 'NFR':
          flowSpec.requirements.nonFunctional.push(parsed.value);
          break;

        case 'S': {
          const step = parseStep(parsed.value);
          if (lane) step.lane = lane;
          flowSpec.steps.push(step);
          break;
        }

        case 'D':
          flowSpec.decisions.push(parseDecision(parsed.value));
          break;

        case 'E': {
          const edge = parseEdge(parsed.value);
          if (edge) {
            flowSpec.edges.push(edge);
          } else {
            // Could not parse edge - store as note with context
            flowSpec.notes.push(`[Unparsed E:] ${parsed.value}`);
          }
          break;
        }

        case 'UI':
          flowSpec.uiElements.push(parsed.value);
          break;

        case 'DATA':
          flowSpec.dataObjects.push(parsed.value);
          break;

        case 'RULE':
          flowSpec.rules.push(parsed.value);
          break;

        case 'RISK':
          flowSpec.risks.push(parsed.value);
          break;

        case 'Q':
          flowSpec.questions.push(parsed.value);
          break;

        case 'OUT':
          flowSpec.outputs.push(parsed.value);
          break;

        case 'NOTE':
        default:
          // Store any non-labeled content as notes
          if (parsed.value) {
            flowSpec.notes.push(parsed.value);
          }
          break;
      }
    }
  }

  return flowSpec;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a string looks like a card label.
 *
 * @param {string} prefix - Potential label prefix
 * @returns {boolean} True if it's a recognized label
 */
export function isValidLabel(prefix) {
  return prefix.toLowerCase() in LABEL_MAP;
}

/**
 * Get all supported labels.
 *
 * @returns {CardLabel[]} Array of all valid labels
 */
export function getSupportedLabels() {
  return /** @type {CardLabel[]} */ (Object.values(LABEL_MAP));
}
