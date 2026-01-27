#!/usr/bin/env node
/**
 * figma-extract.mjs
 *
 * Extracts TEXT nodes (including STICKY notes) from a raw Figma/FigJam JSON file
 * and outputs them in a structured format for parsing.
 *
 * Usage:
 *   node scripts/figma-extract.mjs <path_to_figma_json>
 *   node scripts/figma-extract.mjs output/flowspec/HYxtgE7EARWuvTskijY7xa.json
 *
 * Output:
 *   - output/extracted/<fileKey>_extracted.json
 *   - output/extracted/<fileKey>_extracted.md (optional markdown view)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Constants
// ============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));

// Node types to extract text from
const TEXT_NODE_TYPES = ['TEXT', 'STICKY'];

// ============================================================================
// Types (JSDoc)
// ============================================================================

/**
 * @typedef {Object} ExtractedNode
 * @property {string} id - Figma node ID
 * @property {string} name - Node name
 * @property {string} text - Extracted text content
 * @property {string} type - Node type (TEXT, STICKY, etc.)
 * @property {string} [section] - Parent section name, if any
 * @property {string} [color] - Background color for STICKY notes
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {string} fileKey - Figma file key
 * @property {string} fileName - Original file name
 * @property {string} extractedAt - ISO timestamp
 * @property {number} nodeCount - Number of nodes extracted
 * @property {ExtractedNode[]} extracted - Array of extracted nodes
 */

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Recursively walk the Figma document tree and extract text nodes.
 *
 * @param {Object} node - Figma node object
 * @param {ExtractedNode[]} results - Array to collect results
 * @param {string} [parentSection] - Name of parent section (for context)
 */
function walkAndExtract(node, results, parentSection = null) {
  // Track section context
  let currentSection = parentSection;
  if (node.type === 'SECTION') {
    currentSection = node.name;
  }

  // Check if this node has text content we want
  if (TEXT_NODE_TYPES.includes(node.type)) {
    // For STICKY nodes, the text is often in the `name` field
    // For TEXT nodes, look for `characters` field
    let text = '';

    if (node.characters) {
      // TEXT nodes use `characters` field
      text = node.characters;
    } else if (node.type === 'STICKY') {
      // STICKY nodes put their content in `name`
      text = node.name;
    }

    // Only add if we have actual text
    if (text && text.trim()) {
      /** @type {ExtractedNode} */
      const extracted = {
        id: node.id,
        name: node.name,
        text: text,
        type: node.type
      };

      // Add section context if available
      if (currentSection) {
        extracted.section = currentSection;
      }

      // Extract color for sticky notes (useful for categorization)
      if (node.fills && node.fills.length > 0) {
        const fill = node.fills[0];
        if (fill.color) {
          const { r, g, b } = fill.color;
          extracted.color = rgbToHex(r, g, b);
        }
      }

      results.push(extracted);
    }
  }

  // Recursively process children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      walkAndExtract(child, results, currentSection);
    }
  }
}

/**
 * Convert RGB (0-1 range) to hex color.
 *
 * @param {number} r - Red (0-1)
 * @param {number} g - Green (0-1)
 * @param {number} b - Blue (0-1)
 * @returns {string} Hex color string
 */
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extract all text nodes from a Figma JSON file.
 *
 * @param {string} filePath - Path to the Figma JSON file
 * @returns {ExtractionResult} Extraction result
 */
function extractFromFile(filePath) {
  // Read and parse the Figma JSON
  const content = readFileSync(filePath, 'utf8');
  const figmaData = JSON.parse(content);

  // Derive file key from filename or document
  const fileKey = basename(filePath, '.json');
  const fileName = figmaData.name || fileKey;

  // Extract nodes
  /** @type {ExtractedNode[]} */
  const extracted = [];

  // Start from document root
  if (figmaData.document) {
    walkAndExtract(figmaData.document, extracted);
  } else {
    // Maybe it's already the document node
    walkAndExtract(figmaData, extracted);
  }

  return {
    fileKey,
    fileName,
    extractedAt: new Date().toISOString(),
    nodeCount: extracted.length,
    extracted
  };
}

/**
 * Generate a markdown preview of extracted nodes.
 *
 * @param {ExtractionResult} result - Extraction result
 * @returns {string} Markdown content
 */
function generateMarkdown(result) {
  const lines = [
    `# Extracted Nodes from ${result.fileName}`,
    '',
    `> File Key: \`${result.fileKey}\``,
    `> Extracted: ${result.extractedAt}`,
    `> Node Count: ${result.nodeCount}`,
    '',
    '---',
    ''
  ];

  // Group by section
  const bySection = new Map();
  for (const node of result.extracted) {
    const section = node.section || 'Ungrouped';
    if (!bySection.has(section)) {
      bySection.set(section, []);
    }
    bySection.get(section).push(node);
  }

  for (const [section, nodes] of bySection) {
    lines.push(`## ${section}`);
    lines.push('');

    for (const node of nodes) {
      lines.push(`### ${node.type}: ${node.id}`);
      if (node.color) {
        lines.push(`> Color: ${node.color}`);
      }
      lines.push('');
      lines.push('```');
      lines.push(node.text);
      lines.push('```');
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Main CLI
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/figma-extract.mjs <path_to_figma_json>');
    console.error('');
    console.error('Example:');
    console.error('  node scripts/figma-extract.mjs output/flowspec/HYxtgE7EARWuvTskijY7xa.json');
    process.exit(1);
  }

  const inputPath = args[0];

  console.log(`Extracting TEXT nodes from: ${inputPath}`);

  try {
    // Extract nodes
    const result = extractFromFile(inputPath);

    console.log(`Found ${result.nodeCount} text nodes`);

    // Ensure output directory exists
    const outDir = join(__dirname, '..', 'output', 'extracted');
    mkdirSync(outDir, { recursive: true });

    // Write JSON output
    const jsonPath = join(outDir, `${result.fileKey}_extracted.json`);
    writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Wrote JSON: ${jsonPath}`);

    // Write Markdown output
    const mdPath = join(outDir, `${result.fileKey}_extracted.md`);
    writeFileSync(mdPath, generateMarkdown(result), 'utf8');
    console.log(`Wrote Markdown: ${mdPath}`);

    // Print summary by section
    console.log('');
    console.log('Summary by section:');
    const bySection = new Map();
    for (const node of result.extracted) {
      const section = node.section || 'Ungrouped';
      bySection.set(section, (bySection.get(section) || 0) + 1);
    }
    for (const [section, count] of bySection) {
      console.log(`  ${section}: ${count} nodes`);
    }

  } catch (err) {
    console.error('Error extracting nodes:', err.message);
    process.exit(2);
  }
}

main();
