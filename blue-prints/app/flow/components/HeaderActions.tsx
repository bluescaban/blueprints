'use client';

/**
 * HeaderActions Component
 *
 * Client-side header actions including timestamp and Regenerate button.
 */

import RegenerateButton from './RegenerateButton';
import { FlowGraph } from '@/lib/flowgraph-types';

interface HeaderActionsProps {
  flowGraph: FlowGraph;
  defaultFileKey?: string;
  defaultFeature?: string;
  showRegenerate?: boolean;
  isRegenerateOpen?: boolean;
  onRegenerateClose?: () => void;
}

export default function HeaderActions({
  flowGraph,
  defaultFileKey,
  defaultFeature,
  showRegenerate = true,
  isRegenerateOpen,
  onRegenerateClose,
}: HeaderActionsProps) {
  return (
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

      {/* Regenerate Button - conditionally shown or externally controlled */}
      {showRegenerate && (
        <RegenerateButton
          defaultFileKey={defaultFileKey}
          defaultFeature={defaultFeature}
        />
      )}
      {!showRegenerate && isRegenerateOpen !== undefined && (
        <RegenerateButton
          defaultFileKey={defaultFileKey}
          defaultFeature={defaultFeature}
          isExternallyControlled
          externalIsOpen={isRegenerateOpen}
          onExternalClose={onRegenerateClose}
        />
      )}
    </div>
  );
}
