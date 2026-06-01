# 🎯 FlyCLI Strategic Objectives (OKRs)

## Objective 1: Deliver a "Human-in-the-Loop" Setup Process
Ensure that every automated process involving hardware configuration can be safely supervised and interacted with by a human operator, without breaking the automation context.

**Key Results:**
- **KR1.1:** Release the "Interactive RC Calibration" feature by `v1.2.0`.
- **KR1.2:** Maintain 100% JSON machine-readability on `process.stdout` while pushing visual interactive feedback to humans via `process.stderr` or TTY.
- **KR1.3:** Achieve 0 crashes or port locks during the interactive sequence.

## Pivot Logic & Reasoning
If the JSON parsing fails for AI Agents due to visual artifacts, we must immediately pivot to a pure background headless mode for agents, separating human UI completely into a standalone tool.
