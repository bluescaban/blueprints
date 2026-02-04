'use client';

/**
 * MenuShelf Component
 *
 * Slide-out menu from the left side triggered by logo click.
 * Contains navigation, action buttons, and Flow Info panel:
 * - Home (navigate to /)
 * - Flow Info (inline expandable panel)
 * - Save Layout
 * - Reset Layout
 * - Regenerate
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FlowGraph, LANE_COLORS, AcceptanceCriteria, Persona } from '@/lib/flowgraph-types';
import { saveFlow } from '@/lib/flow-storage';

interface MenuShelfProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  onRegenerate: () => void;
  hasChanges: boolean;
  hasSavedLayout: boolean;
  flowGraph: FlowGraph;
}

type InfoTabType = 'info' | 'personas' | 'questions' | 'assumptions' | 'ac';

export default function MenuShelf({
  isOpen,
  onClose,
  onSaveLayout,
  onResetLayout,
  onRegenerate,
  hasChanges,
  hasSavedLayout,
  flowGraph,
}: MenuShelfProps) {
  const shelfRef = useRef<HTMLDivElement>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<InfoTabType>('info');

  // Save flow dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get acceptance criteria
  const acceptanceCriteria: AcceptanceCriteria[] = flowGraph.acceptanceCriteria || [];

  // Derive personas from lanes (excluding System)
  const personas: Persona[] = flowGraph.personas || flowGraph.lanes
    .filter(lane => lane !== 'System')
    .map(lane => ({ name: lane }));

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showInfoPanel) {
          setShowInfoPanel(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showInfoPanel]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shelfRef.current && !shelfRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };
    // Add a small delay to prevent immediate close on the same click that opened it
    const timeout = setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset state when shelf closes
  useEffect(() => {
    if (!isOpen) {
      setShowInfoPanel(false);
      setActiveInfoTab('info');
      setShowSaveDialog(false);
      setSaveName('');
      setSaveStatus('idle');
      setSaveError(null);
    }
  }, [isOpen]);

  // Handle save flow
  const handleSaveFlow = () => {
    try {
      const name = saveName.trim() || `${flowGraph.meta.feature} - ${new Date().toLocaleDateString()}`;
      saveFlow(flowGraph, name);
      setSaveStatus('success');
      setTimeout(() => {
        setShowSaveDialog(false);
        setSaveName('');
        setSaveStatus('idle');
      }, 1500);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      />

      {/* Shelf */}
      <div
        ref={shelfRef}
        className={`fixed top-0 left-0 z-50 h-full w-80 transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '4px 0 30px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(74, 133, 200, 0.15), rgba(74, 133, 200, 0.05))',
          }}
        >
          <div className="flex items-center gap-3">
            {showInfoPanel ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfoPanel(false);
                }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <span className="text-3xl font-bold text-[#4A85C8] drop-shadow-sm">青</span>
            )}
            <div>
              <h2 className="font-bold text-gray-800">
                {showInfoPanel ? 'Flow Info' : 'BluePrints'}
              </h2>
              <p className="text-xs text-gray-500">
                {showInfoPanel ? flowGraph.meta.feature : 'Menu'}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {showInfoPanel ? (
            // Info Panel Content
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex border-b border-gray-200/50 bg-gray-50/50 flex-shrink-0">
                <InfoTabButton
                  active={activeInfoTab === 'info'}
                  onClick={() => setActiveInfoTab('info')}
                >
                  Overview
                </InfoTabButton>
                <InfoTabButton
                  active={activeInfoTab === 'personas'}
                  onClick={() => setActiveInfoTab('personas')}
                  badge={personas.length}
                >
                  Personas
                </InfoTabButton>
                <InfoTabButton
                  active={activeInfoTab === 'questions'}
                  onClick={() => setActiveInfoTab('questions')}
                  badge={flowGraph.openQuestions.length}
                >
                  Questions
                </InfoTabButton>
                <InfoTabButton
                  active={activeInfoTab === 'assumptions'}
                  onClick={() => setActiveInfoTab('assumptions')}
                  badge={flowGraph.assumptions.length}
                >
                  Notes
                </InfoTabButton>
                <InfoTabButton
                  active={activeInfoTab === 'ac'}
                  onClick={() => setActiveInfoTab('ac')}
                  badge={acceptanceCriteria.length}
                >
                  AC
                </InfoTabButton>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeInfoTab === 'info' && (
                  <div className="space-y-4">
                    <InfoRow label="Project" value={flowGraph.meta.project} />
                    <InfoRow label="Feature" value={flowGraph.meta.feature} />
                    <InfoRow label="Generated" value={new Date(flowGraph.meta.generatedAt).toLocaleString()} />
                    <InfoRow label="SpecKit Version" value={flowGraph.meta.specKitVersion} />

                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Statistics</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <StatBox label="Lanes" value={flowGraph.lanes.length} color="blue" />
                        <StatBox label="Entry Points" value={flowGraph.starts.length} color="green" />
                        <StatBox label="Total Nodes" value={flowGraph.nodes.length} color="purple" />
                        <StatBox label="Total Edges" value={flowGraph.edges.length} color="amber" />
                      </div>
                    </div>

                    {flowGraph.risks.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                          <span>Risks</span>
                          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600">
                            {flowGraph.risks.length}
                          </span>
                        </h4>
                        <ul className="space-y-1">
                          {flowGraph.risks.slice(0, 3).map((risk, i) => (
                            <li key={i} className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeInfoTab === 'personas' && (
                  <div className="space-y-3">
                    {personas.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No personas defined</p>
                    ) : (
                      personas.map((persona, i) => {
                        const colors = LANE_COLORS[persona.name] || LANE_COLORS.User;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl border"
                            style={{
                              backgroundColor: colors.bg,
                              borderColor: colors.accent + '40',
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: colors.accent }}
                            >
                              {persona.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: colors.text }}>
                                {persona.name}
                              </p>
                              {persona.details && (
                                <p className="text-xs opacity-75" style={{ color: colors.text }}>
                                  {persona.details}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeInfoTab === 'questions' && (
                  <div className="space-y-2">
                    {flowGraph.openQuestions.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No open questions</p>
                    ) : (
                      flowGraph.openQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <span className="text-amber-500 mt-0.5">?</span>
                          <span className="text-gray-700">{q}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeInfoTab === 'assumptions' && (
                  <div className="space-y-2">
                    {flowGraph.assumptions.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No assumptions recorded</p>
                    ) : (
                      flowGraph.assumptions.map((a, i) => (
                        <div key={i} className={`flex items-start gap-2 text-sm p-3 rounded-xl border ${
                          a === '---' ? 'bg-gray-100 border-gray-200' : 'bg-blue-50 border-blue-100'
                        }`}>
                          {a === '---' ? (
                            <span className="text-gray-400 text-xs w-full text-center">SpecKit Expansion Notes</span>
                          ) : (
                            <>
                              <span className="text-blue-500 mt-0.5">*</span>
                              <span className="text-gray-700">{a}</span>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeInfoTab === 'ac' && (
                  <div className="space-y-2">
                    {acceptanceCriteria.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 italic mb-2">No acceptance criteria defined</p>
                        <p className="text-xs text-gray-400">
                          Add AC: cards to your FigJam to define testable expectations
                        </p>
                      </div>
                    ) : (
                      acceptanceCriteria.map((ac, i) => (
                        <div
                          key={i}
                          className={`text-sm p-3 rounded-xl border ${
                            ac.suggested
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-emerald-50 border-emerald-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`mt-0.5 ${ac.suggested ? 'text-gray-400' : 'text-emerald-500'}`}>
                              {ac.suggested ? '?' : '✓'}
                            </span>
                            <div className="flex-1">
                              <p className={ac.suggested ? 'text-gray-600' : 'text-gray-700'}>
                                {ac.condition}
                              </p>
                              {ac.expectedResult && (
                                <p className="text-xs text-emerald-600 mt-1">
                                  → {ac.expectedResult}
                                </p>
                              )}
                              {ac.attachedTo && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Attached to: {ac.attachedTo}
                                </p>
                              )}
                              {ac.suggested && (
                                <span className="inline-block text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-1">
                                  Suggested
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Menu Items
            <div className="p-4 space-y-2">
              {/* Navigation Section */}
              <div className="pb-3 mb-3 border-b border-gray-100">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2 px-3">Navigation</p>

                {/* Home */}
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Home</span>
                    <p className="text-xs text-gray-400 group-hover:text-blue-400">Go to start page</p>
                  </div>
                </Link>
              </div>

              {/* View Section */}
              <div className="pb-3 mb-3 border-b border-gray-100">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2 px-3">View</p>

                {/* Flow Info */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfoPanel(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <span className="text-sm font-medium">Flow Info</span>
                    <p className="text-xs text-gray-400 group-hover:text-blue-400">
                      Project details & metadata
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Actions Section */}
              <div className="pb-3 mb-3 border-b border-gray-100">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2 px-3">Layout Actions</p>

                {/* Save Layout */}
                <button
                  onClick={() => {
                    onSaveLayout();
                    onClose();
                  }}
                  disabled={!hasChanges}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                    hasChanges
                      ? 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    hasChanges
                      ? 'bg-gray-100 group-hover:bg-green-100'
                      : 'bg-gray-50'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium">Save Layout</span>
                    <p className={`text-xs ${hasChanges ? 'text-gray-400 group-hover:text-green-400' : 'text-gray-300'}`}>
                      {hasChanges ? 'Save current positions' : 'No changes to save'}
                    </p>
                  </div>
                </button>

                {/* Reset Layout */}
                <button
                  onClick={() => {
                    onResetLayout();
                    onClose();
                  }}
                  disabled={!hasSavedLayout && !hasChanges}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                    (hasSavedLayout || hasChanges)
                      ? 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    (hasSavedLayout || hasChanges)
                      ? 'bg-gray-100 group-hover:bg-amber-100'
                      : 'bg-gray-50'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium">Reset Layout</span>
                    <p className={`text-xs ${(hasSavedLayout || hasChanges) ? 'text-gray-400 group-hover:text-amber-400' : 'text-gray-300'}`}>
                      Restore default positions
                    </p>
                  </div>
                </button>
              </div>

              {/* Data Section */}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2 px-3">Data</p>

                {/* Save Flow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSaveName(`${flowGraph.meta.feature} - ${new Date().toLocaleDateString()}`);
                    setShowSaveDialog(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium">Save Flow</span>
                    <p className="text-xs text-gray-400 group-hover:text-emerald-400">Save a snapshot</p>
                  </div>
                </button>

                {/* Regenerate */}
                <button
                  onClick={() => {
                    onRegenerate();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium">Regenerate</span>
                    <p className="text-xs text-gray-400 group-hover:text-blue-400">Fetch from FigJam</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400 text-center">
            BluePrints v1.0
          </p>
        </div>

        {/* Save Flow Dialog */}
        {showSaveDialog && (
          <div
            className="absolute inset-0 z-60 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
              e.stopPropagation();
              if (saveStatus !== 'success') {
                setShowSaveDialog(false);
                setSaveStatus('idle');
              }
            }}
          >
            <div
              className="w-full max-w-xs mx-4 rounded-2xl border border-white/30 overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {saveStatus === 'success' ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-800">Flow Saved!</p>
                  <p className="text-sm text-gray-500 mt-1">View it from the home page</p>
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50 to-white">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save Flow Snapshot
                    </h3>
                  </div>
                  <div className="p-5">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-800 text-sm"
                      placeholder="Enter a name for this snapshot..."
                      autoFocus
                    />
                    {saveStatus === 'error' && (
                      <p className="text-xs text-red-500 mt-2">{saveError}</p>
                    )}
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSaveDialog(false);
                          setSaveStatus('idle');
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveFlow();
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function InfoTabButton({
  children,
  active,
  onClick,
  badge,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-2.5 text-xs font-medium relative transition-all ${
        active
          ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
          active ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-800">{value}</dd>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };

  return (
    <div className={`rounded-xl p-3 text-center border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}
