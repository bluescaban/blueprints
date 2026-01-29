'use client';

/**
 * HeaderActions Component
 *
 * Client-side header actions including Info toggle and Regenerate button.
 * Controls the InfoPanel open/close state.
 */

import { useState } from 'react';
import RegenerateButton from './RegenerateButton';
import InfoPanel from './InfoPanel';
import { FlowGraph } from '@/lib/flowgraph-types';

interface HeaderActionsProps {
  flowGraph: FlowGraph;
  defaultFileKey?: string;
  defaultFeature?: string;
}

export default function HeaderActions({
  flowGraph,
  defaultFileKey,
  defaultFeature
}: HeaderActionsProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(true);

  return (
    <>
      {/* Header buttons */}
      <div className="flex items-center gap-3">
        {/* Timestamp */}
        <div
          className="px-3 py-1.5 rounded-lg text-xs text-white/80 border border-white/20"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {new Date(flowGraph.meta.generatedAt).toLocaleString()}
        </div>

        {/* Regenerate Button */}
        <RegenerateButton
          defaultFileKey={defaultFileKey}
          defaultFeature={defaultFeature}
        />

        {/* Info Toggle Button */}
        <button
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className={`px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-2 rounded-lg border-2 ${
            isInfoOpen
              ? 'bg-white text-blue-600 border-white shadow-md'
              : 'text-white border-white/40 hover:bg-white/10'
          }`}
          style={!isInfoOpen ? {
            background: 'rgba(255, 255, 255, 0.1)',
          } : undefined}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Info</span>
        </button>
      </div>

      {/* Info Panel - rendered in portal position */}
      <InfoPanel
        flowGraph={flowGraph}
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </>
  );
}
