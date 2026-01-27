/**
 * parseCards.mjs
 *
 * BluePrints Card Grammar Parser v2.0
 *
 * Parses sticky notes and text from FigJam extracts into structured FlowSpec format.
 * Supports labeled cards with prefixes like G:, S:, E:, F:, A:, etc.
 *
 * New in v2.0:
 * - F: Flow group / scenario name
 * - A: Actor / lane declaration
 * - E: Explicit edge definition (enhanced)
 * - Inline actor tags [actor=Host]
 *
 * @module parseCards
 */

// ============================================================================
// Type Definitions (JSDoc)
// ============================================================================

/**
 * @typedef {'CTX'|'G'|'P'|'PR'|'R'|'NFR'|'S'|'D'|'E'|'UI'|'DATA'|'RULE'|'RISK'|'Q'|'OUT'|'NOTE'|'F'|'A'} CardLabel
 */

/**
 * @typedef {Object} ParsedCardLine
 * @property {string} raw - Original line text
 * @property {CardLabel} label - Parsed label (or 'NOTE' if none)
 * @property {string} value - Text content after the label
 * @property {string} [nodeId] - FigJam node ID (if from extraction)
 * @property {string} [nodeName] - FigJam node name (if from extraction)
 * @property {number} [lineIndex] - Line index within multi-line sticky
 * @property {string} [actor] - Inline actor tag extracted from [actor=...]
 * @property {string} [flowGroup] - Current flow group context
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
 * @property {string} [lane] - Swimlane name (from A: or [actor=...])
 * @property {string} [flowGroup] - Flow group this step belongs to
 * @property {boolean} [inferred] - Whether this was inferred
 */

/**
 * @typedef {Object} Decision
 * @property {string} [id] - Decision identifier like "D1"
 * @property {string} question - Decision question
 * @property {string} [yes] - Step/outcome if yes
 * @property {string} [no] - Step/outcome if no
 * @property {string} [lane] - Swimlane
 * @property {string} [flowGroup] - Flow group
 */

/**
 * @typedef {Object} Edge
 * @property {string} from - Source node/step
 * @property {string} to - Target node/step
 * @property {string} [label] - Edge label
 * @property {string} [condition] - Edge condition
 * @property {string} [flowGroup] - Flow group this edge belongs to
 */

/**
 * @typedef {Object} FlowGroup
 * @property {string} id - Flow group identifier
 * @property {string} name - Flow group display name
 * @property {string[]} steps - Step IDs in this flow
 * @property {string[]} decisions - Decision IDs in this flow
 * @property {Edge[]} edges - Edges specific to this flow
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
 * @property {FlowGroup[]} flowGroups - Named flow groups (F:)
 * @property {string[]} actors - Declared actors (A:)
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
export const GRAMMAR_VERSION = '2.0.0';

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
  'out': 'OUT',
  // New in v2.0
  'f': 'F',      // Flow group / scenario
  'a': 'A'       // Actor / lane declaration
};

/**
 * Label descriptions for documentation
 */
export const LABEL_DESCRIPTIONS = {
  'CTX': 'Context - Background information',
  'G': 'Goal - What we want to achieve',
  'P': 'Persona - User type definition',
  'PR': 'Problem - Issue to solve',
  'R': 'Requirement - Functional requirement',
  'NFR': 'Non-Functional Requirement',
  'S': 'Step - Action in the flow',
  'D': 'Decision - Branching point',
  'E': 'Edge - Connection between nodes',
  'F': 'Flow - Named scenario/flow group',
  'A': 'Actor - Lane/swimlane declaration',
  'UI': 'UI Element - Interface component',
  'DATA': 'Data Object - Data entity',
  'RULE': 'Business Rule',
  'RISK': 'Risk - Potential issue',
  'Q': 'Question - Open question',
  'OUT': 'Output - Expected artifact',
  'NOTE': 'Note - General comment'
};

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Extract inline actor tag from text like "[actor=Host]"
 *
 * @param {string} text - Text to search
 * @returns {{actor: string|null, cleanText: string}} Actor and cleaned text
 */
function extractInlineActor(text) {
  const actorMatch = text.match(/\[actor=([^\]]+)\]/i);
  if (actorMatch) {
    return {
      actor: actorMatch[1].trim(),
      cleanText: text.replace(actorMatch[0], '').trim()
    };
  }
  return { actor: null, cleanText: text };
}

