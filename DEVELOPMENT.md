# BluePrints Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Overview

BluePrints is a Next.js application designed to integrate with FigJam/Figma via MCP workflows, generate specifications, and create Mermaid user flow diagrams.

## Technology Stack

- **Framework**: Next.js 16.1.5 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint 9.x
- **Runtime**: Node.js 20+

## Project Structure

```
blueprints/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── health/        # Health check endpoint
│   │   └── README.md      # API documentation
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── public/                # Static assets
└── ...config files
```

## Key Features

### Current Implementation

1. **Homepage** (`app/page.tsx`)
   - Responsive design with Tailwind CSS
   - Dark mode support
   - Feature cards for FigJam/Figma, Specs, and Mermaid Flows
   - Modern gradient background

2. **API Routes** (`app/api/`)
   - Health check endpoint at `/api/health`
   - Documented structure for future endpoints

3. **Configuration**
   - Strict TypeScript settings
   - Modern ESLint configuration
   - PostCSS with Tailwind CSS v4
   - System font stack (no external fonts)

### Planned Features

- FigJam/Figma MCP integration endpoints
- Spec generation API and UI
- Mermaid flow visualization
- Dashboard for managing flows and specs
- User authentication
- Database integration

## Development Guidelines

### Adding New Pages

Create files in the `app/` directory:

```typescript
// app/flows/page.tsx
export default function FlowsPage() {
  return <div>Flows Page</div>;
}
```

### Adding API Routes

Create route handlers in `app/api/`:

```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello' });
}
```

### Styling

Use Tailwind CSS utility classes:

```tsx
<div className="flex items-center justify-center bg-blue-500">
  <h1 className="text-2xl font-bold text-white">Title</h1>
</div>
```

### TypeScript

The project uses strict TypeScript settings. Always type your components and functions:

```typescript
interface Props {
  title: string;
  count: number;
}

export default function Component({ title, count }: Props) {
  // ...
}
```

## Testing

Currently, no test framework is configured. Consider adding:
- Jest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests

## Deployment

The project is ready to deploy to:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Docker containers

## Security

- All dependencies are up to date
- CodeQL security scanning configured
- No known vulnerabilities
- Environment variables should be stored in `.env.local` (not committed)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Mermaid Documentation](https://mermaid.js.org/)

## Support

For questions or issues, contact the project owner or refer to the main README.md.
