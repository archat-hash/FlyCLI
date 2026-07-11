# 📊 Business Requirements: Interactive RC Calibration

## 1. Context
Currently, AI Agents configuring Flight Controllers (FC) lack the ability to verify physical radio (RC) connections without explicitly dropping the user out of the automated flow and into Betaflight Configurator. We need an interactive wizard within FlyCLI that allows a "Human-in-the-Loop" verification.

## 2. User Stories
- **As an AI Agent**, I want to execute `flycli wizard rx <port> --json` so that the process blocks until the user physically verifies the sticks, and then returns a strictly typed JSON object containing the `min`, `max`, and `center` values for the axes.
- **As a Pilot (User)**, I want to see real-time visual progress bars in the terminal when the AI Agent initiates an RC check, so that I know my transmitter movements are being registered by the drone.

## 3. Success Metrics (Acceptance Criteria)
- **AC1:** The command `flycli wizard rx` successfully connects to the FC using the MSP protocol (specifically `MSP_RC` ID 105).
- **AC2:** Standard output (`stdout`) MUST NOT contain any visual elements, ANSI escape codes, or progress bars. It must remain 100% strictly formatted JSON.
- **AC3:** Visual progress bars MUST be rendered to `stderr` or a direct TTY stream.
- **AC4:** The process must terminate successfully either when all 4 primary axes (Roll, Pitch, Yaw, Throttle) reach their extremums (<1100 and >1900), or via a 15-second timeout, returning the collected data.

## 4. Constraints
- Must not break the existing textual CLI execution architecture (`src/interfaces/cli/execute.js`).
- Must operate over the same USB VCP connection without requiring external tools.

## 5. Agent Workflow Tracking (New Feature)
- **As an Autonomous Agent**, I want to explicitly log my active plan and completed actions (`flycli agent plan set`, `flycli agent log`) so that if I am restarted or a new agent takes over, the context is preserved locally.
- **As a System Auditor**, I want 100% of CLI command executions to be automatically intercepted and logged without relying on the agent's explicit logging commands, ensuring absolute accountability.
- **As an AI Agent**, I want to retrieve a clean, machine-readable summary of my recent context (`flycli agent context`) without ANSI colors or verbose formatting.
