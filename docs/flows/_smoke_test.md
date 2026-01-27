# BluePrints Mermaid Smoke Test

This file verifies that Mermaid diagrams render correctly in VS Code Markdown preview.

```mermaid
flowchart TD
  A[FigJam BRD notes] --> B[MCP Extract]
  B --> C[FlowSpec JSON]
  C --> D[Mermaid Flow]
  D --> E[VS Code + GitHub Preview]
