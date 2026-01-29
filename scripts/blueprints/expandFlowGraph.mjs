/**
 * expandFlowGraph.mjs
 *
 * SpecKit-style FlowGraph Expander v2.0
 *
 * Takes a FlowSpec JSON and expands it into a complete, render-ready
 * FlowGraph with:
 * - Multiple flow groups (F: scenarios)
 * - Multiple entry points per flow
 * - Branching decisions with ≥2 outgoing edges
 * - Swimlanes (actors) from A: declarations
 * - Inferred system steps (marked as inferred: true)
 * - Explicit edges when defined, auto-wiring otherwise
 * - End states (SUCCESS, EXIT, ERROR)
 * - Assumptions, open questions, risks tracking
 *
 * @module expandFlowGraph
 */

import { hasExplicitEdges } from './parseCards.mjs';

// ============================================================================
// Type Definitions (JSDoc)
// ============================================================================

/**
 * @typedef {'step'|'decision'|'system'|'start'|'end'|'exit'} NodeType
 */

/**
 * @typedef {Object} FlowNode
 * @property {string} id - Unique node identifier
 * @property {NodeType} type - Node type
 * @property {string} lane - Swimlane (actor)
 * @property {string} label - Human-readable text
 * @property {string} [description] - Extended description
 * @property {string[]} [requirements] - Related requirement IDs
 * @property {boolean} [inferred] - Whether this node was inferred by SpecKit
 * @property {string} [flowGroup] - Flow group this node belongs to
 * @property {string} [sourceText] - Original text from FlowSpec
 */

/**
 * @typedef {Object} FlowEdge
 * @property {string} from - Source node ID
 * @property {string} to - Target node ID
 * @property {string} [label] - Edge label (Yes/No/condition)
 * @property {string} [condition] - Condition expression
 * @property {string} [flowGroup] - Flow group this edge belongs to
 */

/**
 * @typedef {Object} FlowGroupOutput
 * @property {string} id - Flow group identifier
 * @property {string} name - Flow group display name
 * @property {string[]} starts - Entry point node IDs for this flow
 * @property {string[]} ends - End state node IDs for this flow
 * @property {FlowNode[]} nodes - Nodes in this flow
 * @property {FlowEdge[]} edges - Edges in this flow
 */

/**
 * @typedef {Object} FlowGraphMeta
 * @property {string} project - Project name
 * @property {string} feature - Feature name
 * @property {string} generatedAt - ISO timestamp
 * @property {string} sourceFileKey - Original FigJam file key
 * @property {string} specKitVersion - SpecKit version
 */

/**
 * @typedef {Object} FlowGraph
 * @property {FlowGraphMeta} meta - Metadata
 * @property {FlowGroupOutput[]} flows - Individual flow groups
 * @property {string[]} lanes - Swimlane names in order
 * @property {string[]} starts - All entry point node IDs (combined)
 * @property {string[]} ends - All end state node IDs (combined)
 * @property {FlowNode[]} nodes - All nodes (combined)
 * @property {FlowEdge[]} edges - All edges (combined)
 * @property {string[]} assumptions - Assumptions made during expansion
 * @property {string[]} openQuestions - Unresolved questions
 * @property {string[]} risks - Identified risks
 */

// ============================================================================
// Constants
// ============================================================================

export const SPECKIT_VERSION = '2.0.0';

// Default lanes if not inferable
const DEFAULT_LANES = ['User', 'System'];

// Keywords for lane inference (fallback only)
const LANE_KEYWORDS = {
  'host': 'Host',
  'participant': 'Guest',
  'guest': 'Guest',
  'friend': 'Guest',
  'user': 'User',
  'app': 'System',
  'system': 'System',
  'server': 'System',
  'lobby': 'System',
  'session': 'System'
};

