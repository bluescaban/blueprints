import Link from 'next/link';

export default function DocsPage() {
  const docSections = [
    {
      title: 'BRD (Business Requirements Document)',
      path: 'docs/brd/',
      description: 'Extracted business requirement notes and documentation.',
    },
    {
      title: 'Flows',
      path: 'docs/flows/',
      description: 'Mermaid flow diagrams and user flow documentation.',
    },
    {
      title: 'Specs',
      path: 'docs/specs/',
      description:
        'Technical specifications and project plans following the spec → plan → tasks → flows workflow.',
    },
    {
      title: 'FlowSpec Output',
      path: 'output/flowspec/',
      description: 'Machine-readable flow JSON files for programmatic access.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Documentation
          </h1>

          <p className="text-lg text-gray-700 mb-12">
            Browse the documentation folders to explore specs, flows, and
            generated outputs.
          </p>

          <div className="grid gap-6">
            {docSections.map((section) => (
              <div
                key={section.path}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {section.title}
                </h2>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <div className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-2 rounded">
                  {section.path}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Workflow Overview
            </h2>
            <p className="text-gray-700">
              BluePrints follows a structured approach:{' '}
              <span className="font-mono font-semibold">
                spec → plan → tasks → flows
              </span>
            </p>
            <p className="text-gray-700 mt-2">
              This ensures every project starts with clear requirements and
              ends with actionable, visualized workflows.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
