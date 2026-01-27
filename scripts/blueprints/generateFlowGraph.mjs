#!/usr/bin/env node
/**
 * generateFlowGraph.mjs
 *
 * CLI script that expands a FlowSpec JSON into a complete FlowGraph.
 *
 * Usage:
 *   node scripts/blueprints/generateFlowGraph.mjs <path_to_flowspec_json>
 *
 * Output:
 *   - output/flowgraph/<fileKey>_flowgraph.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

import { expandFlowGraph, SPECKIT_VERSION } from './expandFlowGraph.mjs';

// ============================================================================
// Constants
// ============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

// ============================================================================
// Main CLI
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('BluePrints FlowGraph Expander (SpecKit)');
    console.log(`SpecKit Version: ${SPECKIT_VERSION}`);
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/blueprints/generateFlowGraph.mjs <path_to_flowspec_json>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/blueprints/generateFlowGraph.mjs output/flowspec/HYxtgE7EARWuvTskijY7xa_20260126_184358.json');
    console.log('');
    console.log('Output:');
    console.log('  - output/flowgraph/<fileKey>_flowgraph.json');
    process.exit(1);
  }

  const inputPath = args[0];

  console.log('BluePrints FlowGraph Expander');
  console.log(`SpecKit Version: ${SPECKIT_VERSION}`);
  console.log(`Input: ${inputPath}`);
  console.log('');

  try {
    // Read FlowSpec
    console.log('Reading FlowSpec...');
    const content = readFileSync(inputPath, 'utf8');
    const flowSpec = JSON.parse(content);

    console.log(`  File Key: ${flowSpec.meta?.fileKey || 'unknown'}`);
    console.log(`  Steps: ${flowSpec.steps?.length || 0}`);
    console.log(`  Personas: ${flowSpec.personas?.length || 0}`);

    // Expand to FlowGraph
    console.log('');
    console.log('Expanding FlowGraph...');

    const flowGraph = expandFlowGraph(flowSpec, {
      addSystemSteps: true,
      addEdgeCases: true
    });

    console.log(`  Lanes: ${flowGraph.lanes.join(', ')}`);
    console.log(`  Entry Points: ${flowGraph.starts.length}`);
    console.log(`  End States: ${flowGraph.ends.length}`);
    console.log(`  Total Nodes: ${flowGraph.nodes.length}`);
    console.log(`  Total Edges: ${flowGraph.edges.length}`);
    console.log(`  Assumptions: ${flowGraph.assumptions.length}`);

    // Write output
    const outDir = join(PROJECT_ROOT, 'output', 'flowgraph');
    mkdirSync(outDir, { recursive: true });

    const fileKey = flowSpec.meta?.fileKey || basename(inputPath, '.json');
    const outPath = join(outDir, `${fileKey}_flowgraph.json`);

    writeFileSync(outPath, JSON.stringify(flowGraph, null, 2), 'utf8');

    console.log('');
    console.log('Output:');
    console.log(`  ${outPath}`);
    console.log('');

    // Print summary
    console.log('--- FlowGraph Summary ---');
    console.log('');
    console.log('Entry Points:');
    for (const startId of flowGraph.starts) {
      const node = flowGraph.nodes.find(n => n.id === startId);
      console.log(`  [${startId}] ${node?.label || 'Start'}`);
    }

    console.log('');
    console.log('End States:');
    for (const endId of flowGraph.ends) {
      const node = flowGraph.nodes.find(n => n.id === endId);
      console.log(`  [${endId}] ${node?.label || 'End'}`);
    }

    if (flowGraph.openQuestions.length > 0) {
      console.log('');
      console.log('Open Questions:');
      for (const q of flowGraph.openQuestions.slice(0, 3)) {
        console.log(`  ? ${q}`);
      }
      if (flowGraph.openQuestions.length > 3) {
        console.log(`  ... and ${flowGraph.openQuestions.length - 3} more`);
      }
    }

    console.log('');
    console.log('Done!');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(2);
  }
}

main();
