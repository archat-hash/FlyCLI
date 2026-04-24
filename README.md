# 🚁 FlyCLI: Your Drone Under Full Control (and AI)

**FlyCLI** is a reliable command-line tool for automated interaction with Betaflight flight controllers. Designed for developers, AI agents, and pilots who value stability and automation.

---

## 🚀 Installation and Setup

To use `flycli` as a global command from any folder:

```bash
# 1. Clone the repository and enter the folder
git clone https://github.com/archat-hash/FlyCLI.git
cd FlyCLI

# 2. Install dependencies
npm install

# 3. Create a symlink for global access
npm link
```

Now you can run the tool simply with the `flycli` command instead of `./index.js`.

---

## 🗺️ Documentation Navigation

Use the following links for a quick dive into the project:

*   🚀 **[Quick Start and User Guide](docs/README.md)**  
    *How to install, scan ports, and execute commands.*
*   🏗️ **[Architecture and Design Decisions](docs/ARCHITECTURE.md)**  
    *Description of the C4 model, Clean Architecture, and connection stability mechanisms.*
*   ⚠️ **[Important Warnings and Safety](docs/README.md#important)**  
    *Must read before using the `defaults` command.*
*   🧪 **[Testing and Verification](docs/README.md#testing-and-reliability)**  
    *About running 40+ tests on real hardware and in simulation.*

---

## 🛠️ Commands (after `npm link`)

| Command | Description |
| --- | --- |
| `flycli scan` | Search for connected flight controllers |
| `flycli execute <port> 115200 "status"` | Execute a CLI command |
| `flycli health` | Complete system checkup (JSON report) |

---

## 🔍 "Bottom-Up": How It Actually Works

Unlike "ideal" schemes, real interaction with a flight controller has its nuances:
- **Debounce 300ms**: We added a synthetic delay after receiving the `# ` prompt because Betaflight often sends data in chunks, and the prompt may appear before the last bytes of the response arrive.
- **Handshake MSP**: Before entering CLI mode, we perform an MSP request `API_VERSION`. This is not just a formality — it allows "waking up" the hardware and ensuring the port is ready for data exchange.
- **Pure ESM**: The project is intentionally written in pure JavaScript (ESM) without TypeScript to minimize build steps and make it as lightweight as possible to run in any Node.js environment.

---

## 🦾 AI-Ready
FlyCLI is designed for convenient work with Large Language Models. Use the `--json` flag to get structured data that your AI agent can instantly analyze.

---
*Created for those who love to fly and code.* 🚁💨

