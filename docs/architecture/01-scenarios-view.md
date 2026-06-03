# 1. Scenarios View (+1 View)

## Context
This view illustrates how the FlyCLI system is used from the perspective of external actors (Human Pilots and AI Agents) interacting with the Flight Controller hardware.

## 1.1 Core CLI Execution Scenario (Global)
This represents the primary use case: sending atomic text commands and retrieving structured results.

```mermaid
graph TD
    User([Pilot / AI Agent]) -- "CLI Commands (e.g., status, dump)" --> FlyCLI[FlyCLI Tool]
    FlyCLI -- "Serial/MSP Protocol" --> FC[Flight Controller]
    FC -- "Telemetry / CLI Data" --> FlyCLI
    FlyCLI -- "Parsed JSON or Text" --> User
```

## 1.2 Interactive RC Calibration Scenario (New Feature)
This flow highlights orchestration: the AI Agent triggers an interactive command, but the Human provides the physical input. FlyCLI acts as the bridge, providing visual feedback to the Human while collecting structured data for the Agent.

```mermaid
sequenceDiagram
    actor Human as Pilot
    participant Agent as AI Agent
    participant CLI as FlyCLI Process
    participant FC as Flight Controller

    Agent->>CLI: flycli wizard rx <port> --json
    CLI->>FC: Open Serial Port
    CLI->>CLI: Initialize State Machine
    
    loop Every 50ms (Polling)
        CLI->>FC: Request MSP_RC (ID: 105)
        FC-->>CLI: Binary Channel Data
        CLI->>Human: Render ANSI Progress Bars (via process.stderr)
        Human->>Human: Observes live feedback
    end

    Human->>FC: Moves Transmitter Sticks Physically
    CLI->>CLI: State Machine detects min/max limits reached
    
    CLI->>FC: Close Serial Port
    CLI->>CLI: Clear ANSI terminal lines
    CLI-->>Agent: Print JSON Summary (via process.stdout)
    Agent->>Human: Confirm successful connection via Chat
```
