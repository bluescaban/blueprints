/**
 * Flow Storage Utilities
 *
 * Handles saving, loading, and deleting FlowGraph snapshots
 * using localStorage for persistence.
 */

import { FlowGraph } from './flowgraph-types';

const STORAGE_KEY = 'blueprints-saved-flows';

export interface SavedFlow {
  id: string;
  name: string;
  savedAt: string;
  flowGraph: FlowGraph;
}

/**
 * Generate a unique ID for a saved flow
 */
function generateId(): string {
  return `flow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get all saved flows from localStorage
 */
export function getSavedFlows(): SavedFlow[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedFlow[];
  } catch {
    console.warn('Failed to load saved flows from localStorage');
    return [];
  }
}

/**
 * Save a flow to localStorage
 */
export function saveFlow(flowGraph: FlowGraph, customName?: string): SavedFlow {
  const savedFlows = getSavedFlows();

  const name = customName || `${flowGraph.meta.feature} - ${new Date().toLocaleDateString()}`;

  const newFlow: SavedFlow = {
    id: generateId(),
    name,
    savedAt: new Date().toISOString(),
    flowGraph,
  };

  savedFlows.unshift(newFlow); // Add to beginning (most recent first)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFlows));
  } catch (error) {
    // Handle quota exceeded or other errors
    console.error('Failed to save flow:', error);
    throw new Error('Failed to save flow. Storage might be full.');
  }

  return newFlow;
}

/**
 * Get a specific saved flow by ID
 */
export function getSavedFlow(id: string): SavedFlow | null {
  const savedFlows = getSavedFlows();
  return savedFlows.find(f => f.id === id) || null;
}

/**
 * Delete a saved flow by ID
 */
export function deleteSavedFlow(id: string): boolean {
  const savedFlows = getSavedFlows();
  const filtered = savedFlows.filter(f => f.id !== id);

  if (filtered.length === savedFlows.length) {
    return false; // Flow not found
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    console.warn('Failed to delete saved flow');
    return false;
  }
}

/**
 * Rename a saved flow
 */
export function renameSavedFlow(id: string, newName: string): boolean {
  const savedFlows = getSavedFlows();
  const flowIndex = savedFlows.findIndex(f => f.id === id);

  if (flowIndex === -1) {
    return false;
  }

  savedFlows[flowIndex].name = newName;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFlows));
    return true;
  } catch {
    console.warn('Failed to rename saved flow');
    return false;
  }
}

/**
 * Clear all saved flows
 */
export function clearAllSavedFlows(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('Failed to clear saved flows');
  }
}
