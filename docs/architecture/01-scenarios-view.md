# 1. Scenarios (Use Case) View

This view connects the architecture to the business goals, mapping directly to the Gherkin features defined in `docs/business/stories/`.

## 1.1 Core Execution & MSP Communication
- **Feature:** `msp-handshake.feature`, `execute-cli.feature`
- **Architectural Mapping:** The `ExecuteCliUseCase` relies on `MspProtocol.js` for the initial `API_VERSION` handshake. If the handshake times out, the `SerialFlightController` bubbles up a `TimeoutError`. If the port is busy, it throws a `ConnectionError`.

## 1.2 Lazy CAD Orchestration
- **Feature:** `cad-orchestration.feature`
- **Architectural Mapping:** AI Agents request CAD tasks via the MCP Server. The `CadEngineProcess` acts as a lazy-init proxy. It checks if the OS process exists; if not, it spawns `FreeCADCmd` via `EnvironmentManager` resolution.

## 1.3 Factory Event Bus & Logging
- **Feature:** `agent-logging.feature`, `messenger-service.feature`
- **Architectural Mapping:** Every command executed via CLI triggers the `AgentWorkflowService`, which uses `AgentStorage` to append serialized `EventMessage` objects to JSONL files, handling 1MB size rotation automatically.
