import LandingPageContent from "./components/LandingPageContent";

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
        <LandingPageContent />
      </main>
    </div>
  );
}
