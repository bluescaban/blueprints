'use client';

/**
 * FlowSelector Component
 *
 * Dropdown selector for choosing between multiple flow groups.
 * Designed for header placement with glassmorphism styling.
 */

import { useState, useRef, useEffect } from 'react';
import { FlowGroupOutput } from '@/lib/flowgraph-types';

interface FlowSelectorProps {
  flows: FlowGroupOutput[];
  activeFlowId: string;
  onSelectFlow: (flowId: string) => void;
}

export default function FlowSelector({ flows, activeFlowId, onSelectFlow }: FlowSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Deduplicate flows by ID (keep first occurrence)
  const uniqueFlows = flows.filter((flow, index, self) =>
    index === self.findIndex(f => f.id === flow.id)
  );

  // Get the active flow's name
  const activeFlow = uniqueFlows.find(f => f.id === activeFlowId);
  const activeFlowName = activeFlow?.name || 'Select Flow';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Don't render if there's only one flow or no flows
  if (uniqueFlows.length <= 1) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/30 transition-all hover:border-white/50"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <span className="text-sm font-medium text-white">{activeFlowName}</span>
        <svg
          className={`w-4 h-4 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[200px] max-h-[300px] overflow-y-auto rounded-xl border border-white/30 shadow-xl z-50"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div className="p-1">
            {uniqueFlows.map((flow) => {
              const isActive = flow.id === activeFlowId;
              return (
                <button
                  key={flow.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFlow(flow.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{flow.name}</span>
                    {isActive && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                  {flow.nodes && (
                    <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                      {flow.nodes.length} nodes
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