/**
 * Parse a single line of card text to extract label and value.
 *
 * @param {string} line - Raw line of text
 * @param {Object} [metadata] - Optional metadata from extraction
 * @param {string} [metadata.nodeId] - FigJam node ID
 * @param {string} [metadata.nodeName] - FigJam node name
 * @param {number} [metadata.lineIndex] - Line index within the node
 * @param {string} [metadata.currentFlowGroup] - Current flow group context
 * @param {string} [metadata.currentActor] - Current actor context
 * @returns {ParsedCardLine} Parsed card line
 *
 * @example
 * parseCardLine("G: Increase user engagement")
 * // => { raw: "G: Increase user engagement", label: "G", value: "Increase user engagement" }
 *
 * @example
 * parseCardLine("S: User taps button [actor=Host]")
 * // => { raw: "...", label: "S", value: "User taps button", actor: "Host" }
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
      ...(metadata.lineIndex !== undefined && { lineIndex: metadata.lineIndex }),
      ...(metadata.currentFlowGroup && { flowGroup: metadata.currentFlowGroup })
    };
  }

  // Try to match a label prefix pattern: "LABEL:" or "LABEL: value"
  const labelMatch = trimmed.match(/^([a-zA-Z]+):\s*(.*)/);

  if (labelMatch) {
    const [, prefix, rawValue] = labelMatch;
    const normalizedPrefix = prefix.toLowerCase();

    // Check if it's a recognized label
    if (LABEL_MAP[normalizedPrefix]) {
      // Extract inline actor if present
      const { actor, cleanText } = extractInlineActor(rawValue);

      return {
        raw,
        label: LABEL_MAP[normalizedPrefix],
        value: cleanText.trim(),
        ...(actor && { actor }),
        ...(metadata.nodeId && { nodeId: metadata.nodeId }),
        ...(metadata.nodeName && { nodeName: metadata.nodeName }),
        ...(metadata.lineIndex !== undefined && { lineIndex: metadata.lineIndex }),
        ...(metadata.currentFlowGroup && { flowGroup: metadata.currentFlowGroup }),
        ...(metadata.currentActor && !actor && { actor: metadata.currentActor })
      };
    }
  }

  // No recognized label - classify as NOTE
  // Still check for inline actor
  const { actor, cleanText } = extractInlineActor(trimmed);

  return {
    raw,
    label: /** @type {CardLabel} */ ('NOTE'),
    value: cleanText,
    ...(actor && { actor }),
    ...(metadata.nodeId && { nodeId: metadata.nodeId }),
    ...(metadata.nodeName && { nodeName: metadata.nodeName }),
    ...(metadata.lineIndex !== undefined && { lineIndex: metadata.lineIndex }),
    ...(metadata.currentFlowGroup && { flowGroup: metadata.currentFlowGroup }),
    ...(metadata.currentActor && !actor && { actor: metadata.currentActor })
  };
}

/**
 * Extract persona name and details from a P: line.
 *
 * @param {string} value - The value portion after "P:"
 * @returns {Persona} Parsed persona
 */
function parsePersona(value) {
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

  return { name: value.trim() };
}

/**
 * Extract step ID and text from an S: line.
 * Also extracts inline actor tag.
 *
 * @param {string} value - The value portion after "S:"
 * @param {Object} [context] - Parsing context
 * @param {string} [context.flowGroup] - Current flow group
 * @param {string} [context.actor] - Current actor from A: or inline tag
 * @returns {Step} Parsed step
 */
function parseStep(value, context = {}) {
  // Match patterns like "(S1)", "(1)", "(Step1)", etc.
  const idMatch = value.match(/^\(([^)]+)\)\s*(.*)/);

  let id, text;
  if (idMatch) {
    id = idMatch[1].trim();
    text = idMatch[2].trim() || value.trim();
  } else {
    text = value.trim();
  }

  const step = { text };
  if (id) step.id = id;
  if (context.flowGroup) step.flowGroup = context.flowGroup;
  if (context.actor) step.lane = context.actor;

  return step;
}

/**
 * Parse a Decision line with ID support.
 *
 * @param {string} value - The value portion after "D:"
 * @param {Object} [context] - Parsing context
 * @returns {Decision} Parsed decision
 */
function parseDecision(value, context = {}) {
  // Check for ID prefix like "(D1)"
  const idMatch = value.match(/^\(([^)]+)\)\s*(.*)/);

  let id, questionPart;
  if (idMatch) {
    id = idMatch[1].trim();
    questionPart = idMatch[2].trim();
  } else {
    questionPart = value;
  }

  // Split by pipe to find yes/no branches
  const parts = questionPart.split('|').map(p => p.trim());

  const result = {
    question: parts[0]
  };

  if (id) result.id = id;
  if (context.flowGroup) result.flowGroup = context.flowGroup;
  if (context.actor) result.lane = context.actor;

  // Parse branches
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const yesMatch = part.match(/^yes:\s*(.*)/i);
    const noMatch = part.match(/^no:\s*(.*)/i);

    if (yesMatch) result.yes = yesMatch[1].trim();
    else if (noMatch) result.no = noMatch[1].trim();
  }

  return result;
}

/**
 * Parse an Edge line with enhanced format support.
 * Supports: "S1 -> S2", "S1 -> D1 [label=Start]", "D1 -> S4 [label=Yes, condition=approved]"
 *
 * @param {string} value - The value portion after "E:"
 * @param {Object} [context] - Parsing context
 * @returns {Edge|null} Parsed edge, or null if parsing fails
 */
