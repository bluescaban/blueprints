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
 * @typedef {'step'|'decision'|'system'|'start'|'end'} NodeType
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
// Edge Generation
// ============================================================================

/**
 * Generate sequential edges when no explicit edges exist.
 * @param {FlowNode[]} nodes
 * @param {Object[]} entryPoints
 * @param {Object[]} endStates
 * @param {Object[]} decisions
 * @returns {FlowEdge[]}
 */
function generateSequentialEdges(nodes, entryPoints, endStates, decisions) {
  const edges = [];

  // Get step and decision nodes in order
  const stepNodes = nodes.filter(n => n.type === 'step');
  const decisionNodes = nodes.filter(n => n.type === 'decision');
  const systemNodes = nodes.filter(n => n.type === 'system');

  if (stepNodes.length === 0) return edges;

  // Connect entries to first step
  for (const entry of entryPoints) {
    const entryNode = nodes.find(n => n.id === entry.id);
    if (entryNode) {
      // Find first step in same lane or any step
      const firstStep = stepNodes.find(s => s.lane === entry.lane) || stepNodes[0];
      if (firstStep) {
        edges.push({ from: entry.id, to: firstStep.id });
      }
    }
  }

  // Connect steps sequentially within each lane
  const laneSteps = {};
  for (const step of stepNodes) {
    if (!laneSteps[step.lane]) laneSteps[step.lane] = [];
    laneSteps[step.lane].push(step);
  }

  for (const [lane, steps] of Object.entries(laneSteps)) {
    for (let i = 0; i < steps.length - 1; i++) {
      edges.push({ from: steps[i].id, to: steps[i + 1].id });
    }
  }

  // Connect last steps to end states
  for (const [lane, steps] of Object.entries(laneSteps)) {
    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      const successEnd = endStates.find(e => e.id.includes('SUCCESS'));
      if (successEnd) {
        edges.push({ from: lastStep.id, to: successEnd.id });
      }
    }
  }

  // Add decision branches (ensure ≥2 outgoing edges)
  for (const decision of decisionNodes) {
    const existingOutgoing = edges.filter(e => e.from === decision.id);
    if (existingOutgoing.length < 2) {
      // Find next steps to connect to
      const idx = nodes.findIndex(n => n.id === decision.id);
      const nextStep = stepNodes.find((s, i) => {
        const sIdx = nodes.findIndex(n => n.id === s.id);
        return sIdx > idx;
      });

      if (nextStep && existingOutgoing.length === 0) {
        edges.push({ from: decision.id, to: nextStep.id, label: 'Yes' });
      }

      // Add No branch to exit or error
      const errorEnd = endStates.find(e => e.id.includes('ERROR'));
      const exitEnd = endStates.find(e => e.id.includes('EXIT'));
      if (existingOutgoing.length < 2) {
        edges.push({
          from: decision.id,
          to: errorEnd?.id || exitEnd?.id || endStates[0]?.id,
          label: 'No'
        });
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

  // Filter steps and decisions for this flow group
  const flowSteps = flowGroup
    ? flowSpec.steps.filter(s => s.flowGroup === flowGroup.id)
    : flowSpec.steps.filter(s => !s.flowGroup);

  const flowDecisions = flowGroup
    ? flowSpec.decisions.filter(d => d.flowGroup === flowGroup.id)
    : flowSpec.decisions.filter(d => !d.flowGroup);

  const flowEdges = flowGroup
    ? flowSpec.edges.filter(e => e.flowGroup === flowGroup.id)
    : flowSpec.edges.filter(e => !e.flowGroup);

  const hasExplicit = flowEdges.length > 0;

  // Build nodes
  const nodes = [];
  const nodeMap = new Map();

  // Identify entry points
  const entryPoints = identifyEntryPoints(flowSteps, flowDecisions, flowSpec, flowId, lanes);

  // Add start nodes
  for (const entry of entryPoints) {
    const node = {
      id: entry.id,
      type: 'start',
      lane: entry.lane,
      label: entry.label,
      flowGroup: flowId
    };
    nodes.push(node);
    nodeMap.set(entry.id, node);
  }

  // Process steps
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

  // Process decisions
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

    // Convert step text that looks like decisions
    if (isDecisionText(decision.question)) {
      node.branches = parseDecisionBranches(decision.question);
    }
  }

  // Infer system steps
  const systemSteps = inferSystemSteps(flowSpec, flowSteps, flowId);
  for (const sys of systemSteps) {
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

  // Identify end states
  const endStates = identifyEndStates(flowSpec, flowSteps, flowId);

  // Add end nodes
  for (const end of endStates) {
    const node = {
      id: end.id,
      type: 'end',
      lane: end.lane,
      label: end.label,
      flowGroup: flowId
    };
    nodes.push(node);
    nodeMap.set(end.id, node);
  }

  // Build edges
  let edges = [];

  if (hasExplicit) {
    // Use explicit edges only
    edges = flowEdges.map(e => ({
      from: e.from,
      to: e.to,
      label: e.label,
      condition: e.condition,
      flowGroup: flowId
    }));
  } else {
    // Auto-generate sequential edges
    edges = generateSequentialEdges(nodes, entryPoints, endStates, flowDecisions);
    edges = edges.map(e => ({ ...e, flowGroup: flowId }));
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
    addSystemSteps = true
  } = options;

  // Extract metadata
  const projectName = flowSpec.context?.find(c => c.toLowerCase().includes('project'))?.split(':')[1]?.trim() || 'BluePrints';
  const feature = flowSpec.goals?.[0] || featureName;

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
    starts: [],
    ends: [],
    nodes: [],
    edges: [],
    assumptions: [],
    openQuestions: flowSpec.questions || [],
    risks: flowSpec.risks || []
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

  // Add assumptions
  flowGraph.assumptions = [
    `SpecKit v${SPECKIT_VERSION} expansion`,
    `${flowGraph.flows.length} flow group(s) identified`,
    `${lanes.length} swimlanes: ${lanes.join(', ')}`,
    `${flowGraph.starts.length} entry point(s)`,
    `${flowGraph.ends.length} end state(s)`,
    hasExplicitEdges(flowSpec) ? 'Explicit edges used' : 'Sequential edges auto-generated',
    addSystemSteps ? 'System steps inferred from requirements' : 'System step inference disabled'
  ];

  // Add inferred system step assumption
  const inferredCount = flowGraph.nodes.filter(n => n.inferred).length;
  if (inferredCount > 0) {
    flowGraph.assumptions.push(`${inferredCount} system step(s) inferred`);
  }

  return flowGraph;
}

// ============================================================================
// Export
// ============================================================================

export default expandFlowGraph;
