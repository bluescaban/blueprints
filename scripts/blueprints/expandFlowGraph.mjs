/**
 * expandFlowGraph.mjs
 *
 * SpecKit-style FlowGraph Expander
 *
 * Takes a FlowSpec JSON and expands it into a complete, render-ready
 * FlowGraph with:
 * - Multiple entry points
 * - Branching decisions
 * - Swimlanes (actors)
 * - System steps
 * - Explicit edges
 * - End states
 *
 * @module expandFlowGraph
 */

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
 */

/**
 * @typedef {Object} FlowEdge
 * @property {string} from - Source node ID
 * @property {string} to - Target node ID
 * @property {string} [label] - Edge label (Yes/No/condition)
 * @property {string} [condition] - Condition expression
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
 * @property {string[]} lanes - Swimlane names in order
 * @property {string[]} starts - Entry point node IDs
 * @property {string[]} ends - End state node IDs
 * @property {FlowNode[]} nodes - All nodes
 * @property {FlowEdge[]} edges - All edges
 * @property {string[]} assumptions - Assumptions made during expansion
 * @property {string[]} openQuestions - Unresolved questions
 * @property {string[]} risks - Identified risks
 */

// ============================================================================
// Constants
// ============================================================================

export const SPECKIT_VERSION = '1.0.0';

// Default lanes if not inferable
const DEFAULT_LANES = ['User', 'System'];

// Keywords for lane inference
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID with prefix.
 *
 * @param {string} prefix - ID prefix
 * @param {number} index - Numeric index
 * @returns {string} Generated ID
 */
function genId(prefix, index) {
  return `${prefix}${index}`;
}

/**
 * Infer lane from step text.
 *
 * @param {string} text - Step text
 * @param {string[]} personas - Available persona names
 * @returns {string} Inferred lane name
 */
function inferLane(text, personas) {
  const lower = text.toLowerCase();

  // Check for persona names first
  for (const persona of personas) {
    const personaLower = persona.toLowerCase();
    if (lower.includes(personaLower)) {
      // Map common persona patterns to lanes
      if (personaLower.includes('host')) return 'Host';
      if (personaLower.includes('participant') || personaLower.includes('friend')) return 'Guest';
      if (personaLower.includes('listener') || personaLower.includes('user')) return 'User';
    }
  }

  // Check for action keywords
  for (const [keyword, lane] of Object.entries(LANE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return lane;
    }
  }

  // Default based on sentence structure
  if (lower.startsWith('user ') || lower.startsWith('users ')) return 'User';
  if (lower.startsWith('app ') || lower.startsWith('system ')) return 'System';
  if (lower.startsWith('host ')) return 'Host';
  if (lower.startsWith('friend ') || lower.startsWith('participant')) return 'Guest';

  return 'User'; // Default
}

/**
 * Detect if step text implies a decision point.
 *
 * @param {string} text - Step text
 * @returns {boolean} True if this looks like a decision
 */
function isDecisionText(text) {
  const lower = text.toLowerCase();
  return (
    lower.startsWith('if ') ||
    lower.includes('? ') ||
    lower.includes(' or ') ||
    lower.includes('choose') ||
    lower.includes('select') ||
    lower.includes('decision')
  );
}

/**
 * Parse decision branches from text like "If X, then Y"
 *
 * @param {string} text - Decision text
 * @returns {{condition: string, ifTrue: string, ifFalse: string}|null}
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

  return null;
}

/**
 * Extract edge cases from notes.
 *
 * @param {string[]} notes - FlowSpec notes
 * @returns {{edgeCases: string[], context: Object}}
 */
function parseNotesForEdgeCases(notes) {
  const edgeCases = [];
  const context = {};

  for (const note of notes) {
    // Parse edge cases
    if (note.startsWith('[Unparsed E:]')) {
      const caseText = note.replace('[Unparsed E:]', '').trim();
      edgeCases.push(caseText);
    }
    // Parse context
    else if (note.includes(':') && !note.startsWith('CONTEXT')) {
      const [key, ...valueParts] = note.split(':');
      const value = valueParts.join(':').trim();
      if (key && value) {
        context[key.trim().toLowerCase()] = value;
      }
    }
  }

  return { edgeCases, context };
}

// ============================================================================
// Main Expansion Function
// ============================================================================

