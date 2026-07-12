# 2. Logical View

The Logical View outlines the Hexagonal Architecture (Ports and Adapters) of FlyCLI.

## 2.1 Core Domain Entities

### `EventMessage` (Entity)
| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Unique identifier for the log entry |
| `epicName` | `String` | The Epic to which this event belongs |
| `agentRole` | `String` | The role (BA, Architect, Developer, etc.) |
| `content` | `String` | The actual message or terminal output |
| `timestamp` | `ISO8601` | Time of creation |
| `attachments`| `Array<String>` | Optional array of absolute file paths |

## 2.2 Core Interfaces (Ports)

### `IFlightController`
| Method | Parameters | Returns | Throws |
| :--- | :--- | :--- | :--- |
| `connect` | `portName: string` | `Promise<void>` | `ConnectionError` if port busy |
| `disconnect` | `none` | `Promise<void>` | `none` |
| `execute` | `command: string` | `Promise<string>` | `TimeoutError` if no response |

### `IAgentStorage` (Logging)
| Method | Parameters | Returns | Throws |
| :--- | :--- | :--- | :--- |
| `appendLog` | `msg: EventMessage` | `Promise<void>` | `StorageError` |
| `rotateLog` | `none` | `Promise<void>` | `StorageError` if no space |

### `ICadEngine` (FreeCAD)
| Method | Parameters | Returns | Throws |
| :--- | :--- | :--- | :--- |
| `spawn` | `none` | `Promise<void>` | `ConfigurationError` if FreeCAD missing |
| `executeScript` | `pythonScript: string` | `Promise<string>` | `ExecutionError` |

### `IMcpServer` (AI Context)
| Method | Parameters | Returns | Throws |
| :--- | :--- | :--- | :--- |
| `registerTool` | `name: string, handler: Function` | `void` | `none` |
| `start` | `stdio mode` | `Promise<void>` | `none` |

### `IMessengerService` (Factory Bus)
| Method | Parameters | Returns | Throws |
| :--- | :--- | :--- | :--- |
| `postMessage` | `epic: string, role: string, msg: string` | `Promise<void>` | `none` |
| `attachFile` | `epic: string, filepath: string` | `Promise<void>` | `FileNotFound` |

### `IPortScanner`
| Method | Parameters | Returns | Throws |
| :--- | :--- | :--- | :--- |
| `scan` | `none` | `Promise<Array<PortInfo>>` | `HardwareError` |

## 2.3 Application Layer (Use Cases)
- **Commands**: `ExecuteCliUseCase.js`, `FactoryOrchestrator.js`
- **Queries**: `ListPortsUseCase.js`, `GetHealthCheckUseCase.js`
*Rule: Use Cases coordinate between domain and secondary adapters but contain zero I/O logic.*

## 2.3 Secondary Adapters (Infrastructure)
- **Communication**: `SerialFlightController.js` (implements IFlightController), `MspProtocol.js`, `PortScanner.js`.
- **Storage**: `AgentStorage.js`, `FactoryStorage.js` (handles raw JSONL File I/O).
- **CAD**: `CadEngineProcess.js` (manages the FreeCAD Python subprocess).

## 2.4 Primary Adapters (Interfaces)
- **CLI**: `execute.js`, `scan.js`, `wizard.js` (Parses args, passes to Use Cases).
- **MCP**: `McpServer.js`, `McpFactoryTools.js` (Exposes Use Cases to LLMs).
