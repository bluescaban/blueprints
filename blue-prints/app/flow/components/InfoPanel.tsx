'use client';

/**
 * InfoPanel Component
 *
 * Collapsible side panel showing FlowGraph metadata:
 * - Project info
 * - Personas
 * - Open questions
 * - Assumptions
 * - Risks
 */

import { useState } from 'react';
import { FlowGraph, LANE_COLORS } from '@/lib/flowgraph-types';

interface InfoPanelProps {
  flowGraph: FlowGraph;
}

export default function InfoPanel({ flowGraph }: InfoPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'personas' | 'questions' | 'assumptions'>('info');

  // Derive personas from lanes (excluding System)
  const personas = flowGraph.personas || flowGraph.lanes
    .filter(lane => lane !== 'System')
    .map(lane => ({ name: lane }));

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-20 z-20 px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-all flex items-center gap-2 rounded-xl border border-white/30"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <span>Info</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed right-4 top-20 z-20 w-80 rounded-2xl border border-white/30 overflow-hidden max-h-[calc(100vh-120px)]"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50"
        style={{
          background: 'linear-gradient(135deg, rgba(74, 133, 200, 0.1), rgba(74, 133, 200, 0.05))',
        }}
      >
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="text-lg">青</span>
          <span>Flow Info</span>
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200/50 bg-gray-50/50">
        <TabButton
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        >
          Overview
        </TabButton>
        <TabButton
          active={activeTab === 'personas'}
          onClick={() => setActiveTab('personas')}
          badge={personas.length}
        >
          Personas
        </TabButton>
        <TabButton
          active={activeTab === 'questions'}
          onClick={() => setActiveTab('questions')}
          badge={flowGraph.openQuestions.length}
        >
          Questions
        </TabButton>
        <TabButton
          active={activeTab === 'assumptions'}
          onClick={() => setActiveTab('assumptions')}
          badge={flowGraph.assumptions.length}
        >
          Notes
        </TabButton>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[400px]">
        {activeTab === 'info' && (
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

        {activeTab === 'personas' && (
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

        {activeTab === 'questions' && (
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

        {activeTab === 'assumptions' && (
          <div className="space-y-2">
            {flowGraph.assumptions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No assumptions recorded</p>
            ) : (
              flowGraph.assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-blue-500 mt-0.5">*</span>
                  <span className="text-gray-700">{a}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function TabButton({
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
