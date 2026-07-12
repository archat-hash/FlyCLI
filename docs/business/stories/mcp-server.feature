Feature: MCP Server Implementation
  In order to provide AI Agents with tools
  As the FlyCLI system
  I want to expose local capabilities via the Model Context Protocol

  Scenario: Exposing Factory Event Bus Tools
    Given the FlyCLI is started in MCP mode
    Then "McpServer.js" initializes the standard MCP protocol
    And registers tools from "McpFactoryTools.js" (e.g. read_event_bus, post_message)

  Scenario: Exposing CAD Tools
    Given the FlyCLI is started in MCP mode
    Then "McpServer.js" registers tools from "McpCadTools.js" (e.g. execute_cad_script)
