# 3. Process View

The Process View explains concurrency, event loops, and asynchronous operations.

## 3.1 Polling & Serial Communication (RC Calibration)
- The `rxCalibrationMachine.js` utilizes a non-blocking interval to poll `MSP_RC`.
- Data is received asynchronously. `SerialFlightController` buffers the data stream and triggers events when a full MSP frame is parsed by `MspProtocol.js`.
- If no frame is received within 15s, a state machine timeout kills the interval to prevent memory leaks.

## 3.2 FreeCAD Subprocess Lifecycle
- The main Node.js process does NOT load FreeCAD libraries.
- When `McpCadTools.js` receives a request, it calls `CadEngineProcess`.
- A child process is spawned asynchronously (`child_process.spawn`). The Node process monitors `stdout`. Once "Ready" is detected, it communicates via IPC/stdin.
- The subprocess is terminated explicitly to prevent zombie processes.

## 3.3 Factory Event Bus Concurrency
- `MessengerService` uses atomic file appends (`fs.appendFile`) to write to JSONL.
- Because Node is single-threaded, file writes to the same JSONL epic log do not face race conditions from within the same CLI invocation, but file rotation requires strict mutex locking if a background Daemon is ever introduced.
