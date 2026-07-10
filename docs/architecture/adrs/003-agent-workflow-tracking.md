# ADR 003: Agent Workflow Tracking & 100% CLI Interception

## Status
Accepted

## Context
FlyCLI is increasingly being operated by autonomous AI agents (like Google Gemini / Antigravity). These agents operate contextually, meaning if a session reboots or another agent takes over, the context of what was done previously is lost. The users required a mechanism to explicitly set plans and log actions (`flycli agent log`, `flycli agent plan`).
However, we discovered that agents often "forget" to explicitly log their actions. The business requirement demands 100% auditability: every command executed through FlyCLI must be tracked, even if the agent fails to explicitly declare it.

## Decision
1. **JSONL Storage with Rotation**:
   We will store the audit logs as local `JSONL` files (`.flycli/agent_logs/agent_workflow_X.jsonl`) instead of using SQLite. This bypasses binary build issues encountered when using `@yao-pkg/pkg` for binary distribution. A manifest file will track the list of all generated logs. Logs rotate automatically when exceeding 1MB.

2. **Interface Decoration for 100% Interception**:
   Instead of using `Commander.js` lifecycle hooks (e.g., `program.hook('preAction')`) which fail to catch built-in arguments like `--version` or `--help` (because they exit the process before hooks run), we will implement a top-level **Interface Decoration** pattern.
   - At the absolute top-level of `index.js`, we read `process.argv.slice(2)`.
   - We log the raw execution arguments directly to `AgentWorkflowService` as `[SYSTEM] CLI Execution`.
   - This guarantees 100% interception regardless of how Commander parses the command or if it early-exits.

## Consequences
- **Positive**: Absolute auditability. Agents cannot secretly execute commands without leaving a local footprint.
- **Positive**: JSONL is easily parsable and append-only, reducing corruption risks.
- **Negative**: Adds a slight overhead to every CLI execution (a few milliseconds to append to a file).
- **Negative**: Need to be careful to filter out internal commands (e.g., `agent log`) from the global interceptor to prevent infinite loops or redundancy.
