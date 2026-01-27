import Link from "next/link";

export default function Home() {
  return (
    <div
      className="flex min-h-screen items-center justify-center font-sans p-8"
      style={{
        backgroundColor: '#4A85C8',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Glassmorphism Card */}
      <main
        className="w-full max-w-2xl rounded-3xl border-2 border-white/40 p-12"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        }}
      >
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
            View Flow →
          </Link>

          {/* Divider */}
          <div className="w-full h-px bg-white/20 my-4" />

          {/* Quick Start */}
          <div className="w-full text-left">
            <h2 className="text-sm font-semibold text-white/90 mb-3 uppercase tracking-wide">
              Quick Start
            </h2>
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
          </div>

          {/* Features */}
          <div className="mt-4 grid grid-cols-3 gap-3 w-full">
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
      </main>
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
