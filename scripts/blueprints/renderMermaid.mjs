/**
 * renderMermaid.mjs
 *
 * Generates Mermaid flowchart diagrams from FlowSpec structures.
 *
 * @module renderMermaid
 */

// ============================================================================
// Type Imports (for JSDoc)
// ============================================================================

/**
 * @typedef {import('./parseCards.mjs').FlowSpec} FlowSpec
 * @typedef {import('./parseCards.mjs').Step} Step
 * @typedef {import('./parseCards.mjs').Decision} Decision
 * @typedef {import('./parseCards.mjs').Edge} Edge
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Characters that need escaping in Mermaid labels
 * @type {RegExp}
 */
const MERMAID_SPECIAL_CHARS = /["<>{}|]/g;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a safe Mermaid node ID from text.
 * Converts text to a valid identifier (alphanumeric + underscores).
 *
 * @param {string} text - Text to convert to an ID
 * @param {string} [prefix='N'] - Prefix for the ID
 * @returns {string} Safe Mermaid node ID
 *
 * @example
 * toSafeId("User taps button")
 * // => "N_User_taps_button"
 */
function toSafeId(text, prefix = 'N') {
  // Remove special characters, replace spaces with underscores
  const safe = text
    .replace(/[^a-zA-Z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30); // Limit length

  return `${prefix}_${safe}`;
}

/**
 * Escape special characters for Mermaid labels.
 * Wraps text in quotes if it contains special characters.
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for Mermaid labels
 */
function escapeLabel(text) {
  // Replace quotes with escaped quotes
  const escaped = text
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;');

  return escaped;
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed.
 *
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=50] - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// Main Render Function
// ============================================================================

/**
 * Render a FlowSpec as a Mermaid flowchart.
 *
 * Generates a "flowchart TD" (top-down) diagram with:
 * - Steps as rectangular nodes
 * - Decisions as diamond nodes
 * - Edges with optional labels
 * - Auto-linking of steps if no edges defined
 *
 * @param {FlowSpec} flow - The FlowSpec to render
 * @param {Object} [options] - Rendering options
 * @param {string} [options.direction='TD'] - Flow direction (TD, LR, BT, RL)
 * @param {boolean} [options.includePersonas=true] - Include persona info in steps
 * @param {boolean} [options.includeLanes=false] - Use subgraphs for lanes
 * @returns {string} Mermaid flowchart code
 *
 * @example
 * const mermaid = renderFlowchart(flowSpec);
 * // Returns:
 * // flowchart TD
 * //   S1[User opens app]
 * //   S2[User selects song]
 * //   S1 --> S2
 */
export function renderFlowchart(flow, options = {}) {
  const {
    direction = 'TD',
    includePersonas = true,
    includeLanes = false
  } = options;

  const lines = [];

  // Header
  lines.push(`flowchart ${direction}`);
  lines.push('');

  // Track node IDs for auto-linking
  const nodeIds = [];

  // Map to store step text -> generated ID
  const stepIdMap = new Map();

  // Track lanes for subgraphs
  const laneNodes = new Map();

  // ---- Render Steps ----
  if (flow.steps.length > 0) {
    lines.push('  %% Steps');

    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];

      // Use provided ID or generate one
      const nodeId = step.id || `S${i + 1}`;
      nodeIds.push(nodeId);

      // Build label with optional persona
      let label = truncate(step.text, 60);
      if (includePersonas && step.persona) {
        label = `[${step.persona}] ${label}`;
      }

      // Escape for Mermaid
      const safeLabel = escapeLabel(label);

      // Store mapping for edge resolution
      stepIdMap.set(step.text.toLowerCase(), nodeId);
      if (step.id) {
        stepIdMap.set(step.id.toLowerCase(), nodeId);
      }

      // Track lane membership
      if (step.lane) {
        if (!laneNodes.has(step.lane)) {
          laneNodes.set(step.lane, []);
        }
        laneNodes.get(step.lane).push(nodeId);
      }

      // Render node (rectangle)
      lines.push(`  ${nodeId}["${safeLabel}"]`);
    }

    lines.push('');
  }

  // ---- Render Decisions ----
  if (flow.decisions.length > 0) {
    lines.push('  %% Decisions');

    for (let i = 0; i < flow.decisions.length; i++) {
      const decision = flow.decisions[i];

      // Generate decision ID
      const nodeId = `D${i + 1}`;
      nodeIds.push(nodeId);

      // Decision questions use diamond shape
      const safeLabel = escapeLabel(truncate(decision.question, 40));

      // Store mapping
      stepIdMap.set(decision.question.toLowerCase(), nodeId);

      // Render node (diamond shape in Mermaid uses {})
      lines.push(`  ${nodeId}{"${safeLabel}"}`);
    }

    lines.push('');
  }

  // ---- Render Lanes as Subgraphs (optional) ----
  if (includeLanes && laneNodes.size > 0) {
    lines.push('  %% Lanes');

    for (const [lane, nodes] of laneNodes) {
      lines.push(`  subgraph ${toSafeId(lane, 'Lane')}["${escapeLabel(lane)}"]`);
      for (const nodeId of nodes) {
        lines.push(`    ${nodeId}`);
      }
      lines.push('  end');
    }

    lines.push('');
  }

  // ---- Render Edges ----
  const hasExplicitEdges = flow.edges.length > 0;

  if (hasExplicitEdges) {
    lines.push('  %% Edges');

    for (const edge of flow.edges) {
      // Resolve from/to to node IDs
      const fromId = resolveNodeId(edge.from, stepIdMap);
      const toId = resolveNodeId(edge.to, stepIdMap);

      // Build edge with optional label
      if (edge.label || edge.condition) {
        const edgeLabel = edge.condition
          ? `${edge.label || ''} (${edge.condition})`.trim()
          : edge.label;
        lines.push(`  ${fromId} -->|"${escapeLabel(edgeLabel)}"| ${toId}`);
      } else {
        lines.push(`  ${fromId} --> ${toId}`);
      }
    }

    // Also render decision edges if decisions have yes/no branches
    for (let i = 0; i < flow.decisions.length; i++) {
      const decision = flow.decisions[i];
      const decisionId = `D${i + 1}`;

      if (decision.yes) {
        const yesId = resolveNodeId(decision.yes, stepIdMap);
        lines.push(`  ${decisionId} -->|"Yes"| ${yesId}`);
      }

      if (decision.no) {
        const noId = resolveNodeId(decision.no, stepIdMap);
        lines.push(`  ${decisionId} -->|"No"| ${noId}`);
      }
    }
  } else {
    // Auto-link steps in sequence if no edges defined
    if (nodeIds.length > 1) {
      lines.push('  %% Auto-generated edges (no explicit E: edges found)');

      for (let i = 0; i < nodeIds.length - 1; i++) {
        lines.push(`  ${nodeIds[i]} --> ${nodeIds[i + 1]}`);
      }
    }
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Resolve a node reference to a Mermaid node ID.
 * Tries to match against step IDs, step text, or uses as-is.
 *
 * @param {string} ref - Node reference (could be ID like "S1" or text)
 * @param {Map<string, string>} stepIdMap - Map of text/id to node ID
 * @returns {string} Resolved node ID
 */
function resolveNodeId(ref, stepIdMap) {
  const lower = ref.toLowerCase();

  // Check if it's a direct match in our map
  if (stepIdMap.has(lower)) {
    return stepIdMap.get(lower);
  }

  // Check if it's already a valid-looking ID (S1, D1, etc.)
  if (/^[SD]\d+$/i.test(ref)) {
    return ref.toUpperCase();
  }

  // Generate a safe ID from the reference
  return toSafeId(ref, 'N');
}

// ============================================================================
// Additional Render Functions
// ============================================================================

/**
 * Render a simple list of goals as a Mermaid flowchart.
 *
 * @param {string[]} goals - Array of goals
 * @returns {string} Mermaid flowchart code
 */
export function renderGoals(goals) {
  if (goals.length === 0) return '';

  const lines = ['flowchart LR', ''];
  lines.push('  subgraph Goals');

  for (let i = 0; i < goals.length; i++) {
    const safeLabel = escapeLabel(truncate(goals[i], 40));
    lines.push(`    G${i + 1}(["${safeLabel}"])`);
  }

  lines.push('  end');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render personas as a simple diagram.
 *
 * @param {import('./parseCards.mjs').Persona[]} personas - Array of personas
 * @returns {string} Mermaid flowchart code
 */
export function renderPersonas(personas) {
  if (personas.length === 0) return '';

  const lines = ['flowchart TB', ''];
  lines.push('  subgraph Personas');

  for (let i = 0; i < personas.length; i++) {
    const p = personas[i];
    const label = p.details
      ? `${p.name}: ${truncate(p.details, 30)}`
      : p.name;
    const safeLabel = escapeLabel(label);
    lines.push(`    P${i + 1}[/"${safeLabel}"/]`);
  }

  lines.push('  end');
  lines.push('');

  return lines.join('\n');
}