function parseEdge(value, context = {}) {
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

  // Add flow group context
  if (context.flowGroup) {
    edge.flowGroup = context.flowGroup;
  }

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
 * Parse a Flow group declaration.
 *
 * @param {string} value - The value portion after "F:"
 * @returns {FlowGroup} Parsed flow group
 */
function parseFlowGroup(value) {
  // Generate ID from name
  const name = value.trim();
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return {
    id: `flow_${id}`,
    name: name,
    steps: [],
    decisions: [],
    edges: []
  };
}

/**
 * Extract lane information from node name.
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
 * Supports flow groups (F:) and actor declarations (A:).
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
    flowGroups: [],
    actors: [],
    notes: [],
    problems: [],
    uiElements: [],
    dataObjects: [],
    rules: [],
    risks: [],
    questions: [],
    outputs: []
  };

  // Track current context
  let currentFlowGroup = null;
  let currentFlowGroupObj = null;
  let currentActor = null;

  // Track step/decision counters for auto-ID
  let stepCounter = 1;
  let decisionCounter = 1;

  // Process each extracted node
  for (const node of extracted) {
    const { id: nodeId, name: nodeName, text } = node;

    // Check for lane info in node name
    const laneFromName = extractLaneFromNodeName(nodeName);

    // Split text into lines and parse each independently
    const lines = text.split(/\r?\n/);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      // Skip empty lines
      if (!line.trim()) continue;

      // Parse the line with context
      const parsed = parseCardLine(line, {
        nodeId,
        nodeName,
        lineIndex,
        currentFlowGroup,
        currentActor: parsed?.actor || currentActor || laneFromName
      });

      // Route to appropriate array based on label
      switch (parsed.label) {
        case 'F': {
          // Flow group declaration - starts new context
          const flowGroup = parseFlowGroup(parsed.value);
          flowSpec.flowGroups.push(flowGroup);
          currentFlowGroup = flowGroup.id;
          currentFlowGroupObj = flowGroup;
          break;
        }

        case 'A': {
          // Actor declaration - sets current lane context
          const actorName = parsed.value.trim();
          if (!flowSpec.actors.includes(actorName)) {
            flowSpec.actors.push(actorName);
          }
          currentActor = actorName;
          break;
        }

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
          const step = parseStep(parsed.value, {
            flowGroup: currentFlowGroup,
            actor: parsed.actor || currentActor || laneFromName
          });

          // Auto-assign ID if not present
          if (!step.id) {
            step.id = `S${stepCounter++}`;
          }

          flowSpec.steps.push(step);

          // Track in flow group
          if (currentFlowGroupObj) {
            currentFlowGroupObj.steps.push(step.id);
          }
          break;
        }

        case 'D': {
          const decision = parseDecision(parsed.value, {
            flowGroup: currentFlowGroup,
            actor: parsed.actor || currentActor || laneFromName
          });

          // Auto-assign ID if not present
          if (!decision.id) {
            decision.id = `D${decisionCounter++}`;
          }

          flowSpec.decisions.push(decision);

          // Track in flow group
          if (currentFlowGroupObj) {
            currentFlowGroupObj.decisions.push(decision.id);
          }
          break;
        }

        case 'E': {
          const edge = parseEdge(parsed.value, {
            flowGroup: currentFlowGroup
          });

          if (edge) {
            flowSpec.edges.push(edge);

            // Track in flow group
            if (currentFlowGroupObj) {
              currentFlowGroupObj.edges.push(edge);
            }
          } else {
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

/**
 * Check if a flow has explicit edges.
 *
 * @param {FlowSpec} flowSpec - The flow spec to check
 * @param {string} [flowGroupId] - Optional flow group to check
 * @returns {boolean} True if explicit edges exist
 */
export function hasExplicitEdges(flowSpec, flowGroupId) {
  if (flowGroupId) {
    const group = flowSpec.flowGroups.find(g => g.id === flowGroupId);
    return group ? group.edges.length > 0 : false;
  }
  return flowSpec.edges.length > 0;
}

/**
 * Get steps for a specific flow group.
 *
 * @param {FlowSpec} flowSpec
 * @param {string} flowGroupId
 * @returns {Step[]}
 */
export function getStepsForFlowGroup(flowSpec, flowGroupId) {
  return flowSpec.steps.filter(s => s.flowGroup === flowGroupId);
}

/**
 * Get decisions for a specific flow group.
 *
 * @param {FlowSpec} flowSpec
 * @param {string} flowGroupId
 * @returns {Decision[]}
 */
export function getDecisionsForFlowGroup(flowSpec, flowGroupId) {
  return flowSpec.decisions.filter(d => d.flowGroup === flowGroupId);
}
