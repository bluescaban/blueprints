export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950">
      <main className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-8">
          <h1 className="mb-4 text-6xl font-bold text-blue-600 dark:text-blue-400">
            BluePrints
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            by Blue
          </p>
        </div>
        
        <div className="max-w-2xl space-y-6">
          <p className="text-lg text-gray-700 dark:text-gray-200">
            Transform your design workflows into structured specifications and user flows.
          </p>
          
          <div className="grid gap-6 md:grid-cols-3 mt-12">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 text-3xl">🎨</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                FigJam/Figma
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect with design tools via MCP workflows
              </p>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 text-3xl">📋</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                Spec Generation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Auto-generate detailed specifications
              </p>
            </div>
            
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 text-3xl">🔄</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                Mermaid Flows
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Visualize user journeys with Mermaid diagrams
              </p>
            </div>
          </div>
          
          <div className="mt-12 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              🚀 Coming Soon: UI Dashboard for viewing flows and specifications
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
