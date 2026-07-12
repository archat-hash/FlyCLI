# Core Features Test Plan

## 1. IFlightController - Port Busy Scenario
**Preconditions**: 
- A mock serial port is created.
- A secondary process locks the mock port.
**Execution**:
1. Execute `flycli connect <mock_port>`
**Expected Result**:
- The CLI must NOT crash with a generic Node.js stack trace.
- The `SerialFlightController` must throw a `ConnectionError`.
- The CLI must output a user-friendly error: "Port is currently busy. Is Betaflight Configurator open?"

## 2. ICadEngine - Lazy Initialization
**Preconditions**:
- `FREECAD_PATH` is set to a valid FreeCAD binary.
- No FreeCAD process is currently running.
**Execution**:
1. Trigger CAD operation via MCP Tool `execute_cad_script`.
**Expected Result**:
- `CadEngineProcess` spawns the FreeCAD process.
- Stdout emits "Ready".
- The script executes and returns result.
- The FreeCAD process is forcefully killed after execution (no zombie processes).

## 3. IAgentStorage - JSONL Rotation
**Preconditions**:
- `~/.flycli/agent_logs/workflow_current.jsonl` is artificially bloated to exactly 1,048,575 bytes.
**Execution**:
1. Execute `flycli health`.
**Expected Result**:
- `AgentStorage` detects the file size will exceed 1MB, rotates the file, and writes the new log.

## 4. ICadEngine - Python Syntax Error
**Preconditions**:
- Provide a Python script with invalid syntax to `execute_cad_script`.
**Expected Result**:
- Subprocess emits stderr.
- `CadEngineProcess` catches stderr and throws `ExecutionError` with the Python stack trace.

## 5. IHealthCheck - Node & Workspace
**Execution**: Run `flycli health`.
**Expected Result**: Returns valid JSON containing Node version and `dependencies_ok: true`.

## 6. IMcpServer - Tool Registration
**Execution**: Run `flycli mcp`.
**Expected Result**: Emits standard MCP `tools/list` response containing `execute_cad_script` and `post_message`.

## 7. IFlightController - Execute CLI Timeout
**Preconditions**: Mock serial port drops incoming writes.
**Execution**: Run `flycli execute "status"`.
**Expected Result**: Throws `TimeoutError` after 5 seconds.

## 8. IMessengerService - Attach Missing File
**Execution**: Agent posts message with `attachFile` pointing to `/tmp/does-not-exist.txt`.
**Expected Result**: Throws `FileNotFound`.

## 9. IContextQuery - Parse JSONL
**Execution**: Run `flycli context my-epic`.
**Expected Result**: Reads `my-epic.jsonl`, parses each line, and outputs chronologically.

## 10. FactoryOrchestrator - Init Epic
**Execution**: Run `flycli factory init new-epic`.
**Expected Result**: Creates `TicketState`, creates `new-epic.jsonl`, status=DRAFT.

## 11. RX Calibration - Timeout
**Execution**: Run `flycli wizard rx`. Do not move sticks.
**Expected Result**: After 15s, exits with `{"status": "timeout"}`.
