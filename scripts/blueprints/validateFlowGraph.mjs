/**
 * validateFlowGraph.mjs
 *
 * FlowGraph Validation & Quality Gates v1.0
 *
 * Validates a FlowGraph and fails generation if:
 * - Any edge references a missing node
 * - A decision node has fewer than 2 outgoing edges
 * - A flow has no start or no end
 * - There are disconnected nodes (unless explicitly marked)
 * - System lane has zero nodes
 *
 * All validation errors are explicit and actionable.
 *
 * @module validateFlowGraph
 */

// ============================================================================
// Constants
// ============================================================================

export const VALIDATOR_VERSION = '1.0.0';

/**
 * @typedef {'error'|'warning'} ValidationSeverity
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {ValidationSeverity} severity - Issue severity
 * @property {string} code - Unique error code
 * @property {string} message - Human-readable message
 * @property {string} [nodeId] - Related node ID
 * @property {string} [edgeId] - Related edge ID (from->to)
 * @property {string} [flowId] - Related flow group ID
 * @property {string} [suggestion] - Actionable fix suggestion
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {ValidationIssue[]} errors - Critical errors (fail generation)
 * @property {ValidationIssue[]} warnings - Non-critical warnings
 * @property {Object} stats - Validation statistics
 */

// Error codes per BluePrints DSL v2.0
const ERROR_CODES = {
  MISSING_NODE_REF: 'E001',
  DECISION_INSUFFICIENT_EDGES: 'E002',
  FLOW_NO_START: 'E003',
  FLOW_NO_END: 'E004',
  DISCONNECTED_NODE: 'E005',
  EMPTY_SYSTEM_LANE: 'E006',
  ORPHAN_START: 'E007',
  ORPHAN_END: 'E008',
  SELF_LOOP: 'E009',
  DUPLICATE_EDGE: 'E010',
  FLOW_NO_EXIT: 'E011',       // New: must have EXIT or END_ERROR
  MISSING_AC_DECISION: 'E012', // New: decision without AC
  MISSING_AC_EXIT: 'E013',     // New: exit without AC
};

