/**
 * Regenerate API Route
 *
 * POST /api/regenerate
 * Triggers the BluePrints pipeline to fetch from FigJam and regenerate the FlowGraph.
 *
 * Body: { fileKey: string, feature: string }
 * Response: { ok: true, latestFlowGraphPath: string } | { ok: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

// ============================================================================
// Validation
// ============================================================================

const SAFE_PATTERN = /^[a-zA-Z0-9_\-\s]+$/;
const FILE_KEY_PATTERN = /^[a-zA-Z0-9_\-]+$/;

function validateInputs(fileKey: string, feature: string): string | null {
  if (!fileKey || typeof fileKey !== 'string') {
    return 'fileKey is required';
  }
  if (!feature || typeof feature !== 'string') {
    return 'feature is required';
  }
  if (!FILE_KEY_PATTERN.test(fileKey)) {
    return 'fileKey contains invalid characters';
  }
  if (!SAFE_PATTERN.test(feature)) {
    return 'feature contains invalid characters';
  }
  if (fileKey.length > 100 || feature.length > 100) {
    return 'fileKey or feature is too long';
  }
  return null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function sanitizeFeatureName(feature: string): string {
  return feature
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'unknown';
}

function formatReadableDate(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hour = pad(now.getHours());
  const minute = pad(now.getMinutes());

  // Format: 2024-01-15_10-30
  return `${year}-${month}-${day}_${hour}-${minute}`;
}

async function fetchFigmaFile(fileKey: string, token: string, outputPath: string): Promise<void> {
  const url = `https://api.figma.com/v1/files/${fileKey}`;

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Figma API error ${response.status}: ${text}`);
  }

  const json = await response.json();
  writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf8');
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';

  try {
    // Parse request body
    const body = await request.json();
    const { fileKey, feature } = body;

    // Validate inputs
    const validationError = validateInputs(fileKey, feature);
    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 }
      );
    }

    // Check for FIGMA_API_TOKEN
    const figmaToken = process.env.FIGMA_API_TOKEN;
    if (!figmaToken) {
      return NextResponse.json(
        { ok: false, error: 'FIGMA_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Define paths
    const projectRoot = path.resolve(process.cwd(), '..');
    const scriptsDir = path.join(projectRoot, 'scripts');
    const outputDir = path.join(projectRoot, 'output');

    // Step 1: Fetch FigJam file from Figma API
    console.log(`[Regenerate] Step 1: Fetching FigJam file ${fileKey}...`);

    const flowspecDir = path.join(outputDir, 'flowspec');
    mkdirSync(flowspecDir, { recursive: true });
    const figmaJsonPath = path.join(flowspecDir, `${fileKey}.json`);

    await fetchFigmaFile(fileKey, figmaToken, figmaJsonPath);
    console.log(`[Regenerate] Saved Figma JSON to ${figmaJsonPath}`);

    // Step 2: Extract text nodes
    console.log(`[Regenerate] Step 2: Extracting text nodes...`);

    const extractScript = path.join(scriptsDir, 'figma-extract.mjs');
    await execFileAsync('node', [extractScript, figmaJsonPath], {
      cwd: projectRoot,
      timeout: 30000,
    });

    const extractedDir = path.join(outputDir, 'extracted');
    const extractedPath = path.join(extractedDir, `${fileKey}_extracted.json`);

    if (!existsSync(extractedPath)) {
      throw new Error('Extraction failed: output file not found');
    }
    console.log(`[Regenerate] Extracted to ${extractedPath}`);

    // Step 3: Generate FlowSpec
    console.log(`[Regenerate] Step 3: Generating FlowSpec...`);

    const genFlowScript = path.join(scriptsDir, 'blueprints', 'generateFlowFromExtract.mjs');
    await execFileAsync('node', [genFlowScript, extractedPath], {
      cwd: projectRoot,
      timeout: 30000,
    });

    // Find the generated flowspec file (most recent)
    const flowspecFiles = readdirSync(flowspecDir)
      .filter(f => f.startsWith(fileKey) && f.endsWith('.json') && f !== `${fileKey}.json`)
      .sort();

    if (flowspecFiles.length === 0) {
      throw new Error('FlowSpec generation failed: output file not found');
    }

    const latestFlowspec = flowspecFiles[flowspecFiles.length - 1];
    const flowspecPath = path.join(flowspecDir, latestFlowspec);
    console.log(`[Regenerate] Generated FlowSpec at ${flowspecPath}`);

    // Step 4: Expand to FlowGraph using CLI
    console.log(`[Regenerate] Step 4: Expanding to FlowGraph...`);

    // Create feature-specific directory for better organization
    // Structure: output/flowgraph/<feature-name>/flowgraph_2024-01-15_10-30.json
    const sanitizedFeature = sanitizeFeatureName(feature);
    const flowgraphBaseDir = path.join(outputDir, 'flowgraph');
    const flowgraphDir = path.join(flowgraphBaseDir, sanitizedFeature);
    mkdirSync(flowgraphDir, { recursive: true });

    // Human-readable filename: flowgraph_2024-01-15_10-30.json
    const readableDate = formatReadableDate();
    const flowgraphFilename = `flowgraph_${readableDate}.json`;
    const flowgraphPath = path.join(flowgraphDir, flowgraphFilename);

    // Run the CLI expand command
    const cliScript = path.join(scriptsDir, 'blueprints', 'cli.mjs');
    await execFileAsync('node', [
      cliScript,
      'expand',
      '-i', flowspecPath,
      '-f', feature,
      '-o', flowgraphPath,
    ], {
      cwd: projectRoot,
      timeout: 60000,
    });

    // Verify the file was created
    if (!existsSync(flowgraphPath)) {
      throw new Error('FlowGraph expansion failed: output file not found');
    }

    // Read the generated FlowGraph for response
    const flowGraph = JSON.parse(readFileSync(flowgraphPath, 'utf8'));
    console.log(`[Regenerate] Saved FlowGraph to ${flowgraphPath}`);

    // Save as latest.json for easy loading
    const latestPath = path.join(flowgraphDir, 'latest.json');
    writeFileSync(latestPath, JSON.stringify(flowGraph, null, 2), 'utf8');

    console.log(`[Regenerate] Pipeline complete!`);

    return NextResponse.json({
      ok: true,
      latestFlowGraphPath: flowgraphPath,
      stats: {
        nodes: flowGraph.nodes.length,
        edges: flowGraph.edges.length,
        lanes: flowGraph.lanes,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Regenerate] Error:', message);

    return NextResponse.json(
      {
        ok: false,
        error: isDev ? message : 'Pipeline failed',
        ...(isDev && error instanceof Error && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}
