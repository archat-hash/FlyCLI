# 5. Physical View

The Physical View maps the software onto the hardware and execution environment.

## 5.1 Host Machine (User's PC / Mac)
- **Node.js Environment**: The primary runtime. Executes the FlyCLI application.
- **File System**:
  - `~/.flycli/agent_logs/`: Persistent volume for Agent JSONL logs.
  - `~/.flycli/factory_logs/`: Persistent volume for Factory Epic logs.
- **USB / Serial Hardware**:
  - The OS maps the Flight Controller to a device node (e.g., `/dev/ttyACM0` or `COM3`).
  - FlyCLI requires direct R/W access to this node.

## 5.2 Child Environments
- **FreeCAD Subprocess**: Runs as a separate OS process, isolated from Node.js memory. Consumes significant RAM only when activated.
- **AI Agent (Remote/Local)**: Operates entirely outside the Node process, connecting either via STDIO (MCP Server) to control the Factory.
