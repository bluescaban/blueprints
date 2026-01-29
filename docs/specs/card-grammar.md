# BluePrints Card Grammar (DSL v2.0)

> Version 2.0.0

This document describes the BluePrints Domain-Specific Language (DSL) - a structured syntax for labeling sticky notes in FigJam to create interactive user flow diagrams.

## Overview

Each sticky note or text line may start with a **label prefix** followed by a colon (`:`). The parser extracts the label and value, categorizing content automatically.

```
LABEL: value content here
```

## Core Principles

### 1. Everything is Connected
**No node exists in isolation.** Every step, decision, and system action is part of a branching flow. The system will intelligently infer connections when explicit edges (`E:`) are not provided.

### 2. User Journeys are Complete
Every flow must have:
- At least one **entry point** (`START:`)
- At least one **successful end** (`END:`)
- At least one **exit/error path** (`EXIT:` or error handling)

### 3. Explicit Over Implicit
When you provide explicit definitions (e.g., `E:` edges), the system uses ONLY those. When omitted, the system infers intelligently based on context.

---

## Supported Labels

### Context & Framing

| Label | Name | Description |
|-------|------|-------------|
| `CTX:` | Context | High-level framing, assumptions, constraints |
| `G:` | Goal | Business or user goal |

### Actors & Personas

| Label | Name | Description |
|-------|------|-------------|
| `P:` | Persona | Persona definition with optional details |
| `A:` | Actor | Declares a swimlane/actor for subsequent steps |

### Flow Control

| Label | Name | Description |
|-------|------|-------------|
| `F:` / `FLOW:` | Flow Group | Named scenario or user journey |
| `START:` | Start Node | Explicit entry point |
| `END:` | End Node | Successful or neutral completion |
| `EXIT:` | Exit Node | Early exit, interruption, or error |

### Steps & Actions

| Label | Name | Description |
|-------|------|-------------|
| `S:` | Step | User-performed action |
| `SYS:` | System Step | System/app-performed action (automatic) |

### Decisions & Branching

| Label | Name | Description |
|-------|------|-------------|
| `D:` | Decision | Binary branching point (Yes/No question) |
| `CHOICE:` | Choice | Multi-option selection |

### Connections

| Label | Name | Description |
|-------|------|-------------|
| `E:` | Edge | Explicit connection between nodes |

### Risk & Uncertainty

| Label | Name | Description |
|-------|------|-------------|
| `ASSUMPTION:` | Assumption | Design assumption needing validation |
| `Q:` | Question | Open question to resolve |
| `RISK:` | Risk | Potential issue or concern |

### Acceptance Criteria

| Label | Name | Description |
|-------|------|-------------|
| `AC:` | Acceptance Criteria | Testable expectation |

### Legacy/Additional

| Label | Name | Description |
|-------|------|-------------|
| `PR:` | Problem | Pain point |
| `R:` | Requirement | Functional requirement |
| `NFR:` | Non-Functional | Performance, privacy, accessibility |
| `UI:` | UI Element | Interface component |
| `DATA:` | Data Object | Data entity |
| `RULE:` | Business Rule | Business logic constraint |
| `OUT:` | Output | Expected artifact |

---

## Flow Structure

### Creating a Complete Flow

A well-structured flow uses the `F:` prefix to declare a named scenario:

```
F: Solo Karaoke
A: User

START: User opens song detail page

S: (S1) User taps "Karaoke" button
S: (S2) User selects Solo mode
SYS: Check song karaoke availability

D: Is karaoke available?
E: D1 -> S3 [label=Yes]
E: D1 -> EXIT_1 [label=No]

S: (S3) User starts karaoke session
SYS: Sync lyrics with playback

END: Session completed successfully
EXIT: Song not available for karaoke
```

### Flow Groups

Each `F:` declaration creates a new flow context. Steps, decisions, and edges following it belong to that flow until the next `F:` or end of document.

The **Main Flow** aggregates all ungrouped content and provides an overview of the entire system.

---

## Edge Inference Rules

When explicit `E:` edges are NOT provided, SpecKit intelligently infers connections:

### Rule 1: Sequential Flow Within Lanes

Steps in the same lane connect sequentially:
```
S: (S1) User opens app      → connects to →
S: (S2) User views catalog  → connects to →
S: (S3) User selects item
```

### Rule 2: Start Nodes Connect to First Steps

Each `START:` node connects to the first step in its lane:
```
START: User begins checkout
↓
S: (S1) User reviews cart
```

### Rule 3: Decisions Branch to Outcomes

Every `D:` (decision) must have at least TWO outgoing edges:
- **Yes branch**: Continues the happy path
- **No branch**: Routes to error handling, alternative path, or exit

