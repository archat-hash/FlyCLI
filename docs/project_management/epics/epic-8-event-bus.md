# Epic 8: Factory Event Bus & Logging

**Belongs to:** [Milestone 1.3.0](../milestones/m1.3.0-factory-cad.md)

**Description:**
The system must log all CLI executions transparently into `~/.flycli/agent_logs` and provide a message bus (`node index.js factory`) for inter-agent communication, including Proof of Work validation.

**Stories (Gherkin):**
- [UC-8.1: Agent Command Logging](../../business/stories/agent-logging.feature)
- [UC-8.2: Factory Epic Initialization](../../business/stories/factory-event-bus.feature)
