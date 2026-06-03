# 🎯 FlyCLI Strategic Objectives (OKRs)

## Objective 1: Deliver a "Human-in-the-Loop" Setup Process
Ensure that every automated process involving hardware configuration can be safely supervised and interacted with by a human operator, without breaking the automation context.

**Key Results:**
- **KR1.1:** Release the "Interactive RC Calibration" feature by `v1.2.0`.
- **KR1.2:** Maintain 100% JSON machine-readability on `process.stdout` while pushing visual interactive feedback to humans via `process.stderr` or TTY.
- **KR1.3:** Achieve 0 crashes or port locks during the interactive sequence.

## Pivot Logic & Reasoning
If the JSON parsing fails for AI Agents due to visual artifacts, we must immediately pivot to a pure background headless mode for agents, separating human UI completely into a standalone tool.

## Objective 2: Empower Amateurs with AI-Assisted CAD Design
Transform FlyCLI from a mere configuration tool into a hardware development assistant by integrating an AI-driven, interactive 3D modeling workflow.

**Key Results:**
- **KR2.1:** Implement the `flycli cad` command that seamlessly orchestrates the FreeCAD GUI from Node.js by `v1.3.0`.
- **KR2.2:** Establish a reliable IPC/CadQuery bridge allowing the AI (Gemini) to generate and instantly visualize solid models without user scripting.
- **KR2.3:** Ensure a zero-friction distribution strategy where users don't need to manually configure FreeCAD paths or Python environments.
