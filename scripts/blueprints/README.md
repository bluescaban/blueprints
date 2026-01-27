# BluePrints Pipeline v2.0

Transform FigJam diagrams into structured, validated FlowGraphs.

## Pipeline Overview

```
FigJam Extract → FlowSpec → FlowGraph → Validation → Versioned Output
     (JSON)        (parse)    (expand)   (validate)      (save)
```

## Quick Start

```bash
# Run full pipeline
npm run bp:pipeline -- -i extract.json -f "User Onboarding"

# Individual steps
npm run bp:parse -- -i extract.json -o flowspec.json
npm run bp:expand -- -i flowspec.json -o flowgraph.json
npm run bp:validate -- -i flowgraph.json
```

## Modules

### parseCards.mjs (v2.0.0)
Parses card grammar from FigJam extracts into FlowSpec JSON.

**Supported Labels:**
| Label | Description | Example |
|-------|-------------|---------|
| `CTX:` | Context | `CTX: Mobile app for social listening` |
| `G:` | Goal | `G: Enable users to listen together` |
| `P:` | Persona | `P: Host - initiates sessions` |
| `PR:` | Problem | `PR: Users can't listen with friends` |
| `R:` | Requirement | `R: Users can invite friends via link` |
| `NFR:` | Non-functional req | `NFR: Audio sync within 200ms` |
| `S:` | Step | `S: User opens app` |
| `D:` | Decision | `D: Solo or with friends?` |
| `E:` | Edge | `E: S1 -> S2 [Yes]` |
| `F:` | Flow group | `F: Onboarding Flow` |
| `A:` | Actor | `A: Host, Guest, System` |
| `UI:` | UI element | `UI: Play button` |
| `DATA:` | Data object | `DATA: Session object` |
| `RULE:` | Business rule | `RULE: Max 8 participants` |
| `RISK:` | Risk | `RISK: Network latency` |
| `Q:` | Question | `Q: What if user loses connection?` |
| `OUT:` | Output | `OUT: User flow diagram` |

**Inline Actor Tags:**
```
S: User taps play button [actor=Host]
```

### expandFlowGraph.mjs (v2.0.0)
Expands FlowSpec into a complete FlowGraph with:
- Multiple flow groups (scenarios)
- Swimlanes (actors)
- Start and end nodes
- System step inference
- Auto-generated edges when none explicit

### validateFlowGraph.mjs (v1.0.0)
Validates FlowGraph structure. Fails on:
- Missing node references in edges
- Decision nodes with < 2 outgoing edges
- Flows without start or end
- Disconnected nodes
- Empty System lane

### outputVersioning.mjs (v1.0.0)
Saves FlowGraphs with versioning:
```
output/flowgraph/<feature>/
  ├── 20260127-143052.json
  ├── 20260127-150123.json
  ├── latest.json → 20260127-150123.json
  └── history.json
```

## CLI Usage

```bash
node scripts/blueprints/cli.mjs <command> [options]
```

### Commands

| Command | Description |
|---------|-------------|
| `parse` | Parse FlowSpec from extracted JSON |
| `expand` | Expand FlowSpec to FlowGraph |
| `validate` | Validate a FlowGraph |
| `pipeline` | Run full pipeline |
| `version` | Show version info |
| `help` | Show help |

### Options

| Option | Description |
|--------|-------------|
| `-i, --input` | Input file path |
| `-o, --output` | Output file/directory |
| `-f, --feature` | Feature name for versioning |
| `--strict` | Fail on validation errors |
| `--no-save` | Skip versioned output |
| `-q, --quiet` | Suppress output |

### Examples

```bash
# Full pipeline with feature name
node scripts/blueprints/cli.mjs pipeline -i extract.json -f "Social Listening"

# Parse only
node scripts/blueprints/cli.mjs parse -i extract.json -o flowspec.json

# Validate existing FlowGraph
node scripts/blueprints/cli.mjs validate -i flowgraph.json

# Expand with custom output
node scripts/blueprints/cli.mjs expand -i flowspec.json -o output/custom.json
```

## FlowSpec Structure

```json
{
  "meta": {
    "fileKey": "abc123",
    "generatedAt": "2026-01-27T...",
    "grammarVersion": "2.0.0"
  },
  "context": ["Mobile app context"],
  "goals": ["Enable social listening"],
  "personas": [{ "name": "Host", "details": "..." }],
  "actors": ["Host", "Guest", "System"],
  "flowGroups": [
    {
      "id": "F1",
      "name": "Session Creation",
      "steps": ["S1", "S2"],
      "decisions": ["D1"],
      "edges": []
    }
  ],
  "steps": [
    { "id": "S1", "text": "User opens app", "lane": "User" }
  ],
  "decisions": [
    { "id": "D1", "question": "Solo or friends?", "yes": "S2", "no": "S3" }
  ],
  "edges": [
    { "from": "S1", "to": "D1" }
  ],
  "requirements": {
    "functional": ["..."],
    "nonFunctional": ["..."]
  }
}
```

## FlowGraph Structure

```json
{
  "meta": {
    "project": "BluePrints",
    "feature": "Social Listening",
    "generatedAt": "2026-01-27T...",
    "specKitVersion": "2.0.0"
  },
  "flows": [
    {
      "id": "main",
      "name": "Main Flow",
      "starts": ["START"],
      "ends": ["END_SUCCESS"],
      "nodes": [...],
      "edges": [...]
    }
  ],
  "lanes": ["User", "Host", "Guest", "System"],
  "nodes": [
    {
      "id": "S1",
      "type": "step",
      "lane": "User",
      "label": "User opens app",
      "inferred": false
    }
  ],
  "edges": [
    { "from": "START", "to": "S1" }
  ],
  "assumptions": ["..."],
  "openQuestions": ["..."],
  "risks": ["..."]
}
```

## Validation Error Codes

| Code | Description |
|------|-------------|
| E001 | Edge references missing node |
| E002 | Decision has < 2 outgoing edges |
| E003 | Flow has no start node |
| E004 | Flow has no end node |
| E005 | Disconnected node |
| E006 | Empty System lane |
| E007 | Orphan start (no outgoing edges) |
| E008 | Orphan end (no incoming edges) |
| E009 | Self-loop detected |
| E010 | Duplicate edge |

## Version History

- **v2.0.0** - Flow groups, actors, validation, versioning
- **v1.0.0** - Initial release with basic parsing and expansion
