# 3. Process View

## Context
This view explains the flow of data across asynchronous processes, focusing on hardware communication resilience and output stream separation.

## 3.1 Hardware Interaction (Command Lifecycle)
FlyCLI implements resilient processing of asynchronous events and fragmented data.

```mermaid
sequenceDiagram
    participant CLI as interfaces/cli/execute.js
    participant UC as ExecuteCliUseCase
    participant SFC as SerialFlightController
    participant HW as Flight Controller

    CLI->>SFC: new SerialFlightController(...)
    CLI->>UC: new ExecuteCliUseCase(SFC, ...)
    CLI->>UC: execute("status")

    UC->>SFC: connect()
    SFC->>HW: MSP Handshake (API_VERSION)
    HW-->>SFC: ACK (0x65)

    UC->>SFC: sendRaw("status\n")
    HW-->>SFC: Data Chunks...
    HW-->>SFC: Final Prompt "# "

    SFC-->>UC: Full Response String
    UC-->>CLI: Parsed JSON/Text
```

### Implementation Realities:
- **Data Fragmentation:** USB-VCP requires processing chunks of 64/128 bytes. `SerialFlightController` accumulates data in `#buffer` until the prompt pattern appears.
- **Debounce:** A delay of **300ms** is added in `ExecuteCliUseCase` after prompt detection to collect the "tail" of data.

## 3.2 Data Stream Separation (Interactive UI)
For interactive features (like the RC Wizard), visual elements must not corrupt machine-readable output formats.

```mermaid
graph TD
    A[FlyCLI Process] -->|Asynchronous Event Loop| B(MSP Polling Timer ~20Hz)
    B --> C{Output Routing}
    C -->|Visual Progress Bars| D[process.stderr / TTY]
    C -->|Final JSON payload| E[process.stdout]
```

- `process.stderr.write` is used synchronously to draw ANSI bars.
- `console.log` (stdout) is strictly reserved for the final output string/JSON.
