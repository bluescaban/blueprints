/**
 * Flow Viewer Page
 *
 * Interactive visualization of the FlowGraph.
 * Renders at /flow
 */

import { Suspense } from 'react';
import { promises as fs } from 'fs';
import path from 'path';

import FlowViewer from './components/FlowViewer';
import InfoPanel from './components/InfoPanel';
import { FlowGraph } from '@/lib/flowgraph-types';

// ============================================================================
// Data Loading
// ============================================================================

async function loadFlowGraph(): Promise<FlowGraph | null> {
  try {
    // Try to load the most recent flowgraph from the output directory
    const outputDir = path.join(process.cwd(), '..', 'output', 'flowgraph');

    // Read directory to find flowgraph files
    const files = await fs.readdir(outputDir);
    const flowgraphFiles = files.filter(f => f.endsWith('_flowgraph.json'));

    if (flowgraphFiles.length === 0) {
      console.log('No flowgraph files found in', outputDir);
      return null;
    }

    // Use the most recent (or first available)
    const latestFile = flowgraphFiles[flowgraphFiles.length - 1];
    const filePath = path.join(outputDir, latestFile);

    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as FlowGraph;
  } catch (error) {
    console.error('Error loading flowgraph:', error);
    return null;
  }
}

// ============================================================================
// Page Component
// ============================================================================

export default async function FlowPage() {
  const flowGraph = await loadFlowGraph();

  if (!flowGraph) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No FlowGraph Found</h1>
          <p className="text-gray-600 mb-6">
            Generate a FlowGraph first by running:
          </p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded text-left text-sm overflow-x-auto">
{`# Step 1: Extract from Figma
npm run extract:figma <figma.json>

# Step 2: Generate FlowSpec
npm run flow:gen <extracted.json>

# Step 3: Generate FlowGraph
node scripts/blueprints/generateFlowGraph.mjs <flowspec.json>`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4A85C8' }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/50 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {flowGraph.meta.project}: {flowGraph.meta.feature}
          </h1>
          <p className="text-sm text-gray-500">
            SpecKit v{flowGraph.meta.specKitVersion} • {flowGraph.nodes.length} nodes • {flowGraph.edges.length} edges
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            Generated: {new Date(flowGraph.meta.generatedAt).toLocaleString()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <Suspense fallback={<LoadingState />}>
          <FlowViewer flowGraph={flowGraph} />
        </Suspense>
        <InfoPanel flowGraph={flowGraph} />
      </main>
    </div>
  );
}

// ============================================================================
// Loading State
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading FlowGraph...</p>
      </div>
    </div>
  );
}