// System step inference patterns
const SYSTEM_STEP_PATTERNS = [
  { pattern: /permission|microphone|camera|location/i, label: 'Request Permission', priority: 1 },
  { pattern: /lobby|room|session/i, label: 'Create Session', priority: 2 },
  { pattern: /sync|synchronize|real-?time/i, label: 'Sync State', priority: 3 },
  { pattern: /auth|login|authenticate/i, label: 'Authenticate User', priority: 1 },
  { pattern: /save|persist|store/i, label: 'Save Data', priority: 4 },
  { pattern: /load|fetch|retrieve/i, label: 'Load Data', priority: 1 },
  { pattern: /notify|notification|alert/i, label: 'Send Notification', priority: 3 },
  { pattern: /validate|verify|check/i, label: 'Validate Input', priority: 2 },
  { pattern: /cleanup|teardown|disconnect/i, label: 'Cleanup Session', priority: 5 },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID with prefix.
 * @param {string} prefix
 * @param {number} index
 * @returns {string}
 */
function genId(prefix, index) {
  return `${prefix}${index}`;
}

/**
 * Generate a flow-scoped ID.
 * @param {string} flowId
 * @param {string} prefix
 * @param {number} index
 * @returns {string}
 */
function genFlowId(flowId, prefix, index) {
  return flowId ? `${flowId}_${prefix}${index}` : genId(prefix, index);
}

/**
 * Infer lane from step text (fallback when no explicit actor).
 * @param {string} text
 * @param {string[]} personas
 * @param {string[]} declaredActors
 * @returns {string}
 */
function inferLane(text, personas, declaredActors) {
  const lower = text.toLowerCase();

  // Check declared actors first
  for (const actor of declaredActors) {
    if (lower.includes(actor.toLowerCase())) {
      return actor;
    }
  }

  // Check persona names
  for (const persona of personas) {
    const personaLower = persona.toLowerCase();
    if (lower.includes(personaLower)) {
      if (personaLower.includes('host')) return 'Host';
      if (personaLower.includes('participant') || personaLower.includes('friend')) return 'Guest';
      if (personaLower.includes('listener') || personaLower.includes('user')) return 'User';
    }
  }

  // Keyword-based fallback
  for (const [keyword, lane] of Object.entries(LANE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return lane;
    }
  }

  // Sentence structure fallback
  if (lower.startsWith('user ') || lower.startsWith('users ')) return 'User';
  if (lower.startsWith('app ') || lower.startsWith('system ')) return 'System';
  if (lower.startsWith('host ')) return 'Host';
  if (lower.startsWith('friend ') || lower.startsWith('participant')) return 'Guest';

  return 'User'; // Default
}

/**
 * Detect if step text implies a decision point.
 * @param {string} text
 * @returns {boolean}
 */
function isDecisionText(text) {
  const lower = text.toLowerCase();
  return (
    lower.startsWith('if ') ||
    lower.includes('? ') ||
    lower.endsWith('?') ||
    lower.includes(' or ') ||
    lower.includes('choose') ||
    lower.includes('select') ||
    lower.includes('decision') ||
    lower.includes('whether')
  );
}

/**
 * Parse decision branches from text.
 * @param {string} text
 * @returns {{condition: string, ifTrue: string|null, ifFalse: string|null}|null}
 */
function parseDecisionBranches(text) {
  // Pattern: "If X, Y"
  const ifMatch = text.match(/^if\s+(.+?),\s+(.+)$/i);
  if (ifMatch) {
    return {
      condition: ifMatch[1].trim(),
      ifTrue: ifMatch[2].trim(),
      ifFalse: null
    };
  }

  // Pattern: "X or Y"
  const orMatch = text.match(/(.+?)\s+or\s+(.+)/i);
  if (orMatch) {
    return {
      condition: 'choice',
      ifTrue: orMatch[1].trim(),
      ifFalse: orMatch[2].trim()
    };
  }

  // Pattern: "X? (question)"
  const questionMatch = text.match(/^(.+?)\?/);
  if (questionMatch) {
    return {
      condition: questionMatch[1].trim(),
      ifTrue: null,
      ifFalse: null
    };
  }

  return null;
}

/**
 * Truncate text to max length.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function truncate(text, max) {
  return text.length > max ? text.substring(0, max - 3) + '...' : text;
}

// ============================================================================
// Lane Analysis
// ============================================================================

/**
 * Determine lanes from actors, personas, and step content.
 * @param {string[]} declaredActors - A: declarations
 * @param {string[]} personaNames - P: names
 * @param {Object[]} steps - Step objects
 * @returns {string[]}
 */
function determineLanes(declaredActors, personaNames, steps) {
  const lanes = new Set();

  // Add declared actors first (they take priority)
  for (const actor of declaredActors) {
    lanes.add(actor);
  }

  // Add from personas
  for (const name of personaNames) {
    const lower = name.toLowerCase();
    if (lower.includes('host')) lanes.add('Host');
    else if (lower.includes('participant') || lower.includes('friend') || lower.includes('guest')) lanes.add('Guest');
    else if (lower.includes('user') || lower.includes('listener')) lanes.add('User');
  }

  // Add from step lanes
  for (const step of steps) {
    if (step.lane) lanes.add(step.lane);
  }

  // Always include System
  lanes.add('System');

  // Ensure at least User lane
  if (lanes.size === 1) {
    lanes.add('User');
  }

  // Return in logical order
  const order = ['User', 'Host', 'Guest', 'System'];
  const orderedLanes = order.filter(l => lanes.has(l));

  // Add any custom lanes not in the standard order
  for (const lane of lanes) {
    if (!orderedLanes.includes(lane)) {
      orderedLanes.splice(orderedLanes.length - 1, 0, lane); // Insert before System
    }
  }

  return orderedLanes;
}

// ============================================================================
// Entry Point Detection
// ============================================================================

/**
 * Identify entry points for a flow.
 * @param {Object[]} steps
 * @param {Object[]} decisions
 * @param {Object} flowSpec
 * @param {string} [flowGroupId]
 * @param {string[]} lanes
 * @returns {Object[]}
 */
function identifyEntryPoints(steps, decisions, flowSpec, flowGroupId, lanes) {
  const entries = [];
  const prefix = flowGroupId ? `${flowGroupId}_` : '';

  // Check for mode selection patterns in decisions
  const modeDecision = decisions.find(d =>
    d.question?.toLowerCase().includes('solo') ||
    d.question?.toLowerCase().includes('with friends') ||
    d.question?.toLowerCase().includes('mode')
  );

  if (modeDecision) {
    // Create separate entry points for each mode
    entries.push({
      id: `${prefix}START_SOLO`,
      lane: 'User',
      label: 'Solo Mode'
    });

    if (lanes.includes('Host')) {
      entries.push({
        id: `${prefix}START_HOST`,
        lane: 'Host',
        label: 'Host Session'
      });
    }

    if (lanes.includes('Guest')) {
      entries.push({
        id: `${prefix}START_JOIN`,
        lane: 'Guest',
        label: 'Join Session'
      });
    }
  } else if (steps.length > 0) {
    // Single entry point based on first step
    const firstStep = steps[0];
    entries.push({
      id: `${prefix}START`,
      lane: firstStep.lane || 'User',
      label: 'Start'
    });
  } else {
    // Default entry
    entries.push({
      id: `${prefix}START`,
      lane: 'User',
      label: 'Start'
    });
  }

  return entries;
}

// ============================================================================
// End State Detection
// ============================================================================

/**
 * Identify end states for a flow.
 * @param {Object} flowSpec
 * @param {Object[]} steps
 * @param {string} [flowGroupId]
 * @returns {Object[]}
 */
function identifyEndStates(flowSpec, steps, flowGroupId) {
  const ends = [];
  const prefix = flowGroupId ? `${flowGroupId}_` : '';

  // Always add success end
  ends.push({
    id: `${prefix}END_SUCCESS`,
    lane: 'System',
    label: 'Complete'
  });

  // Add exit end
  ends.push({
    id: `${prefix}END_EXIT`,
    lane: 'User',
    label: 'User Exit'
  });

  // Check for error scenarios
  const requirements = flowSpec.requirements?.functional || [];
  const hasErrorHandling = requirements.some(r =>
    r.toLowerCase().includes('error') ||
    r.toLowerCase().includes('denied') ||
    r.toLowerCase().includes('fail')
  );

  if (hasErrorHandling || flowSpec.risks?.length > 0) {
    ends.push({
      id: `${prefix}END_ERROR`,
      lane: 'System',
      label: 'Error'
    });
  }

  return ends;
}

// ============================================================================
// System Step Inference
// ============================================================================

/**
 * Infer system steps that should exist based on requirements and step content.
 * @param {Object} flowSpec
 * @param {Object[]} steps
 * @param {string} [flowGroupId]
 * @returns {Object[]}
 */
function inferSystemSteps(flowSpec, steps, flowGroupId) {
  const systemSteps = [];
  const prefix = flowGroupId ? `${flowGroupId}_` : '';
  const seen = new Set();

  // Check requirements
  const allText = [
    ...(flowSpec.requirements?.functional || []),
    ...(flowSpec.requirements?.nonFunctional || []),
    ...steps.map(s => s.text)
  ].join(' ');

  for (const { pattern, label, priority } of SYSTEM_STEP_PATTERNS) {
    if (pattern.test(allText) && !seen.has(label)) {
      seen.add(label);
      systemSteps.push({
        id: `${prefix}SYS_${label.replace(/\s+/g, '_').toUpperCase()}`,
        label: label,
        priority: priority,
        inferred: true
      });
    }
  }

  // Sort by priority
  return systemSteps.sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// Edge Generation - Intelligent Inference
// ============================================================================

/**
 * Build a map of which nodes have incoming/outgoing edges.
 * @param {FlowEdge[]} edges
 * @returns {{incoming: Map<string, string[]>, outgoing: Map<string, string[]>}}
 */
function buildEdgeMap(edges) {
  const incoming = new Map();
  const outgoing = new Map();

  for (const edge of edges) {
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
    outgoing.get(edge.from).push(edge.to);

    if (!incoming.has(edge.to)) incoming.set(edge.to, []);
    incoming.get(edge.to).push(edge.from);
  }

  return { incoming, outgoing };
}

/**
 * Find the next logical node after a given node based on document order.
 * Considers node types and lanes for smart routing.
 * @param {FlowNode[]} nodes - All nodes in order
 * @param {number} currentIdx - Current node index
 * @param {FlowNode} currentNode - Current node
 * @param {Set<string>} connected - Already connected node IDs
 * @returns {FlowNode|null}
 */
function findNextLogicalNode(nodes, currentIdx, currentNode, connected) {
  // Look for the next node in document order
  for (let i = currentIdx + 1; i < nodes.length; i++) {
    const candidate = nodes[i];

    // Skip already fully connected nodes
    if (connected.has(candidate.id)) continue;

    // Skip start nodes (they're entry points, not targets)
    if (candidate.type === 'start') continue;

    // Skip end/exit nodes unless we're at the end of a flow
    if (candidate.type === 'end' || candidate.type === 'exit') continue;

    // Prefer same lane, but accept cross-lane if it's a system step
    if (candidate.lane === currentNode.lane || candidate.type === 'system') {
      return candidate;
    }

    // For system steps, any next step is valid
    if (currentNode.type === 'system') {
      return candidate;
    }
  }

  return null;
}

/**
 * Find suitable end nodes for connecting final steps.
 * @param {FlowNode[]} nodes
 * @param {FlowNode} lastStep
 * @returns {FlowNode[]}
 */
function findEndNodesForStep(nodes, lastStep) {
  const endNodes = nodes.filter(n => n.type === 'end' || n.type === 'exit');

  // Prefer success end for normal steps
  const successEnd = endNodes.find(n =>
    n.label?.toLowerCase().includes('success') ||
    n.label?.toLowerCase().includes('complete') ||
    n.id.includes('SUCCESS')
  );

  if (successEnd) return [successEnd];

  // Otherwise, find any end node, preferring same lane
  const sameLaneEnd = endNodes.find(n => n.lane === lastStep.lane);
  if (sameLaneEnd) return [sameLaneEnd];

  return endNodes.slice(0, 1);
}

/**
 * Generate intelligent edges that connect all nodes in a logical flow.
 * Principles:
 * 1. Every node (except end/exit) must have at least one outgoing edge
 * 2. Every node (except start) must have at least one incoming edge
 * 3. Decisions must have at least 2 outgoing edges (Yes/No branches)
 * 4. Nodes flow in document order within lanes
 * 5. System steps interleave between user steps
 * 6. Cross-lane transitions are explicit handoffs
 * 7. Never create cycles (edges only go forward in the flow)
 *
 * @param {FlowNode[]} nodes - All nodes in document order
 * @param {Object[]} entryPoints - Start node info
 * @param {Object[]} endStates - End node info
 * @param {Object[]} decisions - Decision info with branches
 * @param {string} flowId - Flow group ID
 * @returns {FlowEdge[]}
 */
function generateIntelligentEdges(nodes, entryPoints, endStates, decisions, flowId) {
  const edges = [];
  const edgeSet = new Set(); // Track unique edges

  // Build adjacency list for cycle detection
  const adjacency = new Map();

  const addEdge = (from, to, label) => {
    if (!from || !to) return false;
    if (from === to) return false; // No self-loops
    const key = `${from}->${to}`;
    if (edgeSet.has(key)) return false;

    // Check if this would create a cycle
    if (wouldCreateCycle(from, to, adjacency)) {
      return false; // Skip this edge
    }

    edgeSet.add(key);
    const edge = { from, to, flowGroup: flowId };
    if (label) edge.label = label;
    edges.push(edge);

    // Update adjacency list
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
    return true;
  };

  // Categorize nodes by type
  const startNodes = nodes.filter(n => n.type === 'start');
  const stepNodes = nodes.filter(n => n.type === 'step');
  const systemNodes = nodes.filter(n => n.type === 'system');
  const decisionNodes = nodes.filter(n => n.type === 'decision');
  const endNodes = nodes.filter(n => n.type === 'end' || n.type === 'exit');

  // Build ordered list of "action" nodes (steps, system, decisions)
  const actionNodes = nodes.filter(n =>
    n.type === 'step' || n.type === 'system' || n.type === 'decision'
  );

  if (actionNodes.length === 0) {
    // No actions, just connect start to end
    for (const start of startNodes) {
      const end = endNodes[0];
      if (end) addEdge(start.id, end.id);
    }
    return edges;
  }

  // === RULE 1: Connect START nodes to first action in their lane ===
  for (const start of startNodes) {
    // Find first action node in same lane
    let firstAction = actionNodes.find(n => n.lane === start.lane);

    // If no same-lane action, connect to the very first action
    if (!firstAction) {
      firstAction = actionNodes[0];
    }

    if (firstAction) {
      addEdge(start.id, firstAction.id);
    }
  }

  // === RULE 2: Connect action nodes sequentially ===
  // This creates the main flow backbone
  for (let i = 0; i < actionNodes.length - 1; i++) {
    const current = actionNodes[i];
    const next = actionNodes[i + 1];

    // Don't auto-connect FROM decisions (they need explicit branches)
    if (current.type === 'decision') continue;

    addEdge(current.id, next.id);
  }

  // === RULE 3: Handle decisions with proper branching ===
  for (let i = 0; i < actionNodes.length; i++) {
    const node = actionNodes[i];
    if (node.type !== 'decision') continue;

    // Find what comes after this decision
    const afterDecision = actionNodes.slice(i + 1);

    // Check if this decision has parsed branches
    const decisionInfo = decisions.find(d => d.id === node.id);

    // Find Yes target (next step in happy path)
    let yesTarget = afterDecision[0]; // Default: next action

    // Find No target (exit, error, or alternative path)
    let noTarget = null;

    // Look for exit/error nodes
    const exitNode = endNodes.find(n =>
      n.type === 'exit' ||
      n.label?.toLowerCase().includes('exit') ||
      n.label?.toLowerCase().includes('error') ||
      n.label?.toLowerCase().includes('fail')
    );

    // Look for alternative paths (different steps after Yes target)
    const altTarget = afterDecision.length > 1 ? afterDecision[1] : null;

    noTarget = exitNode || altTarget || endNodes[0];

    // Add Yes branch
    if (yesTarget) {
      addEdge(node.id, yesTarget.id, 'Yes');
    }

    // Add No branch
    if (noTarget) {
      addEdge(node.id, noTarget.id, 'No');
    }
  }

  // === RULE 4: Connect final steps to END nodes ===
  // Find steps that have no outgoing edges
  const { outgoing } = buildEdgeMap(edges);

  for (const step of [...stepNodes, ...systemNodes]) {
    if (!outgoing.has(step.id) || outgoing.get(step.id).length === 0) {
      // This step has no outgoing edge - connect to an end node
      const targetEnds = findEndNodesForStep(nodes, step);
      for (const end of targetEnds) {
        addEdge(step.id, end.id);
      }
    }
  }

  // === RULE 5: Ensure all END nodes have incoming edges ===
  const { incoming } = buildEdgeMap(edges);

  for (const end of endNodes) {
    if (!incoming.has(end.id) || incoming.get(end.id).length === 0) {
      // Find the last step to connect to this end
      const lastStep = stepNodes[stepNodes.length - 1] ||
                       systemNodes[systemNodes.length - 1];
      if (lastStep) {
        // Check if it's an exit node - connect from decision No branches
        if (end.type === 'exit' || end.label?.toLowerCase().includes('exit')) {
          // Already handled by decision logic, but ensure at least one connection
          if (!incoming.has(end.id)) {
            addEdge(lastStep.id, end.id);
          }
        } else {
          addEdge(lastStep.id, end.id);
        }
      }
    }
  }

  // === RULE 6: Fill in any orphaned nodes ===
  const finalEdgeMap = buildEdgeMap(edges);

  for (const node of actionNodes) {
    // Check for nodes with no incoming edges (except first action)
    if (node !== actionNodes[0] &&
        (!finalEdgeMap.incoming.has(node.id) || finalEdgeMap.incoming.get(node.id).length === 0)) {
      // Find previous node to connect from
      const idx = actionNodes.indexOf(node);
      if (idx > 0) {
        const prev = actionNodes[idx - 1];
        if (prev.type !== 'decision') { // Decisions already handled
          addEdge(prev.id, node.id);
        }
      }
    }

    // Check for nodes with no outgoing edges (except last action before end)
    if (!finalEdgeMap.outgoing.has(node.id) || finalEdgeMap.outgoing.get(node.id).length === 0) {
      const idx = actionNodes.indexOf(node);
      if (idx < actionNodes.length - 1) {
        const next = actionNodes[idx + 1];
        addEdge(node.id, next.id);
      } else {
        // Last action - connect to end
        const end = endNodes.find(n => n.type === 'end') || endNodes[0];
        if (end) addEdge(node.id, end.id);
      }
    }
  }

  return edges;
}

/**
 * Check if adding an edge would create a cycle using DFS.
 * @param {string} from - Source node ID
 * @param {string} to - Target node ID
 * @param {Map<string, string[]>} adjacency - Current adjacency list
 * @returns {boolean} True if the edge would create a cycle
 */
function wouldCreateCycle(from, to, adjacency) {
  // If adding edge from->to, check if there's already a path from to->from
  const visited = new Set();
  const stack = [to];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === from) return true; // Found path back to 'from'
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return false;
}

/**
 * Fill in missing edges when explicit edges exist but are incomplete.
 * Ensures every node is connected while respecting explicit definitions.
 * Prevents creating cycles by checking before adding edges.
 * @param {FlowEdge[]} explicitEdges - Edges defined with E:
 * @param {FlowNode[]} nodes - All nodes
 * @param {string} flowId - Flow group ID
 * @returns {FlowEdge[]}
 */
function fillMissingEdges(explicitEdges, nodes, flowId) {
  const edges = [...explicitEdges];
  const edgeSet = new Set(explicitEdges.map(e => `${e.from}->${e.to}`));

  // Build adjacency list for cycle detection
  const adjacency = new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge.to);
  }

  const addEdge = (from, to, label) => {
    if (!from || !to) return false;
    if (from === to) return false; // No self-loops
    const key = `${from}->${to}`;
    if (edgeSet.has(key)) return false;

    // Check if this would create a cycle
    if (wouldCreateCycle(from, to, adjacency)) {
      return false; // Skip this edge
    }

    edgeSet.add(key);
    const edge = { from, to, flowGroup: flowId, inferred: true };
    if (label) edge.label = label;
    edges.push(edge);

    // Update adjacency list
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
    return true;
  };

  const { incoming, outgoing } = buildEdgeMap(edges);

  const startNodes = nodes.filter(n => n.type === 'start');
  const endNodes = nodes.filter(n => n.type === 'end' || n.type === 'exit');
  const actionNodes = nodes.filter(n =>
    n.type === 'step' || n.type === 'system' || n.type === 'decision'
  );

  // Ensure start nodes have outgoing edges
  for (const start of startNodes) {
    if (!outgoing.has(start.id)) {
      const firstAction = actionNodes[0];
      if (firstAction) addEdge(start.id, firstAction.id);
    }
  }

  // Ensure end nodes have incoming edges
  for (const end of endNodes) {
    if (!incoming.has(end.id)) {
      const lastAction = actionNodes[actionNodes.length - 1];
      if (lastAction) addEdge(lastAction.id, end.id);
    }
  }

  // Ensure action nodes are connected - but only forward in the flow
  for (let i = 0; i < actionNodes.length; i++) {
    const node = actionNodes[i];

    // Skip decisions for outgoing (handled separately)
    if (node.type !== 'decision') {
      const currentOutgoing = buildEdgeMap(edges).outgoing;
      if (!currentOutgoing.has(node.id) || currentOutgoing.get(node.id).length === 0) {
        // No outgoing - find the next unconnected action or end node
        let connected = false;
        for (let j = i + 1; j < actionNodes.length && !connected; j++) {
          const next = actionNodes[j];
          connected = addEdge(node.id, next.id);
        }
        if (!connected) {
          // Connect to end node
          const end = endNodes.find(n => n.type === 'end') || endNodes[0];
          if (end) addEdge(node.id, end.id);
        }
      }
    }

    // Ensure incoming edges (except for first node)
    const currentIncoming = buildEdgeMap(edges).incoming;
    if (i > 0 && (!currentIncoming.has(node.id) || currentIncoming.get(node.id).length === 0)) {
      // Find a predecessor that can connect to us
      for (let j = i - 1; j >= 0; j--) {
        const prev = actionNodes[j];
        if (prev.type !== 'decision') {
          if (addEdge(prev.id, node.id)) break;
        }
      }
    }
  }

  // Ensure decisions have at least 2 outgoing edges
  for (const node of actionNodes.filter(n => n.type === 'decision')) {
    const currentEdgeMap = buildEdgeMap(edges);
    const outs = currentEdgeMap.outgoing.get(node.id) || [];
    if (outs.length < 2) {
      const idx = actionNodes.indexOf(node);
      const afterDecision = actionNodes.slice(idx + 1);

      if (outs.length === 0) {
        // Add both Yes and No
        const yesTarget = afterDecision[0];
        const noTarget = endNodes.find(n => n.type === 'exit') || endNodes[0];
        if (yesTarget) addEdge(node.id, yesTarget.id, 'Yes');
        if (noTarget) addEdge(node.id, noTarget.id, 'No');
      } else if (outs.length === 1) {
        // Add missing branch
        const existingTarget = outs[0];
        const hasYes = edges.some(e => e.from === node.id && e.label?.toLowerCase() === 'yes');
        const hasNo = edges.some(e => e.from === node.id && e.label?.toLowerCase() === 'no');

        if (!hasNo) {
          const noTarget = endNodes.find(n => n.type === 'exit') ||
                          afterDecision.find(a => a.id !== existingTarget) ||
                          endNodes[0];
          if (noTarget) addEdge(node.id, noTarget.id, 'No');
        } else if (!hasYes) {
          const yesTarget = afterDecision.find(a => a.id !== existingTarget) ||
                           afterDecision[0];
          if (yesTarget) addEdge(node.id, yesTarget.id, 'Yes');
        }
      }
    }
  }

  return edges;
}

