# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BluePrints is a workflow tool that converts FigJam diagrams into structured documentation:
- Extracts BRD (Business Requirements Document) from FigJam
- Generates specs, plans, and tasks (Spec Kit)
- Produces Mermaid user flow diagrams
- Outputs versioned documentation for GitHub

## Repository Structure

```
blueprints/
├── blue-prints/          # Next.js 16 web application (React 19, Tailwind v4)
│   └── app/              # App Router pages and layouts
├── docs/
│   ├── brd/              # Business requirements documents
│   ├── flows/            # Mermaid flow diagrams
│   └── specs/            # Generated specifications
└── output/
    └── flowspec/         # FlowSpec JSON output
```

## Commands

All commands run from the `blue-prints/` directory:

```bash
cd blue-prints

npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint (eslint-config-next)
```

## MCP Integration

The project uses Figma MCP server for FigJam integration (see `.mcp.json`).

## Path Aliases

TypeScript path alias: `@/*` maps to the `blue-prints/` root.
