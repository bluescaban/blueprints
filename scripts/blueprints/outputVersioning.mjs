/**
 * outputVersioning.mjs
 *
 * FlowGraph Output Versioning v1.0
 *
 * Saves FlowGraph JSON to versioned output directories:
 * - output/flowgraph/<feature>/<timestamp>.json
 * - output/flowgraph/<feature>/latest.json (symlink)
 *
 * Features:
 * - Timestamp-based versioning
 * - Automatic directory creation
 * - Latest symlink management
 * - History tracking
 * - Cleanup of old versions (optional)
 *
 * @module outputVersioning
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// Constants
// ============================================================================

export const VERSIONING_VERSION = '1.0.0';

const DEFAULT_OUTPUT_DIR = 'output/flowgraph';
const LATEST_FILENAME = 'latest.json';
const HISTORY_FILENAME = 'history.json';
const MAX_HISTORY_ENTRIES = 50;

// ============================================================================
// Types (JSDoc)
// ============================================================================

/**
 * @typedef {Object} VersionInfo
 * @property {string} version - Version identifier (timestamp)
 * @property {string} filename - JSON filename
 * @property {string} path - Full path to file
 * @property {string} createdAt - ISO timestamp
 * @property {string} feature - Feature name
 * @property {Object} [meta] - Optional metadata
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} version - Version identifier
 * @property {string} filename - JSON filename
 * @property {string} createdAt - ISO timestamp
 * @property {number} nodeCount - Number of nodes
 * @property {number} edgeCount - Number of edges
 * @property {boolean} valid - Whether validation passed
 */

/**
 * @typedef {Object} SaveResult
 * @property {boolean} success - Whether save succeeded
 * @property {VersionInfo} version - Version information
 * @property {string} latestPath - Path to latest.json symlink
 * @property {string[]} cleanedUp - Paths of cleaned up old versions
 */

/**
 * @typedef {Object} OutputOptions
 * @property {string} [baseDir] - Base output directory
 * @property {number} [maxVersions] - Max versions to keep (0 = unlimited)
 * @property {boolean} [createSymlink] - Create latest.json symlink
 * @property {boolean} [trackHistory] - Track version history
 * @property {Object} [meta] - Additional metadata to include
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a version identifier from timestamp.
 * Format: YYYYMMDD-HHmmss
 * @returns {string}
 */
function generateVersionId() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');

  const date = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('');

  const time = [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('');

  return `${date}-${time}`;
}

/**
 * Sanitize feature name for use in filesystem paths.
 * @param {string} feature
 * @returns {string}
 */
function sanitizeFeatureName(feature) {
  return feature
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'unknown';
}

/**
 * Ensure directory exists, create if needed.
 * @param {string} dirPath
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Check if path is a symlink.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function isSymlink(filePath) {
  try {
    const stats = await fs.lstat(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Read JSON file safely.
 * @param {string} filePath
 * @returns {Promise<Object|null>}
 */
