# BluePrints by Blue

A Next.js web application for transforming design workflows into structured specifications and user flows.

## 🎯 Overview

BluePrints is designed to integrate with FigJam/Figma MCP workflows, generate detailed specifications, and create Mermaid user flow diagrams. The application will grow to include a UI dashboard for viewing and managing flows and specifications.

## 🚀 Features

- **FigJam/Figma Integration**: Connect with design tools via MCP workflows
- **Spec Generation**: Automatically generate detailed specifications from designs
- **Mermaid User Flows**: Visualize user journeys with Mermaid diagrams
- **Modern UI**: Built with Next.js App Router, TypeScript, and Tailwind CSS v4

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Runtime**: Node.js 20+

## 📦 Getting Started

### Prerequisites

- Node.js 20 or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bluescaban/blueprints.git
cd blueprints
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
blueprints/
├── app/                    # Next.js App Router directory
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── public/                # Static assets
├── .gitignore            # Git ignore file
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies
├── postcss.config.mjs    # PostCSS configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 🔮 Future Development

- UI Dashboard for viewing flows and specifications
- Enhanced FigJam/Figma MCP integration
- Advanced spec generation capabilities
- Interactive Mermaid diagram editing
- API endpoints for programmatic access

## 🤝 Contributing

This is a private project. For questions or contributions, please contact the project owner.

## 📄 License

Private and proprietary. All rights reserved.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
