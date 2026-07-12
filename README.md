# 🚁 FlyCLI: The AI-Ready Drone Factory

**FlyCLI** is a reliable command-line tool for automated interaction with flight controllers using the **MSP (MultiWii Serial Protocol)**. It serves as an **AI Software Factory** host, providing an event bus for multi-agent workflows, Model Context Protocol (MCP) servers for CAD tools (FreeCAD), and Human-in-the-Loop interactive wizards.

---

## 🚀 Installation and Setup

To use `flycli` as a global command from any folder:

```bash
# 1. Clone the repository
git clone https://github.com/archat-hash/FlyCLI.git
cd FlyCLI

# 2. Install dependencies
npm install

# 3. Create a symlink for global access
npm link
```

*Note: For `flycli cad` features, you must have FreeCAD installed and `FREECAD_PATH` configured if it's not in the default location.*

---

## 🗺️ Documentation Navigation

This project strictly adheres to the **4+1 View Model** and Hexagonal Architecture (DDD). Documentation is structured into precise layers:

*   🏛️ **[Architecture Views](docs/architecture/)**  
    *Logical, Process, Development, and Physical Views (C4 & UML).*
*   📊 **[Business Logic & Use Cases](docs/business/)**  
    *OKRs, Gherkin Scenarios, and Feature Requirements.*
*   🧪 **[QA & Test Plans](docs/harness/test_plans/)**  
    *Step-by-step TestLink-style plans corresponding to Gherkin Use Cases.*

---

## 🛠️ Key Commands

| Command | Description |
| --- | --- |
| `flycli scan` | Search for connected flight controllers |
| `flycli execute <port> 115200 "status"` | Execute a CLI command on the drone |
| `flycli wizard rx <port> --json` | Launch Human-in-the-Loop RC calibration |
| `flycli factory mcp_cad_command ...` | Run MCP server to interact with FreeCAD |
| `flycli factory start <epicName>` | Start an AI Multi-Agent Factory Workflow |

---

## 🔍 Hexagonal Architecture & Design

FlyCLI is built on Domain-Driven Design (DDD) principles:
- **Interfaces**: CLI and Terminal UIs are completely decoupled from business logic.
- **Application**: Wizards (`rxCalibrationMachine`), Execute commands, and the AI Factory Orchestrator.
- **Infrastructure**: Serial Port implementations, Storage rotation, and MCP tools.

### AI-First & Human-in-the-Loop
- **Strict Data Segregation**: When `--json` is active, visual UI elements (like progress bars) are pushed to `stderr`, leaving `stdout` 100% clean for LLM Agents to parse.
- **Persistent AI Context**: The `FactoryStorage` mechanism logs all workflow events in rotation-based JSONL files (`.flycli/factory_logs`) without blowing up the repository size.
- **Lazy Load CAD**: FreeCAD is a heavy resource; FlyCLI manages it as a lazy child process, spawning only when a specific CAD tool is invoked.

---
*Created for autonomous agents, pilots, and those who love to fly and code.* 🚁💨
