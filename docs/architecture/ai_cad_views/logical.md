# 1. Logical View: AI CAD Integration

The Logical View describes the core components and their responsibilities.

## Components

1. **FlyCLI Core (JS):**
   - Parses the `flycli cad` command.
   - Manages the interaction with the Gemini API.

2. **FreeCAD Manager (JS):**
   - Responsible for the lifecycle of the FreeCAD process.
   - Checks for the existence of the portable FreeCAD installation.
   - Downloads and extracts it if missing.
   - Spawns the `FreeCAD.exe` process.

3. **IPC Bridge (JS <-> Python):**
   - **Node Side:** An IPC Server (TCP/WS) hosted by FlyCLI.
   - **Python Side:** A listener script injected into FreeCAD on startup (`freecad_listener.py`).
   - Translates MCP tool calls from Gemini into Python execution requests.

4. **CadQuery Execution Engine (Python inside FreeCAD):**
   - Receives CadQuery scripts from the IPC Bridge.
   - Executes them in the context of the active FreeCAD document.
   - Updates the 3D viewport.

5. **External AI Agent (Any LLM Client):**
   - Connects to FlyCLI via Model Context Protocol (MCP) using standard input/output (stdio).
   - Generates CadQuery scripts via MCP tool calls.
   - Consumes FreeCAD document state (e.g., bounding box, object tree) to refine models.
