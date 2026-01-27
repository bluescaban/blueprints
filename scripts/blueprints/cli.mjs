#!/usr/bin/env node

/**
 * BluePrints CLI v2.0
 *
 * Command-line interface for the BluePrints pipeline:
 * - Parse card grammar from FigJam extracts
 * - Expand to FlowGraph
 * - Validate FlowGraph
 * - Save with versioning
 * - Render to Mermaid
 *
 * Usage:
 *   node scripts/blueprints/cli.mjs <command> [options]
 *
 * Commands:
 *   parse <input>       Parse FlowSpec from extracted JSON
 *   expand <input>      Expand FlowSpec to FlowGraph
 *   validate <input>    Validate a FlowGraph
 *   render <input>      Render FlowGraph to Mermaid
 *   pipeline <input>    Run full pipeline (parse -> expand -> validate -> save)
 *
 * @module cli
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import modules
import { parseExtractedNodes, GRAMMAR_VERSION } from './parseCards.mjs';
import { expandFlowGraph, SPECKIT_VERSION } from './expandFlowGraph.mjs';
import { validateFlowGraph, validateOrThrow, formatValidationResult, VALIDATOR_VERSION } from './validateFlowGraph.mjs';
import { saveFlowGraph, VERSIONING_VERSION } from './outputVersioning.mjs';

// ============================================================================
// Constants
// ============================================================================

const CLI_VERSION = '2.0.0';

const COMMANDS = {
  parse: 'Parse FlowSpec from extracted JSON',
  expand: 'Expand FlowSpec to FlowGraph',
  validate: 'Validate a FlowGraph',
  render: 'Render FlowGraph to Mermaid (not implemented)',
  pipeline: 'Run full pipeline (parse -> expand -> validate -> save)',
  help: 'Show this help message',
  version: 'Show version information'
};

// ============================================================================
// Helpers
// ============================================================================

function printHeader() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              BluePrints CLI v' + CLI_VERSION + '                           ║');
  console.log('║         FigJam → FlowSpec → FlowGraph Pipeline              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
}

function printHelp() {
  printHeader();
  console.log('Usage: node scripts/blueprints/cli.mjs <command> [options]');
  console.log('');
  console.log('Commands:');
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${cmd.padEnd(15)} ${desc}`);
  }
  console.log('');
  console.log('Options:');
  console.log('  --input, -i    Input file path');
  console.log('  --output, -o   Output file path (optional)');
  console.log('  --feature, -f  Feature name for versioning');
  console.log('  --strict       Fail on validation errors (default: true)');
  console.log('  --no-save      Skip saving to versioned output');
  console.log('  --quiet, -q    Suppress non-essential output');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/blueprints/cli.mjs parse -i extract.json -o flowspec.json');
  console.log('  node scripts/blueprints/cli.mjs pipeline -i extract.json -f "User Onboarding"');
  console.log('  node scripts/blueprints/cli.mjs validate -i flowgraph.json');
  console.log('');
}

function printVersions() {
  console.log('');
  console.log('BluePrints Pipeline Versions:');
  console.log(`  CLI:        v${CLI_VERSION}`);
  console.log(`  Grammar:    v${GRAMMAR_VERSION}`);
  console.log(`  SpecKit:    v${SPECKIT_VERSION}`);
  console.log(`  Validator:  v${VALIDATOR_VERSION}`);
  console.log(`  Versioning: v${VERSIONING_VERSION}`);
  console.log('');
}

function parseArgs(args) {
  const parsed = {
    command: null,
    input: null,
    output: null,
    feature: null,
    strict: true,
    save: true,
    quiet: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('-') && !parsed.command) {
      parsed.command = arg;
      continue;
    }

    switch (arg) {
      case '--input':
      case '-i':
        parsed.input = args[++i];
        break;
      case '--output':
      case '-o':
        parsed.output = args[++i];
        break;
      case '--feature':
      case '-f':
        parsed.feature = args[++i];
        break;
      case '--strict':
        parsed.strict = true;
        break;
      case '--no-strict':
        parsed.strict = false;
        break;
      case '--no-save':
        parsed.save = false;
        break;
      case '--quiet':
      case '-q':
        parsed.quiet = true;
        break;
      default:
        // If it's a positional arg after command, treat as input
        if (!parsed.input && !arg.startsWith('-')) {
          parsed.input = arg;
        }
    }
  }

  return parsed;
}

async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function log(quiet, ...args) {
  if (!quiet) console.log(...args);
}

// ============================================================================
// Commands
// ============================================================================

async function cmdParse(args) {
  const { input, output, quiet } = args;

  if (!input) {
    console.error('Error: Input file required. Use -i <file>');
    process.exit(1);
  }

  log(quiet, `📖 Parsing: ${input}`);

  const data = await readJsonFile(input);
  const flowSpec = parseExtractedNodes(data);

  log(quiet, `✅ Parsed ${flowSpec.steps.length} steps, ${flowSpec.decisions.length} decisions`);

  if (output) {
    await writeJsonFile(output, flowSpec);
    log(quiet, `💾 Saved FlowSpec to: ${output}`);
  } else {
    console.log(JSON.stringify(flowSpec, null, 2));
  }

  return flowSpec;
}

async function cmdExpand(args) {
  const { input, output, feature, quiet } = args;

  if (!input) {
    console.error('Error: Input file required. Use -i <file>');
    process.exit(1);
  }

  log(quiet, `🔄 Expanding: ${input}`);

  const flowSpec = await readJsonFile(input);
  const flowGraph = expandFlowGraph(flowSpec, { featureName: feature });

  log(quiet, `✅ Expanded to ${flowGraph.nodes.length} nodes, ${flowGraph.edges.length} edges`);
  log(quiet, `   Lanes: ${flowGraph.lanes.join(', ')}`);
  log(quiet, `   Flows: ${flowGraph.flows.length}`);

  if (output) {
    await writeJsonFile(output, flowGraph);
    log(quiet, `💾 Saved FlowGraph to: ${output}`);
  } else {
    console.log(JSON.stringify(flowGraph, null, 2));
  }

  return flowGraph;
}

async function cmdValidate(args) {
  const { input, strict, quiet } = args;

  if (!input) {
    console.error('Error: Input file required. Use -i <file>');
    process.exit(1);
  }

  log(quiet, `🔍 Validating: ${input}`);

  const flowGraph = await readJsonFile(input);
  const result = validateFlowGraph(flowGraph, { strict });

  if (!quiet) {
    console.log(formatValidationResult(result));
  }

  if (strict && !result.valid) {
    process.exit(1);
  }

  return result;
}

async function cmdPipeline(args) {
  const { input, output, feature, strict, save, quiet } = args;

  if (!input) {
    console.error('Error: Input file required. Use -i <file>');
    process.exit(1);
  }

  printHeader();

  // Step 1: Parse
  log(quiet, '═══════════════════════════════════════════════════════════════');
  log(quiet, 'STEP 1: Parse FlowSpec from extraction');
  log(quiet, '═══════════════════════════════════════════════════════════════');

  const extractData = await readJsonFile(input);
  const flowSpec = parseExtractedNodes(extractData);

  log(quiet, `✅ Parsed:`);
  log(quiet, `   Steps:     ${flowSpec.steps.length}`);
  log(quiet, `   Decisions: ${flowSpec.decisions.length}`);
  log(quiet, `   Personas:  ${flowSpec.personas.length}`);
  log(quiet, `   Flow Groups: ${flowSpec.flowGroups?.length || 0}`);
  log(quiet, '');

  // Step 2: Expand
  log(quiet, '═══════════════════════════════════════════════════════════════');
  log(quiet, 'STEP 2: Expand to FlowGraph');
  log(quiet, '═══════════════════════════════════════════════════════════════');

  const featureName = feature || flowSpec.goals?.[0] || 'Unknown Feature';
  const flowGraph = expandFlowGraph(flowSpec, { featureName });

  log(quiet, `✅ Expanded:`);
  log(quiet, `   Nodes:  ${flowGraph.nodes.length}`);
  log(quiet, `   Edges:  ${flowGraph.edges.length}`);
  log(quiet, `   Lanes:  ${flowGraph.lanes.join(', ')}`);
  log(quiet, `   Flows:  ${flowGraph.flows.length}`);
  log(quiet, '');

  // Step 3: Validate
  log(quiet, '═══════════════════════════════════════════════════════════════');
  log(quiet, 'STEP 3: Validate FlowGraph');
  log(quiet, '═══════════════════════════════════════════════════════════════');

  const validationResult = validateFlowGraph(flowGraph, { strict });

  if (!quiet) {
    console.log(formatValidationResult(validationResult));
  }

  if (strict && !validationResult.valid) {
    console.error('❌ Pipeline failed: Validation errors');
    process.exit(1);
  }

  // Step 4: Save
  if (save) {
    log(quiet, '═══════════════════════════════════════════════════════════════');
    log(quiet, 'STEP 4: Save with versioning');
    log(quiet, '═══════════════════════════════════════════════════════════════');

    const saveResult = await saveFlowGraph(flowGraph, {
      baseDir: output || 'output/flowgraph',
      trackHistory: true
    });

    log(quiet, `✅ Saved:`);
    log(quiet, `   Version: ${saveResult.version.version}`);
    log(quiet, `   Path:    ${saveResult.version.path}`);
    log(quiet, `   Latest:  ${saveResult.latestPath}`);

    if (saveResult.cleanedUp.length > 0) {
      log(quiet, `   Cleaned: ${saveResult.cleanedUp.length} old version(s)`);
    }
  }

  log(quiet, '');
  log(quiet, '═══════════════════════════════════════════════════════════════');
  log(quiet, '🎉 Pipeline completed successfully!');
  log(quiet, '═══════════════════════════════════════════════════════════════');

  return { flowSpec, flowGraph, validationResult };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = parseArgs(process.argv.slice(2));

  switch (args.command) {
    case 'parse':
      await cmdParse(args);
      break;

    case 'expand':
      await cmdExpand(args);
      break;

    case 'validate':
      await cmdValidate(args);
      break;

    case 'pipeline':
      await cmdPipeline(args);
      break;

    case 'version':
    case '-v':
    case '--version':
      printVersions();
      break;

    case 'help':
    case '-h':
    case '--help':
    case null:
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${args.command}`);
      console.error('Use --help to see available commands.');
      process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
