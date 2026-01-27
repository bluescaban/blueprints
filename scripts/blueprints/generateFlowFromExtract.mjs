#!/usr/bin/env node
/**
 * generateFlowFromExtract.mjs
 *
 * CLI script that takes extracted FigJam JSON and produces:
 * 1. A FlowSpec JSON file (output/flowspec/<fileKey>_<timestamp>.json)
 * 2. A Mermaid markdown file (docs/flows/<fileKey>_<timestamp>.md)
 *
 * Usage:
 *   node scripts/blueprints/generateFlowFromExtract.mjs <path_to_extracted_json>
 *
 * Example:
 *   node scripts/blueprints/generateFlowFromExtract.mjs output/extracted/HYxtgE7EARWuvTskijY7xa_extracted.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// Import our parsing and rendering modules
import { parseExtractedNodes, GRAMMAR_VERSION } from './parseCards.mjs';
import { renderFlowchart } from './renderMermaid.mjs';

// ============================================================================
// Constants
// ============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a timestamp string for filenames.
 * Format: YYYYMMDD_HHMMSS
 *
 * @returns {string} Timestamp string
 */
function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '_',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('');
}

/**
 * Generate Mermaid markdown content with metadata.
 *
 * @param {import('./parseCards.mjs').FlowSpec} flowSpec - The parsed FlowSpec
 * @param {string} mermaidCode - The rendered Mermaid code
 * @returns {string} Complete markdown content
 */
