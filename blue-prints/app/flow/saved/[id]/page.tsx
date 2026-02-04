'use client';

/**
 * Saved Flow Viewer Page
 *
 * Displays a previously saved FlowGraph snapshot.
 * Renders at /flow/saved/[id]
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSavedFlow, SavedFlow } from '@/lib/flow-storage';
import FlowViewer from '../../components/FlowViewer';
import FlowSelector from '../../components/FlowSelector';

export default function SavedFlowPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;

  const [savedFlow, setSavedFlow] = useState<SavedFlow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flow selection state
  const [activeFlowId, setActiveFlowId] = useState<string>('main');

  useEffect(() => {
    if (!flowId) {
      setError('No flow ID provided');
      setIsLoading(false);
      return;
    }

    const flow = getSavedFlow(flowId);
    if (!flow) {
      setError('Saved flow not found');
      setIsLoading(false);
      return;
    }

    setSavedFlow(flow);

    // Initialize active flow
    const flows = flow.flowGraph.flows || [];
    const defaultId = flows.find(f => f.id === 'main') ? 'main' : (flows[0]?.id || 'main');
    setActiveFlowId(defaultId);

    setIsLoading(false);
  }, [flowId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4A85C8' }}>
        <div className="text-center">
          <div className="text-5xl font-bold text-white drop-shadow-lg mb-4 animate-pulse">青</div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-white/70 text-sm">Loading saved flow...</p>
        </div>
      </div>
    );
  }

  if (error || !savedFlow) {
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
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div className="text-6xl font-bold text-white drop-shadow-lg mb-4">青</div>
          <h1 className="text-2xl font-bold text-white mb-2">Flow Not Found</h1>
          <p className="text-white/70 mb-8">
            {error || 'The saved flow could not be found.'}
          </p>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-10 text-[#4A85C8] font-semibold transition-all hover:bg-white/90 hover:scale-105 shadow-lg"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const flowGraph = savedFlow.flowGraph;
  const flows = flowGraph.flows || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4A85C8' }}>
      {/* Header - Glassmorphism */}
      <header
        className="sticky top-0 z-30 px-6 py-3 border-b border-white/30"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left: Back button and Title */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-3xl font-bold text-white drop-shadow-lg">青</span>
            </Link>
            <div className="h-8 w-px bg-white/30" />

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  Saved
                </span>
                <h1 className="text-lg font-bold text-white drop-shadow-sm">
                  {savedFlow.name}
                </h1>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-white/60">
                  Saved {new Date(savedFlow.savedAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-white/60">
                  {flowGraph.nodes.length} nodes
                </span>
                <span className="text-xs text-white/60">
                  {flowGraph.edges.length} edges
                </span>
              </div>
            </div>
          </div>

          {/* Center: Flow Selector */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <FlowSelector
              flows={flows}
              activeFlowId={activeFlowId}
              onSelectFlow={setActiveFlowId}
            />
          </div>

          {/* Right: Original timestamp */}
          <div
            className="px-3 py-1.5 rounded-lg text-xs text-white/80 border border-white/20"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            Original: {new Date(flowGraph.meta.generatedAt).toLocaleString()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <FlowViewer
          flowGraph={flowGraph}
          showLayoutToolbar={false}
          activeFlowId={activeFlowId}
          onSelectFlow={setActiveFlowId}
        />
      </main>
    </div>
  );
}