const WARNING_CODES = {
  SINGLE_ENTRY: 'W001',
  NO_EXPLICIT_EDGES: 'W002',
  LONG_LABEL: 'W003',
  EMPTY_FLOW_GROUP: 'W004',
  INFERRED_HEAVY: 'W005',
  MISSING_AC_START: 'W006',   // New: start without AC
  NO_EXPLICIT_STARTS: 'W007', // New: no START: nodes
  NO_EXPLICIT_ENDS: 'W008',   // New: no END: nodes
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check for edges referencing missing nodes.
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateEdgeReferences(flowGraph) {
  const issues = [];
  const nodeIds = new Set(flowGraph.nodes.map(n => n.id));

  for (const edge of flowGraph.edges) {
    if (!nodeIds.has(edge.from)) {
      issues.push({
        severity: 'error',
        code: ERROR_CODES.MISSING_NODE_REF,
        message: `Edge references missing source node: "${edge.from}"`,
        edgeId: `${edge.from}->${edge.to}`,
        flowId: edge.flowGroup,
        suggestion: `Add a node with id="${edge.from}" or correct the edge source`
      });
    }

    if (!nodeIds.has(edge.to)) {
      issues.push({
        severity: 'error',
        code: ERROR_CODES.MISSING_NODE_REF,
        message: `Edge references missing target node: "${edge.to}"`,
        edgeId: `${edge.from}->${edge.to}`,
        flowId: edge.flowGroup,
        suggestion: `Add a node with id="${edge.to}" or correct the edge target`
      });
    }
  }

  return issues;
}

/**
 * Check that decision nodes have at least 2 outgoing edges.
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateDecisionEdges(flowGraph) {
  const issues = [];
  const decisionNodes = flowGraph.nodes.filter(n => n.type === 'decision');

  // Count outgoing edges per node
  const outgoingCount = new Map();
  for (const edge of flowGraph.edges) {
    outgoingCount.set(edge.from, (outgoingCount.get(edge.from) || 0) + 1);
  }

  for (const decision of decisionNodes) {
    const count = outgoingCount.get(decision.id) || 0;
    if (count < 2) {
      issues.push({
        severity: 'error',
        code: ERROR_CODES.DECISION_INSUFFICIENT_EDGES,
        message: `Decision node "${decision.id}" has ${count} outgoing edge(s), requires ≥2`,
        nodeId: decision.id,
        flowId: decision.flowGroup,
        suggestion: `Add Yes/No branches using E: ${decision.id} -> target_node or define D: with yes/no outcomes`
      });
    }
  }

  return issues;
}

/**
 * Check that each flow has at least one start and one end node.
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateFlowStartEnd(flowGraph) {
  const issues = [];

  for (const flow of flowGraph.flows) {
    const flowNodes = flow.nodes || [];
    const startNodes = flowNodes.filter(n => n.type === 'start');
    const endNodes = flowNodes.filter(n => n.type === 'end');

    if (startNodes.length === 0) {
      issues.push({
        severity: 'error',
        code: ERROR_CODES.FLOW_NO_START,
        message: `Flow "${flow.name}" (${flow.id}) has no start node`,
        flowId: flow.id,
        suggestion: `Add a start step using S: [Start] description or ensure flow has entry point steps`
      });
    }

    if (endNodes.length === 0) {
      issues.push({
        severity: 'error',
        code: ERROR_CODES.FLOW_NO_END,
        message: `Flow "${flow.name}" (${flow.id}) has no end node`,
        flowId: flow.id,
        suggestion: `Add an end step using S: [End] description or ensure flow has terminal steps`
      });
    }
  }

  // Also check global
  if (flowGraph.starts.length === 0 && flowGraph.flows.length === 0) {
    issues.push({
      severity: 'error',
      code: ERROR_CODES.FLOW_NO_START,
      message: 'FlowGraph has no start nodes',
      suggestion: 'Add at least one step to create an entry point'
    });
  }

  if (flowGraph.ends.length === 0 && flowGraph.flows.length === 0) {
    issues.push({
      severity: 'error',
      code: ERROR_CODES.FLOW_NO_END,
      message: 'FlowGraph has no end nodes',
      suggestion: 'Add terminal steps or ensure flow reaches completion'
    });
  }

  return issues;
}

/**
 * Check for disconnected nodes (no incoming or outgoing edges).
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateConnectivity(flowGraph) {
  const issues = [];

  const nodeIds = new Set(flowGraph.nodes.map(n => n.id));
  const hasIncoming = new Set();
  const hasOutgoing = new Set();

  for (const edge of flowGraph.edges) {
    hasOutgoing.add(edge.from);
    hasIncoming.add(edge.to);
  }

  for (const node of flowGraph.nodes) {
    // Skip start nodes (no incoming expected)
    if (node.type === 'start') {
      if (!hasOutgoing.has(node.id)) {
        issues.push({
          severity: 'error',
          code: ERROR_CODES.ORPHAN_START,
          message: `Start node "${node.id}" has no outgoing edges`,
          nodeId: node.id,
          flowId: node.flowGroup,
          suggestion: `Connect start node to first step using E: ${node.id} -> next_step`
        });
      }
      continue;
    }

    // Skip end nodes (no outgoing expected)
    if (node.type === 'end') {
      if (!hasIncoming.has(node.id)) {
        issues.push({
          severity: 'error',
          code: ERROR_CODES.ORPHAN_END,
          message: `End node "${node.id}" has no incoming edges`,
          nodeId: node.id,
          flowId: node.flowGroup,
          suggestion: `Connect a step to end node using E: last_step -> ${node.id}`
        });
      }
      continue;
    }

    // Check for completely disconnected nodes
    const isDisconnected = !hasIncoming.has(node.id) && !hasOutgoing.has(node.id);
    const isPartiallyDisconnected = !hasIncoming.has(node.id) || !hasOutgoing.has(node.id);

    // Allow explicitly marked disconnected nodes
    if (node.disconnected === true) {
      continue;
    }

    if (isDisconnected) {
      issues.push({
        severity: 'error',
        code: ERROR_CODES.DISCONNECTED_NODE,
        message: `Node "${node.id}" is completely disconnected (no edges)`,
        nodeId: node.id,
        flowId: node.flowGroup,
        suggestion: `Connect node using E: edges or mark as disconnected: true if intentional`
      });
    } else if (isPartiallyDisconnected && node.type !== 'system') {
      // System nodes may legitimately be leaf nodes
      const direction = !hasIncoming.has(node.id) ? 'incoming' : 'outgoing';
      issues.push({
        severity: 'warning',
        code: WARNING_CODES.SINGLE_ENTRY,
        message: `Node "${node.id}" has no ${direction} edges`,
        nodeId: node.id,
        flowId: node.flowGroup,
        suggestion: `Consider adding ${direction} edges or mark as intentional`
      });
    }
  }

  return issues;
}

/**
 * Check that System lane has at least one node.
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateSystemLane(flowGraph) {
  const issues = [];

  // Only check if System is in lanes
  if (!flowGraph.lanes.includes('System')) {
    return issues;
  }

  const systemNodes = flowGraph.nodes.filter(n => n.lane === 'System' || n.type === 'system');

  if (systemNodes.length === 0) {
    issues.push({
      severity: 'error',
      code: ERROR_CODES.EMPTY_SYSTEM_LANE,
      message: 'System lane is declared but has no nodes',
      suggestion: 'Add system steps using S: System: description or remove System from lanes'
    });
  }

  return issues;
}

/**
 * Check for self-loops (edge from node to itself).
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateSelfLoops(flowGraph) {
  const issues = [];

  for (const edge of flowGraph.edges) {
    if (edge.from === edge.to) {
      issues.push({
        severity: 'error',
        code: ERROR_CODES.SELF_LOOP,
        message: `Self-loop detected: "${edge.from}" -> "${edge.to}"`,
        edgeId: `${edge.from}->${edge.to}`,
        flowId: edge.flowGroup,
        suggestion: 'Remove the self-referencing edge or correct the target'
      });
    }
  }

  return issues;
}

/**
 * Check for duplicate edges.
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateDuplicateEdges(flowGraph) {
  const issues = [];
  const seen = new Map();

  for (const edge of flowGraph.edges) {
    const key = `${edge.from}->${edge.to}`;
    if (seen.has(key)) {
      issues.push({
        severity: 'warning',
        code: ERROR_CODES.DUPLICATE_EDGE,
        message: `Duplicate edge: "${edge.from}" -> "${edge.to}"`,
        edgeId: key,
        flowId: edge.flowGroup,
        suggestion: 'Remove duplicate edge definition'
      });
    } else {
      seen.set(key, true);
    }
  }

  return issues;
}

/**
 * Check that flows have proper exit handling (EXIT or END_ERROR).
 * Per DSL v2.0: "Every flow must include at least one EXIT or END_ERROR"
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateExitHandling(flowGraph) {
  const issues = [];

  // Check for exit nodes or error end states
  const exitNodes = flowGraph.nodes.filter(n =>
    n.type === 'exit' ||
    n.isExit === true ||
    (n.type === 'end' && (
      n.label?.toLowerCase().includes('error') ||
      n.label?.toLowerCase().includes('exit') ||
      n.id?.toLowerCase().includes('error') ||
      n.id?.toLowerCase().includes('exit')
    ))
  );

  if (exitNodes.length === 0) {
    issues.push({
      severity: 'warning', // Warning since it can be inferred
      code: WARNING_CODES.NO_EXPLICIT_ENDS,
      message: 'No explicit exit or error handling nodes found',
      suggestion: 'Add EXIT: or END: nodes for early exits and error states'
    });
  }

  return issues;
}

/**
 * Check for explicit start/end node usage.
 * Per DSL v2.0: explicit START/END/EXIT is preferred.
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function validateExplicitNodes(flowGraph) {
  const warnings = [];

  // Check if start nodes are inferred
  const startNodes = flowGraph.nodes.filter(n => n.type === 'start');
  const inferredStarts = startNodes.filter(n => n.inferred);

  if (startNodes.length > 0 && inferredStarts.length === startNodes.length) {
    warnings.push({
      severity: 'warning',
      code: WARNING_CODES.NO_EXPLICIT_STARTS,
      message: 'All start nodes are inferred (no explicit START: definitions)',
      suggestion: 'Consider adding explicit START: nodes to your FigJam'
    });
  }

  // Check if end nodes are inferred
  const endNodes = flowGraph.nodes.filter(n => n.type === 'end' || n.type === 'exit');
  const inferredEnds = endNodes.filter(n => n.inferred);

  if (endNodes.length > 0 && inferredEnds.length === endNodes.length) {
    warnings.push({
      severity: 'warning',
      code: WARNING_CODES.NO_EXPLICIT_ENDS,
      message: 'All end nodes are inferred (no explicit END:/EXIT: definitions)',
      suggestion: 'Consider adding explicit END: and EXIT: nodes to your FigJam'
    });
  }

  return warnings;
}

/**
 * Check for quality warnings.
 * @param {Object} flowGraph
 * @returns {ValidationIssue[]}
 */
function checkQualityWarnings(flowGraph) {
  const warnings = [];

  // Check for long labels
  const MAX_LABEL_LENGTH = 100;
  for (const node of flowGraph.nodes) {
    if (node.label && node.label.length > MAX_LABEL_LENGTH) {
      warnings.push({
        severity: 'warning',
        code: WARNING_CODES.LONG_LABEL,
        message: `Node "${node.id}" has a long label (${node.label.length} chars)`,
        nodeId: node.id,
        suggestion: `Consider shortening to under ${MAX_LABEL_LENGTH} characters`
      });
    }
  }

  // Check for empty flow groups
  for (const flow of flowGraph.flows || []) {
    if ((flow.nodes?.length || 0) === 0) {
      warnings.push({
        severity: 'warning',
        code: WARNING_CODES.EMPTY_FLOW_GROUP,
        message: `Flow group "${flow.name}" (${flow.id}) has no nodes`,
        flowId: flow.id,
        suggestion: 'Add steps to the flow group or remove it'
      });
    }
  }

  // Check for heavy inference
  const inferredCount = flowGraph.nodes.filter(n => n.inferred).length;
  const totalCount = flowGraph.nodes.length;
  if (totalCount > 0 && inferredCount / totalCount > 0.5) {
    warnings.push({
      severity: 'warning',
      code: WARNING_CODES.INFERRED_HEAVY,
      message: `${inferredCount}/${totalCount} nodes are inferred (>50%)`,
      suggestion: 'Consider adding more explicit steps using the BluePrints DSL'
    });
  }

  // Check AC coverage for decisions
  const decisionNodes = flowGraph.nodes.filter(n => n.type === 'decision');
  const acceptanceCriteria = flowGraph.acceptanceCriteria || [];

  if (decisionNodes.length > 0 && acceptanceCriteria.length === 0) {
    warnings.push({
      severity: 'warning',
      code: WARNING_CODES.MISSING_AC_START,
      message: `${decisionNodes.length} decision node(s) have no acceptance criteria`,
      suggestion: 'Add AC: criteria for each decision outcome'
    });
  }

  return warnings;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a FlowGraph and return validation result.
 *
 * @param {Object} flowGraph - The FlowGraph to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.strict=true] - Fail on any error
 * @param {boolean} [options.allowDisconnected=false] - Allow disconnected nodes
 * @param {boolean} [options.allowEmptySystem=false] - Allow empty System lane
 * @returns {ValidationResult}
 */
export function validateFlowGraph(flowGraph, options = {}) {
  const {
    strict = true,
    allowDisconnected = false,
    allowEmptySystem = false
  } = options;

  const errors = [];
  const warnings = [];

  // Run all validation checks
  errors.push(...validateEdgeReferences(flowGraph));
  errors.push(...validateDecisionEdges(flowGraph));
  errors.push(...validateFlowStartEnd(flowGraph));
  errors.push(...validateSelfLoops(flowGraph));

  // Conditional checks
  if (!allowDisconnected) {
    const connectivityIssues = validateConnectivity(flowGraph);
    for (const issue of connectivityIssues) {
      if (issue.severity === 'error') {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  if (!allowEmptySystem) {
    errors.push(...validateSystemLane(flowGraph));
  }

  // Quality warnings
  warnings.push(...validateDuplicateEdges(flowGraph));
  warnings.push(...checkQualityWarnings(flowGraph));
  warnings.push(...validateExitHandling(flowGraph));
  warnings.push(...validateExplicitNodes(flowGraph));

  // Build stats
  const stats = {
    totalNodes: flowGraph.nodes.length,
    totalEdges: flowGraph.edges.length,
    totalFlows: flowGraph.flows.length,
    nodesByType: {},
    nodesByLane: {},
    errorCount: errors.length,
    warningCount: warnings.length
  };

  // Count by type
  for (const node of flowGraph.nodes) {
    stats.nodesByType[node.type] = (stats.nodesByType[node.type] || 0) + 1;
    stats.nodesByLane[node.lane] = (stats.nodesByLane[node.lane] || 0) + 1;
  }

  const valid = strict ? errors.length === 0 : true;

  return {
    valid,
    errors,
    warnings,
    stats
  };
}

/**
 * Validate and throw if invalid.
 * Use this when you want validation to halt the pipeline.
 *
 * @param {Object} flowGraph - The FlowGraph to validate
 * @param {Object} [options] - Validation options
 * @throws {Error} If validation fails
 * @returns {ValidationResult}
 */
export function validateOrThrow(flowGraph, options = {}) {
  const result = validateFlowGraph(flowGraph, options);

  if (!result.valid) {
    const errorMessages = result.errors.map(e =>
      `[${e.code}] ${e.message}${e.suggestion ? ` → ${e.suggestion}` : ''}`
    ).join('\n');

    const error = new Error(
      `FlowGraph validation failed with ${result.errors.length} error(s):\n${errorMessages}`
    );
    error.name = 'FlowGraphValidationError';
    error.validationResult = result;
    throw error;
  }

  return result;
}

/**
 * Format validation result for human-readable output.
 *
 * @param {ValidationResult} result
 * @returns {string}
 */
export function formatValidationResult(result) {
  const lines = [];

  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push(`FlowGraph Validation Report (v${VALIDATOR_VERSION})`);
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');

  // Stats
  lines.push('📊 Statistics:');
  lines.push(`   Nodes: ${result.stats.totalNodes}`);
  lines.push(`   Edges: ${result.stats.totalEdges}`);
  lines.push(`   Flows: ${result.stats.totalFlows}`);
  lines.push(`   By Type: ${Object.entries(result.stats.nodesByType).map(([k, v]) => `${k}(${v})`).join(', ')}`);
  lines.push(`   By Lane: ${Object.entries(result.stats.nodesByLane).map(([k, v]) => `${k}(${v})`).join(', ')}`);
  lines.push('');

  // Status
  if (result.valid) {
    lines.push('✅ VALIDATION PASSED');
  } else {
    lines.push('❌ VALIDATION FAILED');
  }
  lines.push('');

  // Errors
  if (result.errors.length > 0) {
    lines.push(`🚨 Errors (${result.errors.length}):`);
    for (const err of result.errors) {
      lines.push(`   [${err.code}] ${err.message}`);
      if (err.nodeId) lines.push(`      Node: ${err.nodeId}`);
      if (err.edgeId) lines.push(`      Edge: ${err.edgeId}`);
      if (err.flowId) lines.push(`      Flow: ${err.flowId}`);
      if (err.suggestion) lines.push(`      💡 ${err.suggestion}`);
      lines.push('');
    }
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`⚠️  Warnings (${result.warnings.length}):`);
    for (const warn of result.warnings) {
      lines.push(`   [${warn.code}] ${warn.message}`);
      if (warn.suggestion) lines.push(`      💡 ${warn.suggestion}`);
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// ============================================================================
// Export
// ============================================================================

export default validateFlowGraph;
