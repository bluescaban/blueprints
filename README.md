# BluePrints by Blue

A powerful foundation for transforming FigJam/Figma MCP workflows into structured specifications, plans, and Mermaid user flows.

## Overview

BluePrints is designed to streamline your development workflow by converting high-level design concepts into actionable documentation and visualizations. Our workflow follows a clear path:

**spec → plan → tasks → flows**

This ensures every project starts with clear requirements and ends with actionable, visualized workflows.

## Tech Stack

- **Next.js** (latest stable) with App Router
- **React** (latest stable)
- **TypeScript** for type safety
- **Tailwind CSS** for modern styling
- **Vitest** for unit testing
- **Playwright** for end-to-end testing
- **ESLint** and **Prettier** for code quality

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/bluescaban/blueprints.git
cd blueprints

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests with Vitest
- `npm run test:e2e` - Run end-to-end tests with Playwright

## Project Structure

```
blueprints/
├── src/
│   └── app/              # Next.js App Router pages
│       ├── layout.tsx    # Root layout
│       ├── page.tsx      # Home page
│       └── docs/         # Documentation page
├── docs/
│   ├── brd/              # Business Requirements Documents
│   ├── flows/            # Mermaid flow diagrams
│   │   └── _smoke_test.md
│   └── specs/            # Technical specifications
│       └── README.md
├── output/
│   └── flowspec/         # Machine-readable flow JSON
├── e2e/                  # Playwright E2E tests
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
└── ...config files
```

## Features

### Current

- ✅ Modern Next.js setup with TypeScript
- ✅ Tailwind CSS v4 for styling
- ✅ Home page introducing BluePrints
- ✅ Documentation page with links to all doc folders
- ✅ Comprehensive test setup (unit + e2e)
- ✅ CI/CD with GitHub Actions
- ✅ Code quality tools (ESLint, Prettier)

### Future Plans

- 🔄 FigJam/Figma MCP workflow integration
- 🔄 Automatic spec generation
- 🔄 Mermaid user flow generation
- 🔄 UI dashboard for viewing flows and specs
- 🔄 Real-time collaboration features
- 🔄 AI-powered documentation

## Documentation

All documentation is organized in the `docs/` folder:

- **BRD** (`docs/brd/`) - Business requirement notes
- **Flows** (`docs/flows/`) - Mermaid flow diagrams
- **Specs** (`docs/specs/`) - Technical specifications and plans
- **Output** (`output/flowspec/`) - Machine-readable flow JSON

## Testing

### Unit Tests

```bash
npm test
```

Unit tests are located in `src/__tests__/` and use Vitest with React Testing Library.

### E2E Tests

```bash
npm run test:e2e
```

E2E tests are located in `e2e/` and use Playwright to test the application in a real browser.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Contact

Project Link: [https://github.com/bluescaban/blueprints](https://github.com/bluescaban/blueprints)

---

**BluePrints** - Transforming design concepts into actionable workflows
