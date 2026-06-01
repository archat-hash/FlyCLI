# ADR-001: On-Demand Context Management System

## Status
Proposed

## Context
FlyCLI was built as a tool for agents, but currently lacks a native mechanism to provide its operational context (commands, safety rules) to AI operators in a structured, machine-readable format. Additionally, AI developers working on the repository need a structured way to find relevant codebase documentation without loading all markdown files into their context window.

## Decision
We will implement a two-layer Context Management System:
1. **Developer Context (Repository Level):**
   - Introduce `.agents/KNOWLEDGE_MAP.md` as the primary entry point for AI Developers.
   - It will map domains (e.g., "Architecture", "CLI Commands") to specific document paths.

2. **Operator Context (Application Level):**
   - Implement a new CLI command: `flycli context <topic> [--json]`.
   - The Application Layer will include a new `GetContextUseCase`.
   - Context items will be stored statically within the application or parsed from localized `docs/reference/` files.

## 4+1 View Implications
* **Logical View:** Add `GetContextUseCase` and `IContextRepository` (or static mapping).
* **Process View:** `CLI -> GetContextUseCase -> Return JSON`. No hardware interaction required for this command.
* **Development View:** Add `src/interfaces/cli/context.js` and `src/application/GetContextUseCase.js`.
* **Physical View:** No changes. Command executes entirely on the host node.
* **Scenarios:** "Agent needs to know how to use defaults command" -> `flycli context safety`.

## Consequences
- Positive: AI Agents can autonomously learn how to use the CLI without external prompts.
- Positive: AI Developers save token limits by using the `KNOWLEDGE_MAP`.
- Negative: Documentation must be kept in sync with the `context` command outputs.