// ============================================================================
// Flow Group Expansion
// ============================================================================

/**
 * Expand a single flow group.
 * Uses explicit START/END/EXIT/SYS nodes from DSL when available.
 * Falls back to inference only when explicit definitions are missing.
 *
 * @param {Object} flowSpec
 * @param {Object} flowGroup
 * @param {string[]} lanes
 * @param {string[]} personaNames
 * @param {string[]} declaredActors
 * @returns {FlowGroupOutput}
 */
function expandFlowGroup(flowSpec, flowGroup, lanes, personaNames, declaredActors) {
  const flowId = flowGroup?.id || '';
  const flowName = flowGroup?.name || 'Main Flow';

  // Filter elements for this flow group
  const filterByFlow = (arr, field = 'flowGroup') => {
    if (!arr) return [];
    return flowGroup
      ? arr.filter(item => item[field] === flowGroup.id)
      : arr.filter(item => !item[field]);
  };

  const flowSteps = filterByFlow(flowSpec.steps);
  const flowDecisions = filterByFlow(flowSpec.decisions);
  const flowEdges = filterByFlow(flowSpec.edges);
  const flowStartNodes = filterByFlow(flowSpec.startNodes);
  const flowEndNodes = filterByFlow(flowSpec.endNodes);
  const flowExitNodes = filterByFlow(flowSpec.exitNodes);
  const flowSystemSteps = filterByFlow(flowSpec.systemSteps);
  const flowChoices = filterByFlow(flowSpec.choices);

  const hasExplicitEdges = flowEdges.length > 0;
  const hasExplicitStarts = flowStartNodes.length > 0;
  const hasExplicitEnds = flowEndNodes.length > 0 || flowExitNodes.length > 0;
  const hasExplicitSystem = flowSystemSteps.length > 0;

  // Build nodes
  const nodes = [];
  const nodeMap = new Map();
  const entryPoints = [];
  const endStates = [];

  // === START NODES ===
  if (hasExplicitStarts) {
    // Use explicit START: nodes
    for (const start of flowStartNodes) {
      const lane = start.lane || 'User';
      const node = {
        id: start.id,
        type: 'start',
        lane: lane,
        label: start.label,
        flowGroup: flowId
      };
      nodes.push(node);
      nodeMap.set(start.id, node);
      entryPoints.push({ id: start.id, lane, label: start.label });
    }
  } else {
    // Fall back to inference
    const inferred = identifyEntryPoints(flowSteps, flowDecisions, flowSpec, flowId, lanes);
    for (const entry of inferred) {
      const node = {
        id: entry.id,
        type: 'start',
        lane: entry.lane,
        label: entry.label,
        flowGroup: flowId,
        inferred: true
      };
      nodes.push(node);
      nodeMap.set(entry.id, node);
      entryPoints.push(entry);
    }
  }

  // === USER STEPS (S:) ===
  for (const step of flowSteps) {
    const lane = step.lane || inferLane(step.text, personaNames, declaredActors);
    const node = {
      id: step.id,
      type: 'step',
      lane: lane,
      label: step.text,
      sourceText: step.text,
      flowGroup: flowId
    };
    nodes.push(node);
    nodeMap.set(step.id, node);
  }

  // === SYSTEM STEPS (SYS:) ===
  if (hasExplicitSystem) {
    // Use explicit SYS: nodes
    for (const sys of flowSystemSteps) {
      const node = {
        id: sys.id,
        type: 'system',
        lane: 'System',
        label: sys.text,
        sourceText: sys.text,
        flowGroup: flowId,
        inferred: false
      };
      nodes.push(node);
      nodeMap.set(sys.id, node);
    }
  } else {
    // Fall back to inference (only if no explicit edges either)
    if (!hasExplicitEdges) {
      const inferredSys = inferSystemSteps(flowSpec, flowSteps, flowId);
      for (const sys of inferredSys) {
        const node = {
          id: sys.id,
          type: 'system',
          lane: 'System',
          label: sys.label,
          inferred: true,
          flowGroup: flowId
        };
        nodes.push(node);
        nodeMap.set(sys.id, node);
      }
    }
  }

  // === DECISIONS (D:) ===
  for (const decision of flowDecisions) {
    const lane = decision.lane || inferLane(decision.question, personaNames, declaredActors);
    const node = {
      id: decision.id,
      type: 'decision',
      lane: lane,
      label: decision.question,
      sourceText: decision.question,
      flowGroup: flowId
    };
    nodes.push(node);
    nodeMap.set(decision.id, node);

    if (isDecisionText(decision.question)) {
      node.branches = parseDecisionBranches(decision.question);
    }
  }

  // === CHOICES (CHOICE:) - treat as multi-option decisions ===
  for (const choice of flowChoices) {
    const lane = choice.lane || inferLane(choice.question, personaNames, declaredActors);
    const node = {
      id: choice.id,
      type: 'decision',
      lane: lane,
      label: choice.question,
      sourceText: choice.question,
      flowGroup: flowId,
      options: choice.options
    };
    nodes.push(node);
    nodeMap.set(choice.id, node);
  }

  // === END NODES (END:) ===
  if (hasExplicitEnds) {
    // Use explicit END: nodes
    for (const end of flowEndNodes) {
      const lane = end.lane || 'System';
      const node = {
        id: end.id,
        type: 'end',
        lane: lane,
        label: end.label,
        flowGroup: flowId,
        isExit: false
      };
      nodes.push(node);
      nodeMap.set(end.id, node);
      endStates.push({ id: end.id, lane, label: end.label });
    }

    // Use explicit EXIT: nodes
    for (const exit of flowExitNodes) {
      const lane = exit.lane || 'User';
      const node = {
        id: exit.id,
        type: 'exit',
        lane: lane,
        label: exit.label,
        flowGroup: flowId,
        isExit: true
      };
      nodes.push(node);
      nodeMap.set(exit.id, node);
      endStates.push({ id: exit.id, lane, label: exit.label });
    }
  } else {
    // Fall back to inference
    const inferred = identifyEndStates(flowSpec, flowSteps, flowId);
    for (const end of inferred) {
      const node = {
        id: end.id,
        type: 'end',
        lane: end.lane,
        label: end.label,
        flowGroup: flowId,
        inferred: true
      };
      nodes.push(node);
      nodeMap.set(end.id, node);
      endStates.push(end);
    }
  }

  // === EDGES ===
  let edges = [];

  if (hasExplicitEdges) {
    // Start with explicit edges
    const explicitEdges = flowEdges.map(e => ({
      from: e.from,
      to: e.to,
      label: e.label,
      condition: e.condition,
      flowGroup: flowId
    }));

    // Fill in missing connections to ensure all nodes are connected
    edges = fillMissingEdges(explicitEdges, nodes, flowId);
  } else {
    // Generate intelligent edges that connect all nodes logically
    edges = generateIntelligentEdges(nodes, entryPoints, endStates, flowDecisions, flowId);
  }

  return {
    id: flowId || 'main',
    name: flowName,
    starts: entryPoints.map(e => e.id),
    ends: endStates.map(e => e.id),
    nodes: nodes,
    edges: edges
  };
}

