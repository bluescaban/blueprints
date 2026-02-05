'use client';

/**
 * FlowPageClient Component
 *
 * Client-side wrapper for the flow page that manages:
 * - Menu shelf state (triggered by logo click)
 * - Coordination between header and FlowViewer
 * - Layout persistence callbacks
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Suspense } from 'react';
import FlowViewer from './FlowViewer';
import HeaderActions from './HeaderActions';
import MenuShelf from './MenuShelf';
import FlowSelector from './FlowSelector';
import RegenerateButton from './RegenerateButton';
import { FlowGraph } from '@/lib/flowgraph-types';

interface FlowPageClientProps {
  flowGraph: FlowGraph;
}

// Loading state component
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

export default function FlowPageClient({ flowGraph }: FlowPageClientProps) {
  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Regenerate modal state
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);

  // Flow selection state
  const flows = flowGraph.flows || [];
  const initialFlowId = flows.find(f => f.id === 'main') ? 'main' : (flows[0]?.id || 'main');
  const [activeFlowId, setActiveFlowId] = useState(initialFlowId);

  // Update active flow if flows change
  useEffect(() => {
    if (flows.length === 0) return;
    const defaultId = flows.find(f => f.id === 'main') ? 'main' : flows[0].id;
    setActiveFlowId(defaultId);
  }, [flows]);

  // Layout state (managed by FlowViewer but exposed via ref)
  const [hasChanges, setHasChanges] = useState(false);
  const [hasSavedLayout, setHasSavedLayout] = useState(false);

  // Callback refs from FlowViewer
  const saveCallbackRef = useRef<(() => void) | null>(null);
  const resetCallbackRef = useRef<(() => void) | null>(null);

  // Handlers passed to FlowViewer to register callbacks
  const onRegisterSave = useCallback((callback: () => void) => {
    saveCallbackRef.current = callback;
  }, []);

  const onRegisterReset = useCallback((callback: () => void) => {
    resetCallbackRef.current = callback;
  }, []);

  const onLayoutStateChange = useCallback((changes: boolean, saved: boolean) => {
    setHasChanges(changes);
    setHasSavedLayout(saved);
  }, []);

  // Menu action handlers
  const handleSaveLayout = useCallback(() => {
    if (saveCallbackRef.current) {
      saveCallbackRef.current();
    }
  }, []);

  const handleResetLayout = useCallback(() => {
    if (resetCallbackRef.current) {
      resetCallbackRef.current();
    }
  }, []);

  const handleRegenerate = useCallback(() => {
    setIsRegenerateOpen(true);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#4A85C8' }}>
      {/* Menu Shelf */}
      <MenuShelf
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSaveLayout={handleSaveLayout}
        onResetLayout={handleResetLayout}
        onRegenerate={handleRegenerate}
        hasChanges={hasChanges}
        hasSavedLayout={hasSavedLayout}
        flowGraph={flowGraph}
      />

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
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-4">
            {/* Logo - Clickable to open menu */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-3 group"
              title="Open menu"
            >
              <span className="text-3xl font-bold text-white drop-shadow-lg transition-transform group-hover:scale-110">
                青
              </span>
              <div className="h-8 w-px bg-white/30" />
            </button>

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

          {/* Center: Flow Selector */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <FlowSelector
              flows={flows}
              activeFlowId={activeFlowId}
              onSelectFlow={setActiveFlowId}
            />
          </div>

          {/* Right: Header Actions - Timestamp */}
          <HeaderActions
            flowGraph={flowGraph}
            defaultFileKey={flowGraph.meta.sourceFileKey}
            defaultFeature={flowGraph.meta.feature}
            showRegenerate={false}
            isRegenerateOpen={isRegenerateOpen}
            onRegenerateClose={() => setIsRegenerateOpen(false)}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <Suspense fallback={<LoadingState />}>
          <FlowViewer
            flowGraph={flowGraph}
            onRegisterSave={onRegisterSave}
            onRegisterReset={onRegisterReset}
            onLayoutStateChange={onLayoutStateChange}
            showLayoutToolbar={false}
            activeFlowId={activeFlowId}
            onSelectFlow={setActiveFlowId}
          />
        </Suspense>
      </main>

      {/* Regenerate Modal - rendered at root level to avoid backdrop-filter stacking context */}
      <RegenerateButton
        defaultFileKey={flowGraph.meta.sourceFileKey}
        defaultFeature={flowGraph.meta.feature}
        isExternallyControlled
        externalIsOpen={isRegenerateOpen}
        onExternalClose={() => setIsRegenerateOpen(false)}
      />
    </div>
  );
}
