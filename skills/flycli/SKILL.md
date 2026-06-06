---
name: FlyCLI
description: Provides instructions for AI agents on how to interact with the FlyCLI tool to automate Betaflight flight controller operations, fetch context, and execute commands over serial ports.
---

# 🛸 FlyCLI Agent Protocol

This skill provides comprehensive instructions for AI agents on how to use **FlyCLI**, a command-line interface tool for interacting with Betaflight flight controllers.

## 🎯 Core Principles

1. **Always use `--json` for parsing**: When fetching data (like context, health, or scan results), append the `--json` flag. FlyCLI will output standard JSON instead of human-readable text, making it robust for you (the AI) to parse.
2. **Understand the target device**: Before executing commands, always run `flycli scan --json` to find the correct serial port of the connected flight controller.
3. **Be careful with execution**: CLI commands sent to the flight controller can change critical parameters. Ensure you validate the command logic before sending it via `flycli execute`.

## 📦 Available Commands

FlyCLI is invoked via `npx flycli` or `node index.js` (if running locally from source), or simply `flycli` if installed globally.

### 1. `scan`
Scans for available serial ports to find connected flight controllers.
- **Command**: `flycli scan --json`
- **Agent Usage**: Always run this first to discover the `<port>`. Look for ports that look like `/dev/tty.usbmodem*` or `COM*` (on Windows).

### 2. `health`
Performs a quick diagnostic of the flight controller.
- **Command**: `flycli health <port> [baud] --json`
- **Agent Usage**: Use this to check the FC status, version, and battery voltage before making changes.

### 3. `context`
Provides documentation and specific context topics about FlyCLI or Betaflight configurations.
- **Command**: `flycli context [topic] --json`
- **Agent Usage**: Use this if you need to learn more about specific commands, safety guidelines, or Betaflight parameters. 

### 4. `execute`
Executes raw CLI commands on the flight controller.
- **Command**: `flycli execute <port> <baud> "<cmd>" --json`
- **Example**: `flycli execute COM3 115200 "diff all" --json`
- **File Input**: You can also pass a file containing multiple CLI commands using `-f <path>` or `--file <path>`.
- **Agent Usage**: Use this to read configurations (`dump`, `diff all`) or apply changes (`set ...`, `save`). Always remember to send `save` if you expect settings to persist.

### 5. `cad`
Starts an interactive CAD modeling session with FreeCAD using the Model Context Protocol (MCP).
- **Command**: `flycli cad`
- **Agent Usage**: This command starts an MCP server on `stdio`. Once started, you (the agent) can use specialized tools to interact with FreeCAD:
    - `render_cadquery`: Executes CadQuery Python code to create or modify 3D models.
    - `get_engine_state`: Returns the list of objects currently in the FreeCAD document.
- **Example Flow**:
    1. Run `flycli cad`.
    2. Use `render_cadquery` with code like:
       ```python
       import cadquery as cq
       result = cq.Workplane("XY").box(10, 10, 10)
       show_object(result)
       ```
    3. The model will appear in the FreeCAD GUI.

    ## 🤝 Human-in-the-Loop CAD Workflow

    To effectively collaborate with a human designer, you must follow the **Synchronize-and-React** protocol:

    1. **Verify Before Act**: Before modifying or adding new geometry, always run `get_engine_state` to see what the user has changed manually.
    2. **Respect Human Intent**: If a human deletes an object you created, do not recreate it without asking. Interpret it as a design correction.
    3. **Contextual Awareness**: If you detect new objects added by the human, acknowledge them. Use their names and properties as context for your next steps (e.g., "I see you added a mounting hole, I will now align the bracket to it").
    4. **Visual Feedback**: Use `process.stderr` to explain what you are doing in plain language while keeping `process.stdout` clean for JSON results.

## 🛡️ Interactive CAD UX Standards
1. **Window Persistence**: NEVER close the FreeCAD window once it's open. Use detached processes to ensure the user doesn't lose their visual context.
2. **Zero-File Policy**: Do NOT create temporary `.json` or `.py` files in the project root for CAD operations. Send commands directly via IPC/MCP tools.
3. **Live Feedback**: Before executing any 3D command, describe it in one sentence to the user.
4. **Interactive Co-creation**: If the user has FreeCAD open, always try to "attach" to the existing session rather than starting a new one.

## 🔄 Recommended Workflow for Agents
    ...
1. **Discover**: Run `flycli scan --json` to get the port.
2. **Verify**: Run `flycli health <port> 115200 --json` to ensure the FC is responding.
3. **Backup/Read**: Run `flycli execute <port> 115200 "diff all" --json` to capture current state.
4. **Modify**: Apply needed settings via `flycli execute <port> 115200 "set ... \n save" --json`.

## 🚨 Troubleshooting

- **Port Busy**: If the port is busy, ensure no other tool (like Betaflight Configurator) is connected to the same port.
- **No Response**: If the FC doesn't respond, verify the baud rate (default is 115200 for Betaflight CLI) and ensure the FC is plugged in properly.