// ============================================================================
// Main Expansion Function
// ============================================================================

/**
 * Expand a FlowSpec into a complete FlowGraph with flow groups.
 *
 * @param {import('./parseCards.mjs').FlowSpec} flowSpec - Input FlowSpec
 * @param {Object} [options] - Expansion options
 * @param {string} [options.featureName] - Override feature name
 * @param {boolean} [options.addSystemSteps=true] - Add inferred system steps
 * @returns {FlowGraph} Expanded FlowGraph
 */
export function expandFlowGraph(flowSpec, options = {}) {
  const {
    featureName = 'Feature',
    projectName: projectNameOption,
    addSystemSteps = true
  } = options;

  // Extract metadata - use option if provided, otherwise try to infer from context
  const projectName = projectNameOption ||
    flowSpec.context?.find(c => c.toLowerCase().includes('project'))?.split(':')[1]?.trim() ||
    'BluePrints';
  // Feature priority: CLI option > featureName param > goals from FigJam
  const feature = (featureName !== 'Feature' ? featureName : null) ||
    flowSpec.goals?.[0] ||
    'Feature';

  // Get declared actors and persona names
  const declaredActors = flowSpec.actors || [];
  const personaNames = (flowSpec.personas || []).map(p => p.name);

  // Determine lanes
  const lanes = determineLanes(declaredActors, personaNames, flowSpec.steps || []);

  // Initialize FlowGraph
  const flowGraph = {
    meta: {
      project: projectName,
      feature: feature,
      generatedAt: new Date().toISOString(),
      sourceFileKey: flowSpec.meta?.fileKey || 'unknown',
      specKitVersion: SPECKIT_VERSION
    },
    flows: [],
    lanes: lanes,
    personas: flowSpec.personas || [],
    starts: [],
    ends: [],
    nodes: [],
    edges: [],
    assumptions: flowSpec.assumptions || [],
    openQuestions: flowSpec.questions || [],
    risks: flowSpec.risks || [],
    acceptanceCriteria: flowSpec.acceptanceCriteria || []
  };

  // Expand flow groups
  const flowGroups = flowSpec.flowGroups || [];

  if (flowGroups.length > 0) {
    // Expand each named flow group
    for (const group of flowGroups) {
      const expandedFlow = expandFlowGroup(flowSpec, group, lanes, personaNames, declaredActors);
      flowGraph.flows.push(expandedFlow);

      // Aggregate to combined lists
      flowGraph.starts.push(...expandedFlow.starts);
      flowGraph.ends.push(...expandedFlow.ends);
      flowGraph.nodes.push(...expandedFlow.nodes);
      flowGraph.edges.push(...expandedFlow.edges);
    }
  }

  // Also expand "ungrouped" steps (those without a flow group)
  const ungroupedSteps = flowSpec.steps?.filter(s => !s.flowGroup) || [];
  const ungroupedDecisions = flowSpec.decisions?.filter(d => !d.flowGroup) || [];

  if (ungroupedSteps.length > 0 || ungroupedDecisions.length > 0 || flowGroups.length === 0) {
    const mainFlow = expandFlowGroup(flowSpec, null, lanes, personaNames, declaredActors);
    mainFlow.id = 'main';
    mainFlow.name = 'Main Flow';
    flowGraph.flows.push(mainFlow);

    flowGraph.starts.push(...mainFlow.starts);
    flowGraph.ends.push(...mainFlow.ends);
    flowGraph.nodes.push(...mainFlow.nodes);
    flowGraph.edges.push(...mainFlow.edges);
  }

  // Deduplicate nodes and edges
  const seenNodes = new Set();
  flowGraph.nodes = flowGraph.nodes.filter(n => {
    if (seenNodes.has(n.id)) return false;
    seenNodes.add(n.id);
    return true;
  });

  const seenEdges = new Set();
  flowGraph.edges = flowGraph.edges.filter(e => {
    const key = `${e.from}->${e.to}`;
    if (seenEdges.has(key)) return false;
    seenEdges.add(key);
    return true;
  });

  // Track expansion metadata (separate from author assumptions)
  const expansionNotes = [
    `SpecKit v${SPECKIT_VERSION} expansion`,
    `${flowGraph.flows.length} flow group(s) identified`,
    `${lanes.length} swimlanes: ${lanes.join(', ')}`,
    `${flowGraph.starts.length} entry point(s)`,
    `${flowGraph.ends.length} end state(s)`
  ];

  // Track what was explicit vs inferred
  const hasExplicitStartNodes = (flowSpec.startNodes?.length || 0) > 0;
  const hasExplicitEndNodes = (flowSpec.endNodes?.length || 0) > 0 || (flowSpec.exitNodes?.length || 0) > 0;
  const hasExplicitSystemSteps = (flowSpec.systemSteps?.length || 0) > 0;

  if (hasExplicitEdges(flowSpec)) {
    expansionNotes.push('Explicit edges used (E:)');
  } else {
    expansionNotes.push('Sequential edges auto-generated');
  }

  if (hasExplicitStartNodes) {
    expansionNotes.push('Explicit start nodes used (START:)');
  } else {
    expansionNotes.push('Entry points inferred');
  }

  if (hasExplicitEndNodes) {
    expansionNotes.push('Explicit end/exit nodes used (END:/EXIT:)');
  } else {
    expansionNotes.push('End states inferred');
  }

  if (hasExplicitSystemSteps) {
    expansionNotes.push('Explicit system steps used (SYS:)');
  }

  // Count inferred nodes
  const inferredCount = flowGraph.nodes.filter(n => n.inferred).length;
  if (inferredCount > 0) {
    expansionNotes.push(`${inferredCount} node(s) inferred by SpecKit`);
  }

  // Combine author assumptions with expansion notes
  flowGraph.assumptions = [
    ...(flowSpec.assumptions || []),
    '---',  // Separator
    ...expansionNotes
  ];

  return flowGraph;
}

// ============================================================================
// Export
// ============================================================================

export default expandFlowGraph;
