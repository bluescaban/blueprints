import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            BluePrints <span className="text-blue-600">by Blue</span>
          </h1>

          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            A powerful foundation for transforming FigJam/Figma MCP workflows
            into structured specifications, plans, and Mermaid user flows.
          </p>

          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What is BluePrints?
            </h2>
            <p className="text-gray-700 mb-4">
              BluePrints is a comprehensive tool designed to streamline your
              development workflow by converting high-level design concepts
              into actionable documentation and visualizations.
            </p>
            <p className="text-gray-700 mb-4">
              Our workflow follows a clear path:{' '}
              <strong>spec → plan → tasks → flows</strong>
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Tech Stack
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <strong>Next.js</strong> with App Router and React
              </li>
              <li>
                <strong>TypeScript</strong> for type safety
              </li>
              <li>
                <strong>Tailwind CSS v4</strong> for styling
              </li>
              <li>
                <strong>Vitest</strong> for unit testing
              </li>
              <li>
                <strong>Playwright</strong> for end-to-end testing
              </li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Link
              href="/docs"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Documentation
            </Link>
            <a
              href="https://github.com/bluescaban/blueprints"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600">
            BluePrints by Blue &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
