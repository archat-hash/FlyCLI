# 🚀 FlyCLI: Quick Start and User Guide

**FlyCLI** is a powerful Node.js-based command-line tool created for reliable interaction with Betaflight flight controllers.

---

## 1. Installation

### Standard Launch
```bash
git clone https://github.com/archat-hash/FlyCLI.git
cd FlyCLI
npm install
./index.js scan
```

### Global Command (Recommended)
To call `flycli` from anywhere in the system:
```bash
npm link
# Now you can just type:
flycli scan
```

---

## 🔍 How it works "Under the Hood" (Bottom-Up)

Although architecturally FlyCLI looks ideal, the reality of working with hardware dictates its own rules:

### Data Flow and Buffering
Flight controllers send data in chunks. Sometimes the prompt symbol `# ` arrives in the same packet as the data, and sometimes — after 50ms. FlyCLI uses an internal buffer and `EventEmitter` to collect data until the pattern appears.

### Why exactly 300ms delay?
In the code, you will find `await delay(300)` after receiving the prompt. This is "foolproof" protection. Some commands (like `diff`) may finish output already after Betaflight has sent the final `# `. Without this delay, you will get an incomplete response.

### Handshake: Why MSP?
Betaflight is not always ready for CLI immediately. We first send an MSP packet (`API_VERSION`). This forces the firmware to initialize USB buffers and "wake up" for dialogue.

---

## 🤖 Usage with an AI Agent

FlyCLI is ideal for an AI to configure your drone or perform diagnostics.

### Tip for the User:
Give the agent access to this folder and say:
> *"Use flycli to check motor status and provide me with a report."*

### Instruction for the AI Agent:
1. Always start with `flycli scan --json` to find the port.
2. Use `flycli execute <port> 115200 "<cmd>" --json` to get clean data.
3. Parse the `output` array into JSON for analysis.

---

## 🛠️ CLI Commands

| Command | Description |
| --- | --- |
| `scan` | Search for available ports with Betaflight marking |
| `execute <port> <baud> <cmd>` | Execute any CLI command (diff, dump, set, save...) |
| `health` | Comprehensive check: version, status, tasks |
| `--json` | Flag to get the result in a structured format |

---

- **74+ Test Points**:
    - **40 Unit Tests** cover all significant behavior branches, including timeouts and connection breaks.
 *   🧪 **[Testing and Reliability](docs/README.md#testing-and-reliability)**  
    *About running 70+ tests (40 Unit + 34 BDD) on real hardware.*
- **ESLint**: Code complies with Airbnb standards, `_` prefixes replaced with real private fields `#`.

```bash
# 1. Run unit tests and linter
npm test

# 2. Run general BDD scenarios (requires hardware)
npm run test:bdd

# 3. Deep firmware verification (requires hardware)
npm run test:hw

# 4. Full verification cycle
npm run test:full
```

---

## ⚠️ Important
- The `save` command leads to a **controller reboot**.
- ⚠️ **WARNING**: The `defaults` command on **STM32F411 Black Pill** boards may disable USB VCP. Be prepared for re-flashing via DFU.
- Do not connect propellers while working with USB.

---
*Created for those who love to fly and code.* 🚁💨
