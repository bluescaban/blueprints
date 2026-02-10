'use client';

/**
 * SavedFlowsList Component
 *
 * Displays a list of saved flow snapshots with options to view or delete.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSavedFlows, deleteSavedFlow, SavedFlow } from '@/lib/flow-storage';

export default function SavedFlowsList() {
  const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load saved flows on mount
  useEffect(() => {
    const flows = getSavedFlows();
    setSavedFlows(flows);
    setIsLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    if (deleteSavedFlow(id)) {
      setSavedFlows(flows => flows.filter(f => f.id !== id));
    }
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white mx-auto" />
      </div>
    );
  }

  if (savedFlows.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <p className="text-white/70 mb-2">No saved flows yet</p>
        <p className="text-white/50 text-sm">
          Open a flow and use the menu to save snapshots
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {savedFlows.map((flow) => (
        <div
          key={flow.id}
          className="p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-colors group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-semibold text-white text-sm truncate text-left">{flow.name}</h3>
              <p className="text-xs text-white/60 mt-1 text-left">
                {new Date(flow.savedAt).toLocaleDateString()} at {new Date(flow.savedAt).toLocaleTimeString()}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                <span>{flow.flowGraph.nodes.length} nodes</span>
                <span>{flow.flowGraph.edges.length} edges</span>
                <span>{flow.flowGraph.lanes.length} lanes</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {deleteConfirm === flow.id ? (
                <>
                  <button
                    onClick={() => handleDelete(flow.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/flow/saved/${flow.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(flow.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
