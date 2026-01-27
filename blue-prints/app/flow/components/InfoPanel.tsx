'use client';

/**
 * InfoPanel Component
 *
 * Collapsible side panel showing FlowGraph metadata:
 * - Project info
 * - Open questions
 * - Assumptions
 * - Risks
 */

import { useState } from 'react';
import { FlowGraph } from '@/lib/flowgraph-types';

interface InfoPanelProps {
  flowGraph: FlowGraph;
}

export default function InfoPanel({ flowGraph }: InfoPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'questions' | 'assumptions'>('info');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-16 z-20 bg-white shadow-lg rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        ℹ️ Info
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-16 z-20 w-80 bg-white shadow-xl rounded-lg border overflow-hidden max-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-bold text-gray-800">Flow Info</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <TabButton
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        >
          Overview
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
          Assumptions
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

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Statistics</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <StatBox label="Lanes" value={flowGraph.lanes.length} />
                <StatBox label="Entry Points" value={flowGraph.starts.length} />
                <StatBox label="Total Nodes" value={flowGraph.nodes.length} />
                <StatBox label="Total Edges" value={flowGraph.edges.length} />
              </div>
            </div>

            {flowGraph.risks.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-red-700 mb-2">⚠️ Risks ({flowGraph.risks.length})</h4>
                <ul className="space-y-1">
                  {flowGraph.risks.slice(0, 3).map((risk, i) => (
                    <li key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-2">
            {flowGraph.openQuestions.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No open questions</p>
            ) : (
              flowGraph.openQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 bg-amber-50 rounded">
                  <span className="text-amber-500">❓</span>
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
                <div key={i} className="flex items-start gap-2 text-sm p-2 bg-blue-50 rounded">
                  <span className="text-blue-500">💡</span>
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
      className={`flex-1 px-3 py-2 text-xs font-medium relative ${
        active
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-200 text-gray-600">
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

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded p-2 text-center">
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
