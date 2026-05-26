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

## 🔄 Recommended Workflow for Agents

1. **Discover**: Run `flycli scan --json` to get the port.
2. **Verify**: Run `flycli health <port> 115200 --json` to ensure the FC is responding.
3. **Backup/Read**: Run `flycli execute <port> 115200 "diff all" --json` to capture current state.
4. **Modify**: Apply needed settings via `flycli execute <port> 115200 "set ... \n save" --json`.

## 🚨 Troubleshooting

- **Port Busy**: If the port is busy, ensure no other tool (like Betaflight Configurator) is connected to the same port.
- **No Response**: If the FC doesn't respond, verify the baud rate (default is 115200 for Betaflight CLI) and ensure the FC is plugged in properly.
