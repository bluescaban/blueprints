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
import HeaderActions from './components/HeaderActions';
import RegenerateButton from './components/RegenerateButton';
import { FlowGraph } from '@/lib/flowgraph-types';

// ============================================================================
// Data Loading
// ============================================================================

async function loadFlowGraph(): Promise<FlowGraph | null> {
  try {
    const outputDir = path.join(process.cwd(), '..', 'output', 'flowgraph');

    // First, check for versioned output directories with latest.json
    const entries = await fs.readdir(outputDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory());

    // Find most recently modified directory with a latest.json
    let latestPath: string | null = null;
    let latestMtime = 0;

    for (const dir of dirs) {
      const latestJsonPath = path.join(outputDir, dir.name, 'latest.json');
      try {
        const stat = await fs.stat(latestJsonPath);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestPath = latestJsonPath;
        }
      } catch {
        // No latest.json in this directory
      }
    }

    // If found a latest.json, use it
    if (latestPath) {
      const content = await fs.readFile(latestPath, 'utf8');
      return JSON.parse(content) as FlowGraph;
    }

    // Fallback: look for legacy *_flowgraph.json files
    const files = entries.filter(e => e.isFile() && e.name.endsWith('_flowgraph.json'));

    if (files.length === 0) {
      console.log('No flowgraph files found in', outputDir);
      return null;
    }

    const latestFile = files[files.length - 1].name;
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
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{
          backgroundColor: '#4A85C8',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div
          className="text-center p-10 rounded-3xl border-2 border-white/40 max-w-lg w-full"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          }}
        >
          {/* Logo */}
          <div className="text-6xl font-bold text-white drop-shadow-lg mb-4">青</div>
          <h1 className="text-2xl font-bold text-white mb-2">BluePrints</h1>
          <p className="text-white/70 mb-8">
            No FlowGraph found. Generate one from your FigJam file.
          </p>

          {/* Regenerate Button */}
          <div className="mb-8">
            <RegenerateButton />
          </div>

          <div className="w-full h-px bg-white/20 mb-6" />

          <div className="text-left">
            <p className="text-xs text-white/60 uppercase tracking-wide mb-3">Or run manually:</p>
            <div
              className="p-4 rounded-xl text-sm font-mono overflow-x-auto border border-white/10"
              style={{ background: 'rgba(0, 0, 0, 0.2)' }}
            >
              <div className="text-white/50"># Run the pipeline</div>
              <div className="text-white">npm run bp:pipeline -- -i extract.json -f &quot;Feature&quot;</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4A85C8' }}>
      {/* Header - Glassmorphism */}
      <header
        className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between border-b border-white/30"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white drop-shadow-lg">青</span>
            <div className="h-8 w-px bg-white/30" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-lg font-bold text-white drop-shadow-sm flex items-center gap-2">
              <span className="text-white/70 font-normal">BluePrints</span>
              <span className="text-white/50">/</span>
              <span>{flowGraph.meta.feature}</span>
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-white/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                v{flowGraph.meta.specKitVersion}
              </span>
              <span className="text-xs text-white/60">
                {flowGraph.nodes.length} nodes
              </span>
              <span className="text-xs text-white/60">
                {flowGraph.edges.length} edges
              </span>
              <span className="text-xs text-white/60">
                {flowGraph.lanes.length} lanes
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions - Timestamp, Regenerate, Info */}
        <HeaderActions
          flowGraph={flowGraph}
          defaultFileKey={flowGraph.meta.sourceFileKey}
          defaultFeature={flowGraph.meta.feature}
        />
      </header>

      {/* Main Content */}
      <main className="relative">
        <Suspense fallback={<LoadingState />}>
          <FlowViewer flowGraph={flowGraph} />
        </Suspense>
      </main>
    </div>
  );
}

// ============================================================================
// Loading State
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4A85C8' }}>
      <div className="text-center">
        <div className="text-5xl font-bold text-white drop-shadow-lg mb-4 animate-pulse">青</div>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto mb-4" />
        <p className="text-white/70 text-sm">Loading FlowGraph...</p>
      </div>
    </div>
  );
}
