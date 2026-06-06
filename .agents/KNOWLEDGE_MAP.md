# 🗺️ FlyCLI Knowledge Map

Welcome, AI Developer. Do not load all documentation files into your context. Use this map to find exactly what you need.

## 1. System Architecture & Core Logic
*   **High-Level C4 & State Machines** ➔ `docs/ARCHITECTURE.md`
*   **Architecture Decisions (ADRs)** ➔ `docs/ADR-*.md`
*   **Hardware Interaction (Serial/MSP)** ➔ `docs/ARCHITECTURE.md#4-process-view-hardware-interaction`
*   **System Nuances (Debounce, Fragments)** ➔ `docs/ARCHITECTURE.md#7-implementation-reality-bottom-up-challenges`

## 2. Features & Interfaces
*   **CLI Commands & Routing** ➔ `docs/reference/cli-commands.md`
*   **Context Management System** ➔ `docs/architecture/adrs/ADR-001-Context-System.md`
*   **CAD Modeling & Examples** ➔ `docs/reference/cad-examples.md`

## 3. Operations & Safety
*   **Firmware Audit Log & Vulnerabilities** ➔ `docs/reference/firmware-audit-log.md`
*   **Setup & Quick Start** ➔ `docs/README.md`

## 🤖 Protocol
If you are adding a new core component, you MUST update this `KNOWLEDGE_MAP.md` with a link to the new documentation or ADR.