async function readJsonSafe(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ============================================================================
// History Management
// ============================================================================

/**
 * Load version history for a feature.
 * @param {string} featureDir
 * @returns {Promise<HistoryEntry[]>}
 */
async function loadHistory(featureDir) {
  const historyPath = path.join(featureDir, HISTORY_FILENAME);
  const history = await readJsonSafe(historyPath);
  return Array.isArray(history) ? history : [];
}

/**
 * Save version history.
 * @param {string} featureDir
 * @param {HistoryEntry[]} history
 */
async function saveHistory(featureDir, history) {
  const historyPath = path.join(featureDir, HISTORY_FILENAME);

  // Keep only recent entries
  const trimmed = history.slice(-MAX_HISTORY_ENTRIES);

  await fs.writeFile(
    historyPath,
    JSON.stringify(trimmed, null, 2),
    'utf-8'
  );
}

/**
 * Add entry to history.
 * @param {string} featureDir
 * @param {HistoryEntry} entry
 */
async function addHistoryEntry(featureDir, entry) {
  const history = await loadHistory(featureDir);
  history.push(entry);
  await saveHistory(featureDir, history);
}

// ============================================================================
// Version Cleanup
// ============================================================================

/**
 * Get list of version files in directory.
 * @param {string} featureDir
 * @returns {Promise<{filename: string, timestamp: number}[]>}
 */
async function getVersionFiles(featureDir) {
  try {
    const files = await fs.readdir(featureDir);

    // Filter for version files (YYYYMMDD-HHmmss.json pattern)
    const versionFiles = files
      .filter(f => /^\d{8}-\d{6}\.json$/.test(f))
      .map(f => {
        const match = f.match(/^(\d{8})-(\d{6})\.json$/);
        if (!match) return null;

        // Parse timestamp
        const [, date, time] = match;
        const year = parseInt(date.substring(0, 4));
        const month = parseInt(date.substring(4, 6)) - 1;
        const day = parseInt(date.substring(6, 8));
        const hour = parseInt(time.substring(0, 2));
        const minute = parseInt(time.substring(2, 4));
        const second = parseInt(time.substring(4, 6));

        const timestamp = new Date(year, month, day, hour, minute, second).getTime();

        return { filename: f, timestamp };
      })
      .filter(Boolean);

    // Sort by timestamp (oldest first)
    return versionFiles.sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}

/**
 * Clean up old versions, keeping only the most recent ones.
 * @param {string} featureDir
 * @param {number} maxVersions - Maximum versions to keep
 * @returns {Promise<string[]>} - Paths of deleted files
 */
async function cleanupOldVersions(featureDir, maxVersions) {
  if (maxVersions <= 0) return [];

  const versionFiles = await getVersionFiles(featureDir);
  const cleanedUp = [];

  // Delete oldest files if over limit
  const toDelete = versionFiles.slice(0, Math.max(0, versionFiles.length - maxVersions));

  for (const { filename } of toDelete) {
    const filePath = path.join(featureDir, filename);
    try {
      await fs.unlink(filePath);
      cleanedUp.push(filePath);
    } catch (err) {
      console.warn(`Failed to delete old version ${filename}:`, err.message);
    }
  }

  return cleanedUp;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Save a FlowGraph to versioned output.
 *
 * @param {Object} flowGraph - The FlowGraph to save
 * @param {OutputOptions} [options] - Output options
 * @returns {Promise<SaveResult>}
 */
export async function saveFlowGraph(flowGraph, options = {}) {
  const {
    baseDir = DEFAULT_OUTPUT_DIR,
    maxVersions = 0,
    createSymlink = true,
    trackHistory = true,
    meta = {}
  } = options;

  // Extract feature name from FlowGraph
  const feature = flowGraph.meta?.feature || 'unknown-feature';
  const sanitizedFeature = sanitizeFeatureName(feature);

  // Generate version ID
  const versionId = generateVersionId();
  const filename = `${versionId}.json`;

  // Build paths
  const featureDir = path.join(baseDir, sanitizedFeature);
  const filePath = path.join(featureDir, filename);
  const latestPath = path.join(featureDir, LATEST_FILENAME);

  // Ensure directory exists
  await ensureDir(featureDir);

  // Add versioning metadata to FlowGraph
  const versionedFlowGraph = {
    ...flowGraph,
    meta: {
      ...flowGraph.meta,
      version: versionId,
      versioningVersion: VERSIONING_VERSION,
      savedAt: new Date().toISOString(),
      ...meta
    }
  };

  // Write the versioned file
  await fs.writeFile(
    filePath,
    JSON.stringify(versionedFlowGraph, null, 2),
    'utf-8'
  );

  // Create/update latest symlink
  if (createSymlink) {
    try {
      // Remove existing symlink if present
      if (await isSymlink(latestPath)) {
        await fs.unlink(latestPath);
      }

      // Create relative symlink
      await fs.symlink(filename, latestPath);
    } catch (err) {
      // Symlinks may not be supported (Windows), fallback to copy
      console.warn('Symlink not supported, copying instead:', err.message);
      await fs.copyFile(filePath, latestPath);
    }
  }

  // Track history
  if (trackHistory) {
    await addHistoryEntry(featureDir, {
      version: versionId,
      filename,
      createdAt: new Date().toISOString(),
      nodeCount: flowGraph.nodes?.length || 0,
      edgeCount: flowGraph.edges?.length || 0,
      valid: true // Assume valid if we're saving
    });
  }

  // Cleanup old versions
  const cleanedUp = await cleanupOldVersions(featureDir, maxVersions);

  return {
    success: true,
    version: {
      version: versionId,
      filename,
      path: filePath,
      createdAt: new Date().toISOString(),
      feature: sanitizedFeature,
      meta
    },
    latestPath,
    cleanedUp
  };
}

/**
 * Load the latest FlowGraph for a feature.
 *
 * @param {string} feature - Feature name
 * @param {Object} [options] - Options
 * @param {string} [options.baseDir] - Base output directory
 * @returns {Promise<Object|null>}
 */
export async function loadLatestFlowGraph(feature, options = {}) {
  const { baseDir = DEFAULT_OUTPUT_DIR } = options;
  const sanitizedFeature = sanitizeFeatureName(feature);
  const latestPath = path.join(baseDir, sanitizedFeature, LATEST_FILENAME);

  return readJsonSafe(latestPath);
}

/**
 * Load a specific version of a FlowGraph.
 *
 * @param {string} feature - Feature name
 * @param {string} version - Version identifier
 * @param {Object} [options] - Options
 * @param {string} [options.baseDir] - Base output directory
 * @returns {Promise<Object|null>}
 */
export async function loadFlowGraphVersion(feature, version, options = {}) {
  const { baseDir = DEFAULT_OUTPUT_DIR } = options;
  const sanitizedFeature = sanitizeFeatureName(feature);
  const filePath = path.join(baseDir, sanitizedFeature, `${version}.json`);

  return readJsonSafe(filePath);
}

/**
 * List all versions for a feature.
 *
 * @param {string} feature - Feature name
 * @param {Object} [options] - Options
 * @param {string} [options.baseDir] - Base output directory
 * @returns {Promise<VersionInfo[]>}
 */
export async function listVersions(feature, options = {}) {
  const { baseDir = DEFAULT_OUTPUT_DIR } = options;
  const sanitizedFeature = sanitizeFeatureName(feature);
  const featureDir = path.join(baseDir, sanitizedFeature);

  const versionFiles = await getVersionFiles(featureDir);

  return versionFiles.map(({ filename, timestamp }) => ({
    version: filename.replace('.json', ''),
    filename,
    path: path.join(featureDir, filename),
    createdAt: new Date(timestamp).toISOString(),
    feature: sanitizedFeature
  }));
}

/**
 * Get version history for a feature.
 *
 * @param {string} feature - Feature name
 * @param {Object} [options] - Options
 * @param {string} [options.baseDir] - Base output directory
 * @returns {Promise<HistoryEntry[]>}
 */
export async function getVersionHistory(feature, options = {}) {
  const { baseDir = DEFAULT_OUTPUT_DIR } = options;
  const sanitizedFeature = sanitizeFeatureName(feature);
  const featureDir = path.join(baseDir, sanitizedFeature);

  return loadHistory(featureDir);
}

/**
 * Compare two versions of a FlowGraph.
 *
 * @param {string} feature - Feature name
 * @param {string} versionA - First version
 * @param {string} versionB - Second version
 * @param {Object} [options] - Options
 * @returns {Promise<Object>}
 */
export async function compareVersions(feature, versionA, versionB, options = {}) {
  const flowA = await loadFlowGraphVersion(feature, versionA, options);
  const flowB = await loadFlowGraphVersion(feature, versionB, options);

  if (!flowA || !flowB) {
    return {
      error: 'One or both versions not found',
      versionA: flowA ? 'found' : 'missing',
      versionB: flowB ? 'found' : 'missing'
    };
  }

  const nodeIdsA = new Set(flowA.nodes?.map(n => n.id) || []);
  const nodeIdsB = new Set(flowB.nodes?.map(n => n.id) || []);

  const edgeKeysA = new Set(flowA.edges?.map(e => `${e.from}->${e.to}`) || []);
  const edgeKeysB = new Set(flowB.edges?.map(e => `${e.from}->${e.to}`) || []);

  return {
    versionA,
    versionB,
    nodes: {
      added: [...nodeIdsB].filter(id => !nodeIdsA.has(id)),
      removed: [...nodeIdsA].filter(id => !nodeIdsB.has(id)),
      countA: nodeIdsA.size,
      countB: nodeIdsB.size
    },
    edges: {
      added: [...edgeKeysB].filter(key => !edgeKeysA.has(key)),
      removed: [...edgeKeysA].filter(key => !edgeKeysB.has(key)),
      countA: edgeKeysA.size,
      countB: edgeKeysB.size
    },
    lanes: {
      a: flowA.lanes || [],
      b: flowB.lanes || []
    }
  };
}

// ============================================================================
// Export
// ============================================================================

export default saveFlowGraph;