/**
 * Expand a FlowSpec into a complete FlowGraph.
 *
 * @param {import('./parseCards.mjs').FlowSpec} flowSpec - Input FlowSpec
 * @param {Object} [options] - Expansion options
 * @param {string} [options.featureName] - Override feature name
 * @param {boolean} [options.addSystemSteps=true] - Add inferred system steps
 * @param {boolean} [options.addEdgeCases=true] - Include edge case handling
 * @returns {FlowGraph} Expanded FlowGraph
 */
export function expandFlowGraph(flowSpec, options = {}) {
  const {
    featureName = 'Feature',
    addSystemSteps = true,
    addEdgeCases = true
  } = options;

  // Extract context from notes
  const { edgeCases, context } = parseNotesForEdgeCases(flowSpec.notes || []);
  const projectName = context.project || 'BluePrints';
  const feature = context.goal || featureName;

  // Determine lanes from personas
  const personaNames = (flowSpec.personas || []).map(p => p.name);
  const lanes = inferLanesFromPersonas(personaNames);

  // Initialize FlowGraph
  /** @type {FlowGraph} */
  const flowGraph = {
    meta: {
      project: projectName,
      feature: feature,
      generatedAt: new Date().toISOString(),
      sourceFileKey: flowSpec.meta?.fileKey || 'unknown',
      specKitVersion: SPECKIT_VERSION
    },
    lanes: lanes,
    starts: [],
    ends: [],
    nodes: [],
    edges: [],
    assumptions: [],
    openQuestions: flowSpec.questions || [],
    risks: flowSpec.risks || []
  };

  // Track node IDs
  let stepCounter = 1;
  let decisionCounter = 1;
  let systemCounter = 1;

  // ---- Phase 1: Analyze steps and create decision points ----

  const stepNodes = [];
  const decisionPoints = [];

  for (const step of flowSpec.steps || []) {
    const text = step.text;
    const lane = inferLane(text, personaNames);

    // Check if this is actually a decision
    if (isDecisionText(text)) {
      const branches = parseDecisionBranches(text);

      decisionPoints.push({
        id: genId('D', decisionCounter++),
        type: 'decision',
        lane: lane,
        label: branches?.condition || text.replace(/^if\s+/i, '').split(',')[0],
        branches: branches,
        originalText: text
      });
    } else {
      stepNodes.push({
        id: step.id || genId('S', stepCounter++),
        type: 'step',
        lane: lane,
        label: text,
        originalStep: step
      });
    }
  }

  // ---- Phase 2: Identify entry points ----

  // Look for multiple entry scenarios
  const entryPoints = identifyEntryPoints(stepNodes, decisionPoints, flowSpec);

  for (const entry of entryPoints) {
    flowGraph.starts.push(entry.id);
    flowGraph.nodes.push({
      id: entry.id,
      type: 'start',
      lane: entry.lane,
      label: entry.label
    });
  }

  // ---- Phase 3: Add main flow nodes ----

  // Add step nodes
  for (const step of stepNodes) {
    flowGraph.nodes.push({
      id: step.id,
      type: 'step',
      lane: step.lane,
      label: step.label
    });
  }

  // Add decision nodes
  for (const decision of decisionPoints) {
    flowGraph.nodes.push({
      id: decision.id,
      type: 'decision',
      lane: decision.lane,
      label: decision.label
    });
  }

  // ---- Phase 4: Add system steps ----

  if (addSystemSteps) {
    const systemSteps = inferSystemSteps(flowSpec, stepNodes);

    for (const sys of systemSteps) {
      const sysId = genId('SYS', systemCounter++);
      flowGraph.nodes.push({
        id: sysId,
        type: 'system',
        lane: 'System',
        label: sys.label
      });

      // Add edge from trigger to system step
      if (sys.after) {
        flowGraph.edges.push({
          from: sys.after,
          to: sysId
        });
      }

      // Add edge from system step to next
      if (sys.before) {
        flowGraph.edges.push({
          from: sysId,
          to: sys.before
        });
      }
    }
  }

  // ---- Phase 5: Add end states ----

  const endStates = identifyEndStates(flowSpec, stepNodes);

  for (const end of endStates) {
    flowGraph.ends.push(end.id);
    flowGraph.nodes.push({
      id: end.id,
      type: 'end',
      lane: end.lane || 'System',
      label: end.label
    });
  }

  // ---- Phase 6: Build edge connections ----

  // Use explicit edges from FlowSpec if available
  if (flowSpec.edges && flowSpec.edges.length > 0) {
    for (const edge of flowSpec.edges) {
      flowGraph.edges.push({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        condition: edge.condition
      });
    }
  } else {
    // Auto-generate sequential edges
    flowGraph.edges.push(...generateSequentialEdges(flowGraph, entryPoints, endStates, decisionPoints));
  }

  // ---- Phase 7: Add decision branches ----

  for (const decision of decisionPoints) {
    if (decision.branches) {
      // Find or create target nodes for branches
      const yesTarget = findOrCreateBranchTarget(decision.branches.ifTrue, flowGraph, stepNodes);
      const noTarget = decision.branches.ifFalse
        ? findOrCreateBranchTarget(decision.branches.ifFalse, flowGraph, stepNodes)
        : null;

      if (yesTarget) {
        flowGraph.edges.push({
          from: decision.id,
          to: yesTarget,
          label: 'Yes'
        });
      }

      if (noTarget) {
        flowGraph.edges.push({
          from: decision.id,
          to: noTarget,
          label: 'No'
        });
      }
    }
  }

  // ---- Phase 8: Add edge case handling nodes (optional) ----

  if (addEdgeCases && edgeCases.length > 0) {
    let edgeCaseCounter = 1;

    for (const caseText of edgeCases.slice(0, 5)) { // Limit to avoid clutter
      const ecId = genId('EC', edgeCaseCounter++);
      flowGraph.nodes.push({
        id: ecId,
        type: 'system',
        lane: 'System',
        label: `Handle: ${truncate(caseText, 40)}`
      });

      // Add to assumptions
      flowGraph.assumptions.push(`Edge case handling: ${caseText}`);
    }
  }

  // ---- Phase 9: Add assumptions ----

  flowGraph.assumptions.push(
    'Sequential flow assumed where explicit edges not provided',
    'Lane assignment inferred from step text keywords',
    `${entryPoints.length} entry point(s) identified from flow analysis`
  );

  return flowGraph;
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Infer lanes from persona names.
 *
 * @param {string[]} personaNames
 * @returns {string[]}
 */
function inferLanesFromPersonas(personaNames) {
  const lanes = new Set(['System']); // Always include System

  for (const name of personaNames) {
    const lower = name.toLowerCase();

    if (lower.includes('host')) {
      lanes.add('Host');
    } else if (lower.includes('participant') || lower.includes('friend') || lower.includes('guest')) {
      lanes.add('Guest');
    } else if (lower.includes('user') || lower.includes('listener')) {
      lanes.add('User');
    }
  }

  // Ensure we have at least User lane
  if (lanes.size === 1) {
    lanes.add('User');
  }

  // Return in logical order
  const order = ['User', 'Host', 'Guest', 'System'];
  return order.filter(l => lanes.has(l));
}

/**
 * Identify entry points from flow analysis.
 *
 * @param {Object[]} stepNodes
 * @param {Object[]} decisionPoints
 * @param {Object} flowSpec
 * @returns {Object[]}
 */
function identifyEntryPoints(stepNodes, decisionPoints, flowSpec) {
  const entries = [];

  // Look for mode selection decision
  const modeDecision = decisionPoints.find(d =>
    d.originalText?.toLowerCase().includes('solo') ||
    d.originalText?.toLowerCase().includes('with friends')
  );

  if (modeDecision) {
    // Create separate entry points for each mode
    entries.push({
      id: 'START_SOLO',
      lane: 'User',
      label: 'Start Solo Karaoke'
    });
    entries.push({
      id: 'START_HOST',
      lane: 'Host',
      label: 'Host With Friends'
    });
    entries.push({
      id: 'START_JOIN',
      lane: 'Guest',
      label: 'Join via Invite Link'
    });
  } else if (stepNodes.length > 0) {
    // Default: first step is entry
    entries.push({
      id: 'START',
      lane: stepNodes[0].lane,
      label: 'Start'
    });
  }

  return entries;
}

/**
 * Identify end states from flow analysis.
 *
 * @param {Object} flowSpec
 * @param {Object[]} stepNodes
 * @returns {Object[]}
 */
function identifyEndStates(flowSpec, stepNodes) {
  const ends = [];

  // Always add success end
  ends.push({
    id: 'END_SUCCESS',
    lane: 'System',
    label: 'Session Complete'
  });

  // Add exit end (user can leave anytime)
  ends.push({
    id: 'END_EXIT',
    lane: 'User',
    label: 'User Left'
  });

  // Check for error scenarios in requirements
  const hasErrorHandling = (flowSpec.requirements?.functional || []).some(r =>
    r.toLowerCase().includes('error') ||
    r.toLowerCase().includes('denied') ||
    r.toLowerCase().includes('fail')
  );

  if (hasErrorHandling) {
    ends.push({
      id: 'END_ERROR',
      lane: 'System',
      label: 'Error / Recovery'
    });
  }

  return ends;
}

/**
 * Infer system steps that should exist.
 *
 * @param {Object} flowSpec
 * @param {Object[]} stepNodes
 * @returns {Object[]}
 */
function inferSystemSteps(flowSpec, stepNodes) {
  const systemSteps = [];

  // Look for requirements that imply system steps
  const requirements = flowSpec.requirements?.functional || [];

  for (const req of requirements) {
    const lower = req.toLowerCase();

    if (lower.includes('permission') && !systemSteps.find(s => s.label.includes('Permission'))) {
      systemSteps.push({
        label: 'Request Microphone Permission',
        after: null,
        before: null
      });
    }

    if (lower.includes('lobby') && !systemSteps.find(s => s.label.includes('Lobby'))) {
      systemSteps.push({
        label: 'Create Session Lobby',
        after: null,
        before: null
      });
    }

    if (lower.includes('sync') && !systemSteps.find(s => s.label.includes('Sync'))) {
      systemSteps.push({
        label: 'Sync Lyrics with Playback',
        after: null,
        before: null
      });
    }
  }

  return systemSteps;
}

/**
 * Generate sequential edges when none are explicit.
 *
 * @param {FlowGraph} flowGraph
 * @param {Object[]} entryPoints
 * @param {Object[]} endStates
 * @param {Object[]} decisionPoints
 * @returns {FlowEdge[]}
 */
function generateSequentialEdges(flowGraph, entryPoints, endStates, decisionPoints) {
  const edges = [];

  // Get step nodes in order
  const stepNodes = flowGraph.nodes.filter(n => n.type === 'step');

  if (stepNodes.length === 0) return edges;

  // Connect first entry to first step
  if (entryPoints.length > 0) {
    edges.push({
      from: entryPoints[0].id,
      to: stepNodes[0].id
    });

    // If multiple entries, connect them appropriately
    if (entryPoints.length > 1) {
      // Find steps that match entry context
      for (let i = 1; i < entryPoints.length; i++) {
        const entry = entryPoints[i];
        const matchingStep = stepNodes.find(s =>
          s.label.toLowerCase().includes(entry.label.toLowerCase().split(' ')[0])
        );
        if (matchingStep) {
          edges.push({ from: entry.id, to: matchingStep.id });
        } else {
          edges.push({ from: entry.id, to: stepNodes[0].id });
        }
      }
    }
  }

  // Connect steps sequentially
  for (let i = 0; i < stepNodes.length - 1; i++) {
    edges.push({
      from: stepNodes[i].id,
      to: stepNodes[i + 1].id
    });
  }

  // Connect last step to success end
  if (stepNodes.length > 0 && endStates.length > 0) {
    const successEnd = endStates.find(e => e.id.includes('SUCCESS'));
    if (successEnd) {
      edges.push({
        from: stepNodes[stepNodes.length - 1].id,
        to: successEnd.id
      });
    }
  }

  return edges;
}

/**
 * Find or create a node for a branch target.
 *
 * @param {string} targetText
 * @param {FlowGraph} flowGraph
 * @param {Object[]} stepNodes
 * @returns {string|null}
 */
function findOrCreateBranchTarget(targetText, flowGraph, stepNodes) {
  if (!targetText) return null;

  const lower = targetText.toLowerCase();

  // Look for existing node that matches
  for (const node of flowGraph.nodes) {
    if (node.label.toLowerCase().includes(lower.substring(0, 20))) {
      return node.id;
    }
  }

  // Look in step nodes
  for (const step of stepNodes) {
    if (step.label.toLowerCase().includes(lower.substring(0, 20))) {
      return step.id;
    }
  }

  return null;
}

/**
 * Truncate text.
 *
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function truncate(text, max) {
  return text.length > max ? text.substring(0, max - 3) + '...' : text;
}

// ============================================================================
// Export for CLI
// ============================================================================

export default expandFlowGraph;
