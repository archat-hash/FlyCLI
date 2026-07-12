# Epic 6: MCP Server Implementation

**Belongs to:** [Milestone 1.3.0](../milestones/m1.3.0-factory-cad.md)

**Description:**
The system must expose Model Context Protocol (MCP) tools for agents. Specifically, the implementation MUST rely on `McpFactoryTools.js` for reading/writing the Factory Event Bus, and `McpCadTools.js` for orchestrating the FreeCAD subprocess.

**Stories (Gherkin):**
- [UC-6.1: Factory Tool Exposure](../../business/stories/mcp-factory.feature)
- [UC-6.2: CAD Tool Exposure](../../business/stories/mcp-cad.feature)
