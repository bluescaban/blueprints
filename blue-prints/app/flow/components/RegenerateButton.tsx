'use client';

/**
 * RegenerateButton Component
 *
 * Button that triggers the BluePrints pipeline to fetch fresh data
 * from FigJam and regenerate the FlowGraph.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegenerateButtonProps {
  defaultFileKey?: string;
  defaultFeature?: string;
  isExternallyControlled?: boolean;
  externalIsOpen?: boolean;
  onExternalClose?: () => void;
}

interface RegenerateResponse {
  ok: boolean;
  latestFlowGraphPath?: string;
  error?: string;
  stats?: {
    nodes: number;
    edges: number;
    lanes: string[];
  };
}

export default function RegenerateButton({
  defaultFileKey = '',
  defaultFeature = '',
  isExternallyControlled = false,
  externalIsOpen = false,
  onExternalClose,
}: RegenerateButtonProps) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external or internal state
  const isOpen = isExternallyControlled ? externalIsOpen : internalIsOpen;
  const setIsOpen = isExternallyControlled
    ? (open: boolean) => { if (!open && onExternalClose) onExternalClose(); }
    : setInternalIsOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(defaultFileKey);
  const [feature, setFeature] = useState(defaultFeature);

  const handleRegenerate = async () => {
    if (!fileKey.trim() || !feature.trim()) {
      setError('Please enter both File Key and Feature name');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey: fileKey.trim(),
          feature: feature.trim(),
        }),
      });

      const data: RegenerateResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to regenerate');
      }

      setSuccess(
        `Regenerated! ${data.stats?.nodes} nodes, ${data.stats?.edges} edges`
      );

      // Refresh the page data after a short delay
      setTimeout(() => {
        router.refresh();
        setIsOpen(false);
        setSuccess(null);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // When externally controlled, don't render anything if closed
  if (isExternallyControlled && !isOpen) {
    return null;
  }

  // When internally controlled, show the button if closed
  if (!isExternallyControlled && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium transition-all hover:scale-105 border border-white/30"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <RefreshIcon />
        <span>Regenerate</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="text-lg font-bold">Regenerate from FigJam</h2>
          <p className="text-sm text-blue-100 mt-1">
            Fetch the latest data and rebuild the FlowGraph
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="fileKey"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              FigJam File Key
            </label>
            <input
              id="fileKey"
              type="text"
              value={fileKey}
              onChange={(e) => setFileKey(e.target.value)}
              placeholder="e.g., HYxtgE7EARWuvTskijY7xa"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Found in the FigJam URL: figma.com/file/<strong>[file-key]</strong>/...
            </p>
          </div>

          <div>
            <label
              htmlFor="feature"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Feature Name
            </label>
            <input
              id="feature"
              type="text"
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              placeholder="e.g., Social Listening"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={isLoading}
            />
          </div>

          {/* Status Messages */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-500 mt-0.5">!</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-500 mt-0.5">✓</span>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm text-blue-700">
                Running pipeline... This may take a moment.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setSuccess(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <RefreshIcon />
                Regenerate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
