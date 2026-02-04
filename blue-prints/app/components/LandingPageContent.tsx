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
        Convert FigJam diagrams into structured user flows with interactive visualization.
      </p>

      {/* CTA Button */}
      <Link
        href="/flow"
        className="mt-2 flex h-12 items-center justify-center gap-2 rounded-full bg-white px-10 text-[#4A85C8] font-semibold transition-all hover:bg-white/90 hover:scale-105 shadow-lg"
      >
        View Current Flow →
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
          <div className="w-full text-left">
            <div className="bg-black/20 text-white p-4 rounded-xl text-sm font-mono overflow-x-auto border border-white/10">
              <div className="text-white/50"># Extract from Figma JSON</div>
              <div>npm run extract:figma &lt;figma.json&gt;</div>
              <div className="mt-2 text-white/50"># Generate FlowSpec</div>
              <div>npm run flow:gen &lt;extracted.json&gt;</div>
              <div className="mt-2 text-white/50"># Expand to FlowGraph</div>
              <div>npm run flow:expand &lt;flowspec.json&gt;</div>
              <div className="mt-2 text-white/50"># Start viewer</div>
              <div>npm run dev</div>
            </div>

            {/* Features */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <FeatureCard
                icon="🎯"
                title="Card Grammar"
                description="G:, S:, D: prefixes"
              />
              <FeatureCard
                icon="🔀"
                title="SpecKit"
                description="Auto-infer structure"
              />
              <FeatureCard
                icon="📊"
                title="React Flow"
                description="Interactive canvas"
              />
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      <p className="text-xs text-white/60 mt-0.5">{description}</p>
    </div>
  );
}
