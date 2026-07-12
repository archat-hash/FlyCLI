# Global Agent Rules

## 1. Interaction with FlyCLI Software Factory
This project uses FlyCLI as the host for an "AI Software Factory" event bus. 

**CRITICAL RULE FOR ALL LLM AGENTS:**
- **NEVER** use file editing tools (like `write_to_file` or `multi_replace_file_content`) to directly read or modify `.flycli/factory_logs/messenger_1.jsonl`.
- The internal structure of the JSONL event bus is an implementation detail that must be hidden.
- To communicate with the Boss or other agents in the Factory, you **MUST** use the official CLI interface via `run_command`:
  - Reading the chat context: `node index.js factory read <epicName>`
  - Posting a message: `node index.js factory post <epicName> <yourRole> "<message>"`
  - Posting a message with a file attachment: `node index.js factory attach <epicName> <yourRole> <filePath> "<optional_message>"`

**AUTOMATIC FACTORY TRIGGER (CRITICAL):**
Whenever the user requests development, documentation restructuring, or codebase changes, you MUST bypass your native "Planning Mode" artifacts and IMMEDIATELY execute the Factory Workflow using the CLI. Do not ask for permission to start the factory; just initialize the Epic and simulate the team conversation via `index.js factory post`. 

Violating this rule breaks the architectural boundaries of the system.

## 2. Global Prompt Processing Lifecycle
Every time you receive a prompt (from the Boss or another Agent), you MUST strictly follow this lifecycle before taking action:

**Step 1.5: Deep Dive Investigation (Mandatory Research)**
- No agent may perform any modification or write any plan without first conducting a "Deep Dive".
- You must physically read relevant files (`cat`, `list_dir`, `grep`) and reconstruct the context (e.g., Objectives -> Milestones -> Epics -> Stories).
- Post your Deep Dive findings to the Factory Event Bus.

**Step 2: Role Validation**
- Ask yourself: "Is this my job?". 
- If the Boss asks a Developer to write business requirements, the Developer MUST refuse and invoke the BA/Analyst (`@BA, Boss requested requirements, this is your domain`).

**Step 3: Peer Control & Prerequisites**
- Check if the previous agent completed their job properly. 

**Step 4: Proof of Work (Evidence-based verification)**
- **NEVER** accept empty statements like "I checked it" or "Done".
- When reporting completion, you **MUST provide concrete proof** (e.g., file paths, line numbers, test execution outputs).
- Reviewing agents (Architect, QA, Orchestrator) **MUST DEMAND PROOF** before approving the next phase.

**Step 5: Team Communication (Handoff)**
- DO NOT just report "Done" to the Boss. 
- You MUST explicitly communicate with the next responsible agent in the pipeline.

**Step 6: Unstoppable Execution (Continuous Factory Loop)**
- **Rule of Non-Stop Execution**: The team MUST NOT pause the workflow or stop working to ask the Boss for permission during an Epic. 
- If a check fails (e.g., static analysis, peer review, incomplete architecture), the Orchestrator autonomously commands the responsible agent to fix it.
- **Core Principles**: The workflow is based on *mutual cross-checking, mutual support, absolute completeness of the task, and high product quality*. 
- The team may only stop working and report back to the Boss when the ultimate goal is achieved and the product is 100% DONE.
