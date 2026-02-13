'use client';

/**
 * LandingPageContent Component
 *
 * Client-side content for the landing page with tabbed interface.
 */

import { useState } from 'react';
import Link from 'next/link';
import SavedFlowsList from './SavedFlowsList';

type TabType = 'quickstart' | 'saved';

export default function LandingPageContent() {
  const [activeTab, setActiveTab] = useState<TabType>('quickstart');

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Logo */}
      <div className="text-8xl font-bold text-white drop-shadow-lg">青</div>

      {/* Title */}
      <h1 className="text-4xl font-bold tracking-tight text-white">
        BluePrints
      </h1>

      {/* Description */}
      <p className="max-w-md text-lg leading-7 text-white/80">
        Convert FigJam notes into structured user flows with interactive visualization.
      </p>

      {/* CTA Button */}
      <Link
        href="/flow"
        className="mt-2 flex h-12 items-center justify-center gap-2 rounded-full bg-white px-10 text-[#4A85C8] font-semibold transition-all hover:bg-white/90 hover:scale-105 shadow-lg"
      >
        Flow Generation Board →
      </Link>

      {/* Divider */}
      <div className="w-full h-px bg-white/20 my-4" />

      {/* Tab Navigation */}
      <div className="w-full flex rounded-xl overflow-hidden border border-white/20">
        <button
          onClick={() => setActiveTab('quickstart')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'quickstart'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          Quick Start
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
            activeTab === 'saved'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          Saved Flows
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'quickstart' && (
          <div className="w-full">
            {/* What is BluePrints */}
            <div className="bg-white/10 rounded-xl p-5 border border-white/20 text-left">
              <h3 className="text-white font-semibold text-base mb-3 flex items-center gap-2">
                <span className="text-xl">🎨</span> What is BluePrints?
              </h3>
              <p className="text-white/80 text-sm leading-relaxed mb-3">
                BluePrints transforms your <strong className="text-white">FigJam notes</strong> into
                interactive, structured user flows. Design your workflows visually using sticky notes
                and connectors, then let BluePrints automatically generate navigable flow diagrams.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-white/10 text-white/70">Visual-first workflow</span>
                <span className="px-2 py-1 rounded-full bg-white/10 text-white/70">Auto-generated flows</span>
                <span className="px-2 py-1 rounded-full bg-white/10 text-white/70">Interactive canvas</span>
              </div>
            </div>

            {/* Pipeline Flow */}
            <div className="mt-5">
              <h4 className="text-white/60 text-xs uppercase tracking-wide mb-3 text-center">How It Works</h4>
              <div className="flex items-center justify-center gap-2">
                {/* Step 1: FigJam */}
                <PipelineStep
                  icon="📝"
                  title="FigJam"
                  description="Sticky notes"
                  color="bg-purple-500/20"
                  borderColor="border-purple-400/30"
                />

                {/* Arrow */}
                <div className="text-white/40 text-lg">→</div>

                {/* Step 2: Card Grammar */}
                <PipelineStep
                  icon="🎯"
                  title="Card Grammar"
                  description="G: S: D: parsing"
                  color="bg-blue-500/20"
                  borderColor="border-blue-400/30"
                />

                {/* Arrow */}
                <div className="text-white/40 text-lg">→</div>

                {/* Step 3: SpecKit */}
                <PipelineStep
                  icon="⚙️"
                  title="SpecKit"
                  description="Flow inference"
                  color="bg-green-500/20"
                  borderColor="border-green-400/30"
                />

                {/* Arrow */}
                <div className="text-white/40 text-lg">→</div>

                {/* Step 4: React Flow */}
                <PipelineStep
                  icon="📊"
                  title="React Flow"
                  description="Interactive view"
                  color="bg-amber-500/20"
                  borderColor="border-amber-400/30"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="w-full">
            <SavedFlowsList />
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineStep({
  icon,
  title,
  description,
  color,
  borderColor,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
  borderColor: string;
}) {
  return (
    <div className={`p-3 rounded-xl ${color} border ${borderColor} text-center min-w-[90px]`}>
      <div className="text-xl mb-1">{icon}</div>
      <h3 className="font-semibold text-white text-xs">{title}</h3>
      <p className="text-[10px] text-white/60 mt-0.5">{description}</p>
    </div>
  );
}