function generateMermaidMarkdown(flowSpec, mermaidCode) {
  const lines = [
    `# Flow: ${flowSpec.meta.fileKey}`,
    '',
    `> Generated: ${flowSpec.meta.generatedAt}`,
    `> Grammar Version: ${flowSpec.meta.grammarVersion}`,
    '',
  ];

  // Add summary section
  lines.push('## Summary');
  lines.push('');

  if (flowSpec.goals.length > 0) {
    lines.push('### Goals');
    for (const goal of flowSpec.goals) {
      lines.push(`- ${goal}`);
    }
    lines.push('');
  }

  if (flowSpec.personas.length > 0) {
    lines.push('### Personas');
    for (const persona of flowSpec.personas) {
      if (persona.details) {
        lines.push(`- **${persona.name}**: ${persona.details}`);
      } else {
        lines.push(`- **${persona.name}**`);
      }
    }
    lines.push('');
  }

  if (flowSpec.context.length > 0) {
    lines.push('### Context');
    for (const ctx of flowSpec.context) {
      lines.push(`- ${ctx}`);
    }
    lines.push('');
  }

  // Main flowchart
  lines.push('## User Flow');
  lines.push('');
  lines.push('```mermaid');
  lines.push(mermaidCode.trim());
  lines.push('```');
  lines.push('');

  // Additional details
  if (flowSpec.requirements.functional.length > 0 || flowSpec.requirements.nonFunctional.length > 0) {
    lines.push('## Requirements');
    lines.push('');

    if (flowSpec.requirements.functional.length > 0) {
      lines.push('### Functional');
      for (const req of flowSpec.requirements.functional) {
        lines.push(`- ${req}`);
      }
      lines.push('');
    }

    if (flowSpec.requirements.nonFunctional.length > 0) {
      lines.push('### Non-Functional');
      for (const req of flowSpec.requirements.nonFunctional) {
        lines.push(`- ${req}`);
      }
      lines.push('');
    }
  }

  if (flowSpec.problems.length > 0) {
    lines.push('## Problems');
    for (const problem of flowSpec.problems) {
      lines.push(`- ${problem}`);
    }
    lines.push('');
  }

  if (flowSpec.questions.length > 0) {
    lines.push('## Open Questions');
    for (const q of flowSpec.questions) {
      lines.push(`- [ ] ${q}`);
    }
    lines.push('');
  }

  if (flowSpec.risks.length > 0) {
    lines.push('## Risks');
    for (const risk of flowSpec.risks) {
      lines.push(`- ${risk}`);
    }
    lines.push('');
  }

  if (flowSpec.notes.length > 0) {
    lines.push('## Notes');
    for (const note of flowSpec.notes) {
      lines.push(`- ${note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Main CLI
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  // Show usage if no args
  if (args.length === 0) {
    console.log('BluePrints Flow Generator');
    console.log(`Grammar Version: ${GRAMMAR_VERSION}`);
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/blueprints/generateFlowFromExtract.mjs <path_to_extracted_json>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/blueprints/generateFlowFromExtract.mjs output/extracted/HYxtgE7EARWuvTskijY7xa_extracted.json');
    console.log('');
    console.log('Output:');
    console.log('  - output/flowspec/<fileKey>_<timestamp>.json');
    console.log('  - docs/flows/<fileKey>_<timestamp>.md');
    process.exit(1);
  }

  const inputPath = args[0];

  console.log('BluePrints Flow Generator');
  console.log(`Input: ${inputPath}`);
  console.log('');

  try {
    // ---- Read Extracted JSON ----
    console.log('Reading extracted JSON...');
    const content = readFileSync(inputPath, 'utf8');
    const extractionData = JSON.parse(content);

    // Validate input structure
    if (!extractionData.extracted || !Array.isArray(extractionData.extracted)) {
      throw new Error('Invalid extraction format: missing "extracted" array');
    }

    const fileKey = extractionData.fileKey || basename(inputPath, '.json').replace('_extracted', '');

    console.log(`  File Key: ${fileKey}`);
    console.log(`  Nodes: ${extractionData.extracted.length}`);

    // ---- Parse Cards ----
    console.log('');
    console.log('Parsing card grammar...');

    const flowSpec = parseExtractedNodes({
      fileKey,
      extracted: extractionData.extracted
    });

    console.log(`  Context: ${flowSpec.context.length}`);
    console.log(`  Goals: ${flowSpec.goals.length}`);
    console.log(`  Personas: ${flowSpec.personas.length}`);
    console.log(`  Steps: ${flowSpec.steps.length}`);
    console.log(`  Decisions: ${flowSpec.decisions.length}`);
    console.log(`  Edges: ${flowSpec.edges.length}`);
    console.log(`  Requirements: ${flowSpec.requirements.functional.length} functional, ${flowSpec.requirements.nonFunctional.length} non-functional`);
    console.log(`  Notes: ${flowSpec.notes.length}`);

    // ---- Render Mermaid ----
    console.log('');
    console.log('Rendering Mermaid flowchart...');

    const mermaidCode = renderFlowchart(flowSpec);

    // ---- Write Output Files ----
    const timestamp = getTimestamp();

    // Ensure output directories exist
    const flowspecDir = join(PROJECT_ROOT, 'output', 'flowspec');
    const flowsDir = join(PROJECT_ROOT, 'docs', 'flows');
    mkdirSync(flowspecDir, { recursive: true });
    mkdirSync(flowsDir, { recursive: true });

    // Write FlowSpec JSON
    const jsonFilename = `${fileKey}_${timestamp}.json`;
    const jsonPath = join(flowspecDir, jsonFilename);
    writeFileSync(jsonPath, JSON.stringify(flowSpec, null, 2), 'utf8');

    // Write Mermaid Markdown
    const mdFilename = `${fileKey}_${timestamp}.md`;
    const mdPath = join(flowsDir, mdFilename);
    const mdContent = generateMermaidMarkdown(flowSpec, mermaidCode);
    writeFileSync(mdPath, mdContent, 'utf8');

    // ---- Print Results ----
    console.log('');
    console.log('Output files created:');
    console.log(`  FlowSpec JSON: ${jsonPath}`);
    console.log(`  Mermaid MD:    ${mdPath}`);
    console.log('');
    console.log('Done!');

  } catch (err) {
    console.error('');
    console.error('Error:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(2);
  }
}

main();
