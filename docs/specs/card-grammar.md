# BluePrints Card Grammar

> Version 1.0.0

This document describes the BluePrints Card Grammar - a simple, deterministic syntax for labeling sticky notes in FigJam so they can be parsed into structured documentation.

## Overview

Each sticky note or text line may start with a **label prefix** followed by a colon (`:`). The parser extracts the label and value, categorizing content automatically.

```
LABEL: value content here
```

## Supported Labels

| Label | Name | Description |
|-------|------|-------------|
| `CTX:` | Context | High-level framing, assumptions, constraints |
| `G:` | Goal | Business or user goal |
| `P:` | Persona | Persona definition |
| `PR:` | Problem | Pain point |
| `R:` | Requirement | Functional requirement |
| `NFR:` | Non-Functional Requirement | Performance, privacy, accessibility, etc. |
| `S:` | Step | A step in a user flow |
| `D:` | Decision | Branching logic (yes/no or choice) |
| `E:` | Edge | Explicit connection between nodes |
| `UI:` | UI Element | UI element or surface |
| `DATA:` | Data Object | Data object or entity |
| `RULE:` | Business Rule | Business rule |
| `RISK:` | Risk | Risk or open concern |
| `Q:` | Question | Open question |
| `OUT:` | Output | Expected output artifact |

## Formatting Rules

### Basic Rules

1. **Case-insensitive**: `g:` and `G:` are equivalent
2. **Whitespace allowed**: `G: Goal` and `G:Goal` both work
3. **No prefix = NOTE**: Unlabeled content is classified as `NOTE`
4. **Multi-line support**: Each line is parsed independently

### Examples

```
G: Increase user engagement by 20%
P: Host - wants to organize fun karaoke nights
S: User opens the app
CTX: Mobile-first design, iOS and Android
R: System must support 10,000 concurrent users
NFR: Page load time under 2 seconds
```

## Structured Payloads

Some labels support additional structured syntax:

### Personas (P:)

Format: `P: Name - details...`

The parser splits on ` - ` to separate name from details.

```
P: Casual Listener - wants a fun, low-pressure way to sing along
P: Host - organizes karaoke nights for friends
```

### Steps (S:)

Format: `S: (ID) Step description`

Optional ID in parentheses at the start.

```
S: (S1) User taps "Karaoke" button
S: (S2) App shows song library
S: User selects a song
```

### Decisions (D:)

Format: `D: Question? | yes:action | no:action`

Optional yes/no branches after pipe separators.

```
D: Has premium account? | yes:Show premium features | no:Show upgrade prompt
D: Is user authenticated?
D: Accept terms? | yes:Continue to app | no:Exit
```

### Edges (E:)

Format: `E: from -> to [label=..., condition=...]`

Explicit connections between nodes with optional attributes.

```
E: S1 -> S2
E: Login -> Dashboard [label=Success]
E: Login -> Error [label=Failed, condition=invalidCredentials]
E: Start -> S1 [label=Begin flow]
```

## Lane Detection

The parser can detect swimlane information from the FigJam node name:

```
Lane: Host         -> lane = "Host"
HOST / Step 1      -> lane = "HOST"
GUEST:             -> lane = "GUEST"
```

## Parsing Behavior

1. **Tolerance**: If an `E:` line can't be parsed, it's stored as a NOTE
2. **Preservation**: All raw text is preserved; no information is lost
3. **Multi-line stickies**: Each line inherits the sticky's node ID/name as metadata

## Output Format (FlowSpec)

The parser produces a `FlowSpec` JSON structure:

```json
{
  "meta": {
    "fileKey": "abc123",
    "generatedAt": "2025-01-26T12:00:00.000Z",
    "grammarVersion": "1.0.0"
  },
  "context": ["Mobile-first design"],
  "goals": ["Increase engagement"],
  "personas": [
    { "name": "Host", "details": "organizes karaoke nights" }
  ],
  "requirements": {
    "functional": ["Support 10K users"],
    "nonFunctional": ["Load time < 2s"]
  },
  "steps": [
    { "id": "S1", "text": "User opens app" },
    { "id": "S2", "text": "User selects song" }
  ],
  "decisions": [
    { "question": "Has premium?", "yes": "Show premium", "no": "Show upgrade" }
  ],
  "edges": [
    { "from": "S1", "to": "S2" }
  ],
  "notes": [],
  "problems": [],
  "uiElements": [],
  "dataObjects": [],
  "rules": [],
  "risks": [],
  "questions": [],
  "outputs": []
}
```

## Usage

### CLI Commands

```bash
# Extract TEXT nodes from raw Figma JSON
npm run extract:figma output/flowspec/YOUR_FILE.json

# Generate FlowSpec and Mermaid from extracted JSON
npm run flow:gen output/extracted/YOUR_FILE_extracted.json
```

### Output Files

- `output/flowspec/<fileKey>_<timestamp>.json` - FlowSpec JSON
- `docs/flows/<fileKey>_<timestamp>.md` - Mermaid markdown

## Best Practices

1. **Use consistent labels**: Pick a label and use it consistently
2. **Keep step IDs sequential**: `S1`, `S2`, `S3` makes flow diagrams cleaner
3. **Define edges explicitly**: For complex flows, use `E:` to specify connections
4. **Group by section in FigJam**: The parser captures section names for context
5. **Use personas**: Helps track who performs each step