```
D: Payment successful?
├─ Yes → S: Show confirmation
└─ No  → EXIT: Payment failed
```

### Rule 4: Last Steps Connect to End States

The final step in each lane connects to an appropriate end state:
- Happy path → `END:` (success)
- Error/interruption → `EXIT:` (early exit)

### Rule 5: Cross-Lane Handoffs

When a step in one lane triggers a system action:
```
S: User submits form (User lane)
↓
SYS: Validate input (System lane)
↓
SYS: Save to database (System lane)
↓
S: User sees confirmation (User lane)
```

### Rule 6: Decision Outcomes Route Correctly

For decisions with inline branches:
```
D: Is user authenticated? | yes: Dashboard | no: Login
```
Generates edges:
- D1 → Dashboard [label=Yes]
- D1 → Login [label=No]

---

## Acceptance Criteria Requirements

### When to Add AC:

1. **Every Decision Point**: Each `D:` needs AC for both outcomes
   ```
   D: Is permission granted?
   AC: When permission granted → User enters with full features
   AC: When permission denied → User enters in limited mode
   ```

2. **Entry Points**: What state the user must be in
   ```
   START: User opens invite link
   AC: Link must be valid and session must be active
   ```

3. **Exit Points**: What happens on early exit
   ```
   EXIT: User cancels session
   AC: Session data is cleaned up, other participants notified
   ```

4. **Critical System Actions**: Verify expected behavior
   ```
   SYS: Sync lyrics across participants
   AC: All participants see same lyric within 100ms
   ```

---

## Structured Syntax Reference

### Personas (P:)

```
P: Name - description
P: Casual Listener - wants low-pressure karaoke experience
```

### Steps (S:)

```
S: (ID) Description
S: (S1) User taps Karaoke button
S: User selects a song          # ID auto-assigned
```

### Decisions (D:)

```
D: Question?
D: (D1) Is user authenticated?
D: Accept terms? | yes: Continue | no: Exit
```

### Edges (E:)

```
E: from -> to
E: from -> to [label=Label]
E: from -> to [label=Yes, condition=approved]
```

### Choices (CHOICE:)

```
CHOICE: How to share? | Copy Link -> S5 | Share Sheet -> S6 | Cancel -> EXIT_1
```

### Acceptance Criteria (AC:)

```
AC: Condition → Expected result
AC: When user taps Start → Session begins within 2 seconds
```

---

## Example: Complete Flow Document

```
F: Host With Friends
A: Host

START: Host initiates group karaoke

S: (H1) Host taps "Karaoke"
S: (H2) Host selects "With Friends"
SYS: Create karaoke session
SYS: Generate invite link

D: Is microphone permission granted?
E: D1 -> H3 [label=Yes]
E: D1 -> H4 [label=No]

S: (H3) Host enters lobby with mic enabled
S: (H4) Host enters lobby in listen-only mode

S: (H5) Host shares invite link
SYS: Display joined participants

D: Are all participants ready?
E: D2 -> H6 [label=Yes]
E: D2 -> H5 [label=No, waiting]

S: (H6) Host starts karaoke session
SYS: Sync lyrics and playback for all

END: Group session completed
EXIT: Host leaves early
EXIT: Connection lost

AC: When host starts → All participants see countdown
AC: When participant joins → Host sees updated participant list
AC: When connection lost → Remaining participants can continue
```

---

## Best Practices

1. **Define flows explicitly**: Use `F:` to create named user journeys
2. **Declare actors**: Use `A:` to set lane context before steps
3. **Connect decisions**: Every `D:` should have explicit or inferable branches
4. **Include exit paths**: Every flow needs error handling
5. **Add acceptance criteria**: Test coverage for all decision outcomes
6. **Use consistent IDs**: `S1`, `S2`, `D1`, `D2` makes diagrams cleaner
7. **Group related content**: Use FigJam sections for organization

---

## CLI Commands

```bash
# Full pipeline: Parse → Expand → Validate → Save
node scripts/blueprints/cli.mjs pipeline -i extracted.json -f "Feature Name"

# Individual commands
node scripts/blueprints/cli.mjs parse -i extracted.json
node scripts/blueprints/cli.mjs expand -i flowspec.json
node scripts/blueprints/cli.mjs validate -i flowgraph.json
```

---

## Version History

| Version | Changes |
|---------|---------|
| 2.0.0 | Added F:, A:, START:, END:, EXIT:, SYS:, CHOICE:, AC:, ASSUMPTION:. Edge inference rules. Acceptance criteria requirements. |
| 1.0.0 | Initial grammar with basic labels |
